package com.example.demo.service;

import com.example.demo.dto.PlagiarismCheckRequest;
import com.example.demo.dto.PlagiarismAnalysisResponse;
import com.example.demo.model.Assignment;
import com.example.demo.model.StudentSubmission;
import com.example.demo.model.SubmissionFile;
import com.example.demo.model.User;
import com.example.demo.model.Course;
import com.example.demo.repository.AssignmentRepository;
import com.example.demo.repository.StudentSubmissionRepository;
import com.example.demo.repository.CourseTeacherRepository;
import com.example.demo.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Async;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.stream.Collectors;

@Service
@Slf4j
public class PlagiarismService {

    private final AssignmentRepository assignmentRepository;
    private final StudentSubmissionRepository submissionRepository;
    private final com.example.demo.repository.SubmissionFileRepository submissionFileRepository;
    private final CourseTeacherRepository courseTeacherRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    
    // In-memory storage for analysis status (in production, use Redis or database)
    private final Map<String, PlagiarismAnalysisResponse> analysisResults = new ConcurrentHashMap<>();
    
    // Supported file extensions for code analysis
    private final Set<String> CODE_EXTENSIONS = Set.of("cpp", "c", "h", "java", "py", "js", "ts", "kt", "cs", "php", "rb", "go", "sh", "txt", "md", "sql", "html", "css", "xml", "json", "yaml", "yml");
    
    // Text file extensions (for direct text comparison)
    private final Set<String> TEXT_EXTENSIONS = Set.of("txt", "md", "doc", "docx", "rtf", "tex");
    
    // Binary file extensions (for hash comparison)
    private final Set<String> BINARY_EXTENSIONS = Set.of("pdf", "zip", "rar", "tar", "gz", "exe", "bin", "jpg", "png", "gif", "mp3", "mp4", "avi");
    
    // All supported extensions (combination of all types)
    private final Set<String> ALL_EXTENSIONS;
    
    // Constructor to initialize ALL_EXTENSIONS
    public PlagiarismService(AssignmentRepository assignmentRepository, 
                           StudentSubmissionRepository submissionRepository,
                           com.example.demo.repository.SubmissionFileRepository submissionFileRepository,
                           CourseTeacherRepository courseTeacherRepository,
                           UserRepository userRepository,
                           NotificationService notificationService) {
        this.assignmentRepository = assignmentRepository;
        this.submissionRepository = submissionRepository;
        this.submissionFileRepository = submissionFileRepository;
        this.courseTeacherRepository = courseTeacherRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        
        // Combine all extension sets
        this.ALL_EXTENSIONS = new HashSet<>();
        this.ALL_EXTENSIONS.addAll(CODE_EXTENSIONS);
        this.ALL_EXTENSIONS.addAll(TEXT_EXTENSIONS);
        this.ALL_EXTENSIONS.addAll(BINARY_EXTENSIONS);
    }

    public String startPlagiarismAnalysis(Long assignmentId, PlagiarismCheckRequest request) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
            .orElseThrow(() -> new RuntimeException("Assignment not found"));
        
        // Get the teacher and course
        User teacher = userRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        Course course = assignment.getCourse();
        
        // Verify teacher has access to this assignment's course (same pattern as AssignmentService)
        boolean isAssigned = courseTeacherRepository.existsByCourseAndTeacherAndActiveTrue(course, teacher) ||
                           (course.getAssignedTeacher() != null && course.getAssignedTeacher().getId().equals(request.getTeacherId()));

        if (!isAssigned) {
            throw new RuntimeException("Teacher is not assigned to the course containing this assignment");
        }
        
        // Check if assignment deadline has passed - plagiarism check only allowed after deadline
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime effectiveDeadline = assignment.getLateSubmissionDeadline() != null ? 
                                         assignment.getLateSubmissionDeadline() : 
                                         assignment.getDeadline();
        
        if (now.isBefore(effectiveDeadline)) {
            throw new RuntimeException("Copy checker can only be run after the assignment deadline has passed. Assignment deadline: " + 
                                     effectiveDeadline.toString());
        }
        
        // Generate unique analysis ID
        String analysisId = UUID.randomUUID().toString();
        
        // Initialize analysis status
        PlagiarismAnalysisResponse response = new PlagiarismAnalysisResponse();
        response.setStatus("processing");
        response.setProgress(new PlagiarismAnalysisResponse.Progress());
        response.getProgress().setCurrent(0);
        response.getProgress().setTotal(0);
        response.getProgress().setStage("Initializing...");
        
        analysisResults.put(analysisId, response);
        
        // Start async analysis
        performPlagiarismAnalysisAsync(analysisId, assignment, request);
        
        return analysisId;
    }

    @Async
    public void performPlagiarismAnalysisAsync(String analysisId, Assignment assignment, PlagiarismCheckRequest request) {
        try {
            log.info("Starting plagiarism analysis for assignment: {}", assignment.getTitle());
            
            PlagiarismAnalysisResponse response = analysisResults.get(analysisId);
            
            // Get all submissions for this assignment using correct method
            List<StudentSubmission> submissions = submissionRepository.findByAssignment_IdOrderBySubmittedAtAsc(assignment.getId());
            log.info("Found {} submissions for assignment: {}", submissions.size(), assignment.getTitle());
            
            if (submissions.size() < 2) {
                log.warn("Not enough submissions for comparison. Found: {}", submissions.size());
                response.setStatus("failed");
                response.getProgress().setStage("Not enough submissions for comparison");
                return;
            }
            
            response.getProgress().setTotal(submissions.size());
            response.getProgress().setStage("Processing submissions...");
            
            // Extract and normalize code from submissions
            List<ProcessedSubmission> processedSubmissions = new ArrayList<>();
            int current = 0;
            
            for (StudentSubmission submission : submissions) {
                response.getProgress().setCurrent(++current);
                response.getProgress().setStage("Processing submission " + current + "/" + submissions.size());
                
                try {
                    ProcessedSubmission processed = processSubmission(submission, request.getSettings().getFileFilters());
                    if (processed.hasCodeContent()) {
                        processedSubmissions.add(processed);
                    }
                } catch (Exception e) {
                    log.warn("Error processing submission {}: {}", submission.getId(), e.getMessage());
                }
            }
            
            if (processedSubmissions.size() < 2) {
                response.setStatus("failed");
                response.getProgress().setStage("Not enough valid code submissions found");
                return;
            }
            
            // Perform similarity analysis
            response.getProgress().setStage("Analyzing similarities...");
            List<PlagiarismAnalysisResponse.SimilarityPair> similarities = 
                performSimilarityAnalysis(processedSubmissions, request.getSettings());
            
            // Filter results by threshold
            similarities = similarities.stream()
                .filter(pair -> pair.getSimilarity() >= request.getSettings().getThreshold())
                .collect(Collectors.toList());
            
            // Build final results
            PlagiarismAnalysisResponse.PlagiarismResults results = new PlagiarismAnalysisResponse.PlagiarismResults();
            results.setSimilarities(similarities);
            
            PlagiarismAnalysisResponse.AnalysisMetadata metadata = new PlagiarismAnalysisResponse.AnalysisMetadata();
            metadata.setTotalSubmissions(submissions.size());
            metadata.setComparisons((processedSubmissions.size() * (processedSubmissions.size() - 1)) / 2);
            metadata.setAlgorithm("Shingles + Jaccard Similarity");
            metadata.setAiUsed(request.getSettings().isUseAI());
            metadata.setAnalysisTime(System.currentTimeMillis());
            results.setMetadata(metadata);
            
            response.setResults(results);
            response.setStatus("completed");
            response.getProgress().setStage("Analysis completed");
            
            log.info("Plagiarism analysis completed. Found {} similar pairs above threshold", similarities.size());
            
            // Send notifications to students detected in plagiarism cases
            sendPlagiarismNotifications(assignment, similarities);
            
        } catch (Exception e) {
            log.error("Error during plagiarism analysis for assignment: {}", assignment.getTitle(), e);
            PlagiarismAnalysisResponse response = analysisResults.get(analysisId);
            if (response != null) {
                response.setStatus("failed");
                response.getProgress().setStage("Analysis failed: " + e.getMessage());
            }
            log.error("Full stack trace:", e);
        }
    }
    
    private ProcessedSubmission processSubmission(StudentSubmission submission, List<String> fileFilters) throws IOException {
        ProcessedSubmission processed = new ProcessedSubmission();
        processed.setSubmissionId(submission.getId());
        processed.setStudentId(submission.getStudent().getId());
        processed.setStudentName(submission.getStudent().getName());
        processed.setStudentEmail(submission.getStudent().getEmail());
        
        List<String> codeContents = new ArrayList<>();
        
        // Fetch files for this submission using SubmissionFileRepository
        List<SubmissionFile> files = submissionFileRepository.findBySubmissionOrderByUploadedAtAsc(submission);
        log.info("Found {} files for submission ID: {}", files.size(), submission.getId());
        
        for (SubmissionFile file : files) {
            String filename = file.getOriginalFilename().toLowerCase();
            log.info("Processing file: {} for submission: {}", filename, submission.getId());
            
            // Check if file extension is in the filter list
            String extension = getFileExtension(filename);
            
            // Handle ZIP/archive files specially - always process them regardless of filter
            boolean isArchive = filename.endsWith(".zip") || filename.endsWith(".rar");
            
            if (!isArchive && !fileFilters.contains(extension)) {
                log.info("Skipping file {} - extension {} not in filter list: {}", filename, extension, fileFilters);
                continue;
            }
            
            if (isArchive) {
                log.info("Processing archive file: {} (archives are always processed)", filename);
            }
            
            try {
                String content = readFileContent(file);
                if (content != null && !content.trim().isEmpty()) {
                    String normalizedContent = normalizeCode(content);
                    if (!normalizedContent.trim().isEmpty()) {
                        codeContents.add(normalizedContent);
                        log.info("Successfully processed file: {} (content length: {})", filename, normalizedContent.length());
                    } else {
                        log.warn("File {} produced empty normalized content", filename);
                    }
                } else {
                    log.warn("File {} produced null or empty content", filename);
                }
            } catch (Exception e) {
                log.error("Error reading file {}: {}", filename, e.getMessage(), e);
            }
        }
        
        processed.setCodeContents(codeContents);
        return processed;
    }
    
    private String readFileContent(SubmissionFile file) throws IOException {
        Path filePath = Paths.get(file.getFilePath());
        
        if (!Files.exists(filePath)) {
            log.warn("File not found: {}", filePath);
            return null;
        }
        
        String filename = file.getOriginalFilename().toLowerCase();
        String extension = getFileExtension(filename);
        
        // Handle ZIP files
        if (filename.endsWith(".zip") || filename.endsWith(".rar")) {
            return extractCodeFromArchive(filePath, file.getOriginalFilename());
        }
        
        // Handle PDF files (basic text extraction)
        if (filename.endsWith(".pdf")) {
            // For now, we'll calculate a basic hash for PDF files for similarity
            log.info("Processing PDF file: {}", filename);
            return readBinaryFileAsHash(filePath, filename);
        }
        
        // Handle binary files by computing hash for similarity comparison
        if (BINARY_EXTENSIONS.contains(extension)) {
            log.info("Processing binary file: {}", filename);
            return readBinaryFileAsHash(filePath, filename);
        }
        
        // Handle text and code files
        try {
            String content = Files.readString(filePath);
            
            // Add file metadata as prefix for better tracking
            StringBuilder result = new StringBuilder();
            result.append("// FILE: ").append(file.getOriginalFilename()).append("\n");
            result.append("// SIZE: ").append(Files.size(filePath)).append(" bytes\n");
            result.append("// TYPE: ").append(extension.toUpperCase()).append("\n");
            result.append("// ").append("=".repeat(50)).append("\n\n");
            result.append(content);
            
            return result.toString();
        } catch (Exception e) {
            log.warn("Error reading file {}: {}", filePath, e.getMessage());
            return null;
        }
    }
    
    /**
     * Read binary files and create a hash-based representation for similarity comparison
     */
    private String readBinaryFileAsHash(Path filePath, String filename) throws IOException {
        try {
            byte[] fileBytes = Files.readAllBytes(filePath);
            long fileSize = fileBytes.length;
            
            // Create multiple hash representations for better similarity detection
            StringBuilder hashContent = new StringBuilder();
            hashContent.append("// BINARY FILE: ").append(filename).append("\n");
            hashContent.append("// SIZE: ").append(fileSize).append(" bytes\n");
            
            // Simple checksum approach
            int simpleChecksum = 0;
            for (byte b : fileBytes) {
                simpleChecksum += b & 0xFF;
            }
            hashContent.append("// CHECKSUM: ").append(simpleChecksum).append("\n");
            
            // Create chunks for similarity analysis (divide file into segments)
            int chunkSize = Math.max(1024, fileBytes.length / 10); // 10 chunks or min 1KB
            for (int i = 0; i < fileBytes.length; i += chunkSize) {
                int endIndex = Math.min(i + chunkSize, fileBytes.length);
                byte[] chunk = Arrays.copyOfRange(fileBytes, i, endIndex);
                
                int chunkSum = 0;
                for (byte b : chunk) {
                    chunkSum += b & 0xFF;
                }
                hashContent.append("CHUNK_").append(i / chunkSize).append("_").append(chunkSum).append(" ");
            }
            
            return hashContent.toString();
        } catch (Exception e) {
            log.error("Error processing binary file {}: {}", filename, e.getMessage());
            return null;
        }
    }
    
    private String extractCodeFromArchive(Path archivePath, String originalFilename) {
        StringBuilder allCode = new StringBuilder();
        
        log.info("Extracting from archive: {} (size: {} bytes)", originalFilename, 
                 archivePath.toFile().length());
        
        try (ZipInputStream zis = new ZipInputStream(Files.newInputStream(archivePath))) {
            ZipEntry entry;
            
            allCode.append("// ARCHIVE: ").append(originalFilename).append("\n");
            allCode.append("// ").append("=".repeat(60)).append("\n\n");
            
            int entryCount = 0;
            while ((entry = zis.getNextEntry()) != null) {
                entryCount++;
                if (entry.isDirectory()) continue;
                
                String entryName = entry.getName().toLowerCase();
                String extension = getFileExtension(entryName);
                
                log.info("Processing archive entry: {} (extension: {}, size: {} bytes)", 
                         entry.getName(), extension, entry.getSize());
                
                // Support all file types, not just code files
                if (ALL_EXTENSIONS.contains(extension) || extension.isEmpty()) {
                    try {
                        byte[] buffer = new byte[1024];
                        ByteArrayOutputStream baos = new ByteArrayOutputStream();
                        int len;
                        
                        while ((len = zis.read(buffer)) > 0) {
                            baos.write(buffer, 0, len);
                        }
                        
                        String content = baos.toString("UTF-8");
                        if (!content.trim().isEmpty()) {
                            allCode.append("// FILE: ").append(entry.getName()).append("\n");
                            allCode.append("// SIZE: ").append(entry.getSize()).append(" bytes\n");
                            allCode.append("// TYPE: ").append(extension.toUpperCase()).append("\n");
                            allCode.append("// ").append("-".repeat(40)).append("\n");
                            
                            // Show complete content - removed character limit for full file display
                            allCode.append(content);
                            
                            allCode.append("\n").append("=".repeat(80)).append("\n\n");
                            
                            log.info("Added content from {} ({} chars)", entry.getName(), content.length());
                        } else {
                            log.warn("Empty content from entry: {}", entry.getName());
                        }
                    } catch (Exception e) {
                        log.warn("Error reading entry {}: {}", entry.getName(), e.getMessage());
                        allCode.append("// Error reading file: ").append(e.getMessage()).append("\n\n");
                    }
                } else {
                    log.info("Skipping entry {} - extension {} not supported", entry.getName(), extension);
                }
                
                zis.closeEntry();
            }
            
            log.info("Processed {} entries from archive {}, total extracted content: {} chars", 
                     entryCount, originalFilename, allCode.length());
            
        } catch (IOException e) {
            log.error("Error extracting archive {}: {}", originalFilename, e.getMessage());
        }
        
        return allCode.toString();
    }
    
    private String getFileExtension(String filename) {
        int lastDot = filename.lastIndexOf('.');
        if (lastDot > 0 && lastDot < filename.length() - 1) {
            return filename.substring(lastDot + 1);
        }
        return "";
    }
    
    private String normalizeCode(String code) {
        if (code == null) return "";
        
        // Remove comments but preserve structure
        code = removeComments(code);
        
        // Remove file metadata headers that might cause false matches
        String[] lines = code.split("\n");
        StringBuilder result = new StringBuilder();
        boolean skipMetadata = true;
        
        for (String line : lines) {
            String trimmed = line.trim();
            
            // Skip initial metadata lines
            if (skipMetadata && isMetadataLine(trimmed)) {
                continue;
            }
            skipMetadata = false;
            
            // Skip empty lines and metadata throughout
            if (!trimmed.isEmpty() && !isMetadataLine(trimmed)) {
                // Normalize whitespace but preserve line structure
                String normalized = line.replaceAll("\\s+", " ").trim();
                if (!normalized.isEmpty()) {
                    result.append(normalized).append("\n");
                }
            }
        }
        
        return result.toString().trim();
    }
    
    private String removeComments(String code) {
        // Remove single-line comments (//, #, %)
        code = code.replaceAll("//.*$", "");
        code = code.replaceAll("#.*$", "");
        code = code.replaceAll("%.*$", "");
        
        // Remove multi-line comments (/* */)
        code = code.replaceAll("/\\*[\\s\\S]*?\\*/", "");
        
        // Remove Python/R multi-line strings used as comments
        code = code.replaceAll("\"\"\"[\\s\\S]*?\"\"\"", "");
        code = code.replaceAll("'''[\\s\\S]*?'''", "");
        
        return code;
    }
    
    private String normalizeVariableNames(String code) {
        // Simple variable name normalization - replace common patterns
        // This is a basic implementation; a more sophisticated approach would use AST parsing
        
        // Replace variable declarations with generic names
        code = code.replaceAll("\\bint\\s+\\w+", "int var");
        code = code.replaceAll("\\bdouble\\s+\\w+", "double var");
        code = code.replaceAll("\\bfloat\\s+\\w+", "float var");
        code = code.replaceAll("\\bstring\\s+\\w+", "string var");
        code = code.replaceAll("\\bchar\\s+\\w+", "char var");
        
        return code;
    }
    
    private List<PlagiarismAnalysisResponse.SimilarityPair> performSimilarityAnalysis(
            List<ProcessedSubmission> submissions, PlagiarismCheckRequest.Settings settings) {
        
        List<PlagiarismAnalysisResponse.SimilarityPair> similarities = new ArrayList<>();
        
        // Compare each pair of submissions
        for (int i = 0; i < submissions.size(); i++) {
            for (int j = i + 1; j < submissions.size(); j++) {
                ProcessedSubmission sub1 = submissions.get(i);
                ProcessedSubmission sub2 = submissions.get(j);
                
                double maxSimilarity = 0.0;
                String bestMatch1 = "";
                String bestMatch2 = "";
                
                // Compare all code content combinations
                for (String code1 : sub1.getCodeContents()) {
                    for (String code2 : sub2.getCodeContents()) {
                        double similarity = calculateSimilarity(code1, code2);
                        log.info("Comparing {} vs {}: {}% similarity (code lengths: {} vs {})", 
                                 sub1.getStudentName(), sub2.getStudentName(), similarity,
                                 code1.length(), code2.length());
                        if (similarity > maxSimilarity) {
                            maxSimilarity = similarity;
                            bestMatch1 = code1;
                            bestMatch2 = code2;
                        }
                    }
                }
                
                if (maxSimilarity > 0) {
                    PlagiarismAnalysisResponse.SimilarityPair pair = new PlagiarismAnalysisResponse.SimilarityPair();
                    pair.setStudent1Id(sub1.getStudentId());
                    pair.setStudent2Id(sub2.getStudentId());
                    pair.setStudent1Name(sub1.getStudentName());
                    pair.setStudent2Name(sub2.getStudentName());
                    pair.setSimilarity(maxSimilarity);
                    pair.setType("Code");
                    pair.setDetectionMethod("Shingles + Jaccard");
                    pair.setFilesCompared("Multiple");
                    
                    // Create formatted diff instead of raw code
                    DiffResult diffResult = createDiffHighlight(bestMatch1, bestMatch2);
                    
                    // If formatted content is empty, use cleaned original content
                    String finalCode1 = diffResult.getFormattedCode1();
                    String finalCode2 = diffResult.getFormattedCode2();
                    
                    log.info("Diff result lengths: code1={} chars, code2={} chars", 
                             finalCode1.length(), finalCode2.length());
                    log.debug("Code1 preview: {}", finalCode1.length() > 100 ? finalCode1.substring(0, 100) + "..." : finalCode1);
                    log.debug("Code2 preview: {}", finalCode2.length() > 100 ? finalCode2.substring(0, 100) + "..." : finalCode2);
                    
                    if (finalCode1.trim().isEmpty()) {
                        log.warn("Code1 is empty, using fallback");
                        finalCode1 = cleanCodeForDisplay(bestMatch1);
                    }
                    if (finalCode2.trim().isEmpty()) {
                        log.warn("Code2 is empty, using fallback");
                        finalCode2 = cleanCodeForDisplay(bestMatch2);
                    }
                    
                    pair.setCode1(finalCode1);
                    pair.setCode2(finalCode2);
                    
                    log.info("Adding similarity pair: {} vs {} = {}%", 
                            sub1.getStudentName(), sub2.getStudentName(), maxSimilarity);
                    similarities.add(pair);
                }
            }
        }
        
        return similarities;
    }
    
    private double calculateSimilarity(String code1, String code2) {
        if (code1 == null || code2 == null || code1.trim().isEmpty() || code2.trim().isEmpty()) {
            return 0.0;
        }
        
        // Check if files are binary based on content patterns
        boolean isBinary1 = containsBinaryPatterns(code1);
        boolean isBinary2 = containsBinaryPatterns(code2);
        
        if (isBinary1 || isBinary2) {
            // For binary files, use hash-based similarity
            double binarySimilarity = calculateBinarySimilarity(code1, code2);
            log.debug("Binary similarity calculated: {}%", binarySimilarity * 100);
            return binarySimilarity * 100;
        }
        
        // For text files, use enhanced similarity calculation
        // Normalize the content
        String normalized1 = normalizeCode(code1);
        String normalized2 = normalizeCode(code2);
        
        log.debug("Normalized content lengths: {} vs {}", normalized1.length(), normalized2.length());
        log.debug("First 100 chars of code1: {}", normalized1.length() > 100 ? normalized1.substring(0, 100) : normalized1);
        log.debug("First 100 chars of code2: {}", normalized2.length() > 100 ? normalized2.substring(0, 100) : normalized2);
        
        // Check for exact match first - but be more strict about it
        if (normalized1.equals(normalized2) && normalized1.length() > 100) {
            log.info("Exact match found for substantial content (length: {}), returning 100% similarity", normalized1.length());
            return 100.0;
        }
        
        // Skip very short content to avoid false positives
        if (normalized1.length() < 50 || normalized2.length() < 50) {
            log.debug("Content too short for meaningful comparison (lengths: {} vs {}), returning 0% similarity", normalized1.length(), normalized2.length());
            return 0.0;
        }
        
        // Use larger shingles for more precise matching
        int shingleSize = Math.min(15, Math.max(5, Math.min(normalized1.length(), normalized2.length()) / 20));
        Set<String> shingles1 = createShingles(normalized1, shingleSize);
        Set<String> shingles2 = createShingles(normalized2, shingleSize);
        
        if (shingles1.isEmpty() || shingles2.isEmpty()) {
            log.debug("Empty shingles, returning 0% similarity");
            return 0.0;
        }
        
        // Calculate Jaccard similarity
        Set<String> intersection = new HashSet<>(shingles1);
        intersection.retainAll(shingles2);
        
        Set<String> union = new HashSet<>(shingles1);
        union.addAll(shingles2);
        
        double jaccardSimilarity = union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
        
        // Also calculate line-based similarity for better accuracy
        double lineSimilarity = calculateLineSimilarity(normalized1, normalized2);
        
        // Use stricter thresholds - require substantial overlap
        if (jaccardSimilarity < 0.15 && lineSimilarity < 0.2) {
            return 0.0; // Not similar enough
        }
        
        // Weighted average of both similarities, return as percentage
        double finalSimilarity = ((jaccardSimilarity * 0.8) + (lineSimilarity * 0.2)) * 100.0;
        
        // Apply penalty for very different lengths (but be more lenient)
        double lengthRatio = Math.min(normalized1.length(), normalized2.length()) / 
                           (double) Math.max(normalized1.length(), normalized2.length());
        if (lengthRatio < 0.5) { // More lenient threshold
            finalSimilarity *= lengthRatio; // Reduce similarity for very different lengths
        }
        
        log.debug("Similarity calculation: Jaccard={}%, Line={}%, Final={}%, Length Ratio={}% (shingles1={}, shingles2={}, intersection={}, union={})", 
                 jaccardSimilarity * 100, lineSimilarity * 100, finalSimilarity, lengthRatio * 100,
                 shingles1.size(), shingles2.size(), intersection.size(), union.size());
        
        return Math.max(0.0, finalSimilarity);
    }
    
    /**
     * Check if content contains binary patterns
     */
    private boolean containsBinaryPatterns(String content) {
        if (content == null || content.isEmpty()) {
            return false;
        }
        
        // Check for CHUNK_ patterns (binary file signatures)
        if (content.contains("CHUNK_") && content.contains("// BINARY FILE:")) {
            return true;
        }
        
        // Check for high percentage of non-printable characters
        int nonPrintableCount = 0;
        int totalChars = Math.min(content.length(), 1000);
        
        for (int i = 0; i < totalChars; i++) {
            char c = content.charAt(i);
            if (c == 0 || (c < 32 && c != 9 && c != 10 && c != 13)) {
                nonPrintableCount++;
            }
        }
        
        return ((double) nonPrintableCount / totalChars) > 0.3;
    }
    
    /**
     * Calculate similarity for binary files using hash patterns
     */
    private double calculateBinarySimilarity(String content1, String content2) {
        List<String> chunks1 = extractHashChunks(content1);
        List<String> chunks2 = extractHashChunks(content2);
        
        if (chunks1.isEmpty() || chunks2.isEmpty()) {
            return 0.0;
        }
        
        Set<String> set1 = new HashSet<>(chunks1);
        Set<String> set2 = new HashSet<>(chunks2);
        
        Set<String> intersection = new HashSet<>(set1);
        intersection.retainAll(set2);
        
        Set<String> union = new HashSet<>(set1);
        union.addAll(set2);
        
        return union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
    }
    
    /**
     * Extract hash chunks from binary file content representation
     */
    private List<String> extractHashChunks(String content) {
        List<String> chunks = new ArrayList<>();
        String[] lines = content.split("\n");
        
        for (String line : lines) {
            if (line.startsWith("CHUNK_")) {
                chunks.add(line.trim());
            }
        }
        
        return chunks;
    }
    
    /**
     * Calculate line-based similarity for text files
     */
    private double calculateLineSimilarity(String text1, String text2) {
        String[] lines1 = text1.split("\n");
        String[] lines2 = text2.split("\n");
        
        Set<String> lineSet1 = new HashSet<>();
        Set<String> lineSet2 = new HashSet<>();
        
        // Add non-empty, meaningful lines (skip comments and metadata)
        for (String line : lines1) {
            String trimmed = line.trim();
            if (!trimmed.isEmpty() && !isMetadataLine(trimmed)) {
                lineSet1.add(trimmed);
            }
        }
        
        for (String line : lines2) {
            String trimmed = line.trim();
            if (!trimmed.isEmpty() && !isMetadataLine(trimmed)) {
                lineSet2.add(trimmed);
            }
        }
        
        if (lineSet1.isEmpty() || lineSet2.isEmpty()) {
            return 0.0;
        }
        
        Set<String> intersection = new HashSet<>(lineSet1);
        intersection.retainAll(lineSet2);
        
        Set<String> union = new HashSet<>(lineSet1);
        union.addAll(lineSet2);
        
        return union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
    }
    
    /**
     * Check if a line is metadata (comments, file headers, etc.)
     */
    private boolean isMetadataLine(String line) {
        return line.startsWith("//") || 
               line.startsWith("#") || 
               line.startsWith("*") ||
               line.startsWith("/*") ||
               line.startsWith("*/") ||
               line.matches(".*FILE:.*") ||
               line.matches(".*SIZE:.*") ||
               line.matches(".*TYPE:.*") ||
               line.matches(".*=+.*");
    }
    
    private Set<String> createShingles(String text, int shingleSize) {
        Set<String> shingles = new HashSet<>();
        
        if (text.length() < shingleSize) {
            shingles.add(text);
            return shingles;
        }
        
        for (int i = 0; i <= text.length() - shingleSize; i++) {
            String shingle = text.substring(i, i + shingleSize);
            shingles.add(shingle);
        }
        
        return shingles;
    }
    
    /**
     * Clean code for display purposes (remove metadata but keep readability)
     */
    private String cleanCodeForDisplay(String code) {
        if (code == null || code.trim().isEmpty()) {
            return "// No content available";
        }
        
        String[] lines = code.split("\n");
        StringBuilder cleaned = new StringBuilder();
        int contentLines = 0;
        
        for (String line : lines) {
            String trimmed = line.trim();
            // Skip metadata lines but keep some structure
            if (!trimmed.isEmpty() && !isMetadataLine(trimmed)) {
                cleaned.append(escapeHtml(line)).append("\n");
                contentLines++;
                
                // Show all lines - no truncation for complete diff view
                // Removed line limit to show complete file content
            }
        }
        
        if (cleaned.length() == 0) {
            return "// No meaningful content found";
        }
        
        return cleaned.toString();
    }
    
    /**
     * Create diff highlighting between two code segments
     */
    private DiffResult createDiffHighlight(String code1, String code2) {
        // Clean and prepare code for diff
        String cleaned1 = cleanCodeForDiff(code1);
        String cleaned2 = cleanCodeForDiff(code2);
        
        log.debug("Cleaned code lengths for diff: {} vs {}", cleaned1.length(), cleaned2.length());
        
        if (cleaned1.trim().isEmpty() || cleaned2.trim().isEmpty()) {
            // Fallback to original cleaned content
            return new DiffResult(
                cleanCodeForDisplay(code1),
                cleanCodeForDisplay(code2)
            );
        }
        
        String[] lines1 = cleaned1.split("\n");
        String[] lines2 = cleaned2.split("\n");
        
        StringBuilder formatted1 = new StringBuilder();
        StringBuilder formatted2 = new StringBuilder();
        
        // Create a simple line-by-line diff
        Set<String> lines1Set = new HashSet<>();
        Set<String> lines2Set = new HashSet<>();
        
        for (String line : lines1) {
            String trimmed = line.trim();
            if (!trimmed.isEmpty()) {
                lines1Set.add(trimmed);
            }
        }
        
        for (String line : lines2) {
            String trimmed = line.trim();
            if (!trimmed.isEmpty()) {
                lines2Set.add(trimmed);
            }
        }
        
        int lineCount1 = 0;
        int lineCount2 = 0;
        
        // Format code1
        for (String line : lines1) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;
            
            // Show all lines - removed 50 line limit for complete diff view
            lineCount1++;
            
            if (lines2Set.contains(trimmed)) {
                // Matching line - highlight in green with strong inline styles
                formatted1.append("<span class='match-highlight' style='background-color: #d4edda !important; color: #155724 !important; padding: 3px 6px !important; border-radius: 4px !important; border-left: 4px solid #28a745 !important; display: inline-block !important; margin: 2px 0 !important; font-weight: bold !important; border: 2px solid #28a745 !important;'>")
                          .append(escapeHtml(line)).append("</span>\n");
            } else {
                // Different line - highlight in red with strong inline styles
                formatted1.append("<span class='diff-highlight' style='background-color: #f8d7da !important; color: #721c24 !important; padding: 3px 6px !important; border-radius: 4px !important; border-left: 4px solid #dc3545 !important; display: inline-block !important; margin: 2px 0 !important; font-weight: bold !important; border: 2px solid #dc3545 !important;'>")
                          .append(escapeHtml(line)).append("</span>\n");
            }
        }
        
        // Format code2
        for (String line : lines2) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;
            
            // Show all lines - removed 50 line limit for complete diff view
            lineCount2++;
            
            if (lines1Set.contains(trimmed)) {
                // Matching line - highlight in green with strong inline styles
                formatted2.append("<span class='match-highlight' style='background-color: #d4edda !important; color: #155724 !important; padding: 3px 6px !important; border-radius: 4px !important; border-left: 4px solid #28a745 !important; display: inline-block !important; margin: 2px 0 !important; font-weight: bold !important; border: 2px solid #28a745 !important;'>")
                          .append(escapeHtml(line)).append("</span>\n");
            } else {
                // Different line - highlight in red with strong inline styles
                formatted2.append("<span class='diff-highlight' style='background-color: #f8d7da !important; color: #721c24 !important; padding: 3px 6px !important; border-radius: 4px !important; border-left: 4px solid #dc3545 !important; display: inline-block !important; margin: 2px 0 !important; font-weight: bold !important; border: 2px solid #dc3545 !important;'>")
                          .append(escapeHtml(line)).append("</span>\n");
            }
        }
        
        String result1 = formatted1.toString();
        String result2 = formatted2.toString();
        
        // Ensure we have content
        if (result1.trim().isEmpty()) {
            result1 = cleanCodeForDisplay(code1);
        }
        if (result2.trim().isEmpty()) {
            result2 = cleanCodeForDisplay(code2);
        }
        
        log.debug("Diff result lengths: {} vs {}", result1.length(), result2.length());
        
        return new DiffResult(result1, result2);
    }
    
    /**
     * Clean code for diff comparison (remove metadata, normalize)
     */
    private String cleanCodeForDiff(String code) {
        if (code == null) return "";
        
        String[] lines = code.split("\n");
        StringBuilder cleaned = new StringBuilder();
        
        for (String line : lines) {
            String trimmed = line.trim();
            // Skip metadata lines and empty lines
            if (!trimmed.isEmpty() && !isMetadataLine(trimmed)) {
                cleaned.append(trimmed).append("\n");
            }
        }
        
        return cleaned.toString();
    }
    
    /**
     * Escape HTML characters for safe display
     */
    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                  .replace("<", "&lt;")
                  .replace(">", "&gt;")
                  .replace("\"", "&quot;")
                  .replace("'", "&#x27;");
    }
    
    public PlagiarismAnalysisResponse getAnalysisStatus(String analysisId) {
        PlagiarismAnalysisResponse response = analysisResults.get(analysisId);
        if (response == null) {
            throw new RuntimeException("Analysis not found");
        }
        return response;
    }
    
    public PlagiarismAnalysisResponse getAnalysisResults(String analysisId) {
        PlagiarismAnalysisResponse response = analysisResults.get(analysisId);
        if (response == null) {
            throw new RuntimeException("Analysis not found");
        }
        if (!"completed".equals(response.getStatus())) {
            throw new RuntimeException("Analysis not completed yet");
        }
        return response;
    }
    
    public void cancelAnalysis(String analysisId) {
        PlagiarismAnalysisResponse response = analysisResults.get(analysisId);
        if (response != null && "processing".equals(response.getStatus())) {
            response.setStatus("cancelled");
            response.getProgress().setStage("Analysis cancelled");
        }
    }
    
    // Helper class for processed submissions
    private static class ProcessedSubmission {
        private Long submissionId;
        private Long studentId;
        private String studentName;
        private String studentEmail;
        private List<String> codeContents = new ArrayList<>();
        
        public boolean hasCodeContent() {
            return !codeContents.isEmpty() && 
                   codeContents.stream().anyMatch(content -> !content.trim().isEmpty());
        }
        
        // Getters and setters
        public Long getSubmissionId() { return submissionId; }
        public void setSubmissionId(Long submissionId) { this.submissionId = submissionId; }
        
        public Long getStudentId() { return studentId; }
        public void setStudentId(Long studentId) { this.studentId = studentId; }
        
        public String getStudentName() { return studentName; }
        public void setStudentName(String studentName) { this.studentName = studentName; }
        
        public String getStudentEmail() { return studentEmail; }
        public void setStudentEmail(String studentEmail) { this.studentEmail = studentEmail; }
        
        public List<String> getCodeContents() { return codeContents; }
        public void setCodeContents(List<String> codeContents) { this.codeContents = codeContents; }
    }
    
    // Helper class for diff results
    private static class DiffResult {
        private final String formattedCode1;
        private final String formattedCode2;
        
        public DiffResult(String formattedCode1, String formattedCode2) {
            this.formattedCode1 = formattedCode1;
            this.formattedCode2 = formattedCode2;
        }
        
        public String getFormattedCode1() { return formattedCode1; }
        public String getFormattedCode2() { return formattedCode2; }
    }

    /**
     * Send notifications to students detected in plagiarism cases
     */
    private void sendPlagiarismNotifications(Assignment assignment, List<PlagiarismAnalysisResponse.SimilarityPair> similarities) {
        if (similarities.isEmpty()) {
            log.info("No plagiarism detected above threshold for assignment: {}", assignment.getTitle());
            return;
        }
        
        log.info("Sending plagiarism notifications for {} similarity pairs in assignment: {}", 
                similarities.size(), assignment.getTitle());
        
        // Track students already notified to avoid duplicate notifications
        Set<Long> notifiedStudents = new HashSet<>();
        
        for (PlagiarismAnalysisResponse.SimilarityPair pair : similarities) {
            try {
                // Notify student 1 if not already notified
                if (!notifiedStudents.contains(pair.getStudent1Id())) {
                    User student1 = userRepository.findById(pair.getStudent1Id()).orElse(null);
                    if (student1 != null) {
                        String detectedWith = String.format("submission by %s", pair.getStudent2Name());
                        notificationService.createPlagiarismDetectionNotification(
                            student1, assignment, pair.getSimilarity(), detectedWith);
                        notifiedStudents.add(pair.getStudent1Id());
                        log.info("Sent plagiarism notification to student: {} ({:.1f}% similarity)", 
                                student1.getName(), pair.getSimilarity());
                    }
                }
                
                // Notify student 2 if not already notified
                if (!notifiedStudents.contains(pair.getStudent2Id())) {
                    User student2 = userRepository.findById(pair.getStudent2Id()).orElse(null);
                    if (student2 != null) {
                        String detectedWith = String.format("submission by %s", pair.getStudent1Name());
                        notificationService.createPlagiarismDetectionNotification(
                            student2, assignment, pair.getSimilarity(), detectedWith);
                        notifiedStudents.add(pair.getStudent2Id());
                        log.info("Sent plagiarism notification to student: {} ({:.1f}% similarity)", 
                                student2.getName(), pair.getSimilarity());
                    }
                }
                
            } catch (Exception e) {
                log.error("Error sending plagiarism notification for similarity pair (students: {} and {}): {}", 
                        pair.getStudent1Name(), pair.getStudent2Name(), e.getMessage(), e);
            }
        }
        
        log.info("Completed sending plagiarism notifications. Total students notified: {}", notifiedStudents.size());
    }
}
