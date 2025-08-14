package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class StudentSubmissionService {

    private final StudentSubmissionRepository submissionRepository;
    private final SubmissionFileRepository submissionFileRepository;
    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final AssessmentGridRepository assessmentGridRepository;

    @Value("${app.upload.dir:/app/data/uploads}")
    private String uploadDir;

    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    private static final List<String> ALLOWED_EXTENSIONS = List.of(".zip"); // Only ZIP files allowed

    @PostConstruct
    public void initializeUploadDirectory() {
        try {
            Path submissionPath = Paths.get(uploadDir, "submissions");
            Files.createDirectories(submissionPath);
            log.info("Submission upload directory initialized at: {}", submissionPath.toAbsolutePath());
        } catch (IOException e) {
            log.error("Failed to create submission upload directory: {}", uploadDir, e);
            throw new RuntimeException("Failed to initialize submission upload directory", e);
        }
    }

    /**
     * Submit assignment with file upload
     */
    public StudentSubmissionResponse submitAssignment(Long assignmentId, Long studentId, 
                                                    String submissionText, MultipartFile file) throws IOException {
        
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Check if student is enrolled in the course
        if (!isStudentEnrolledInCourse(student, assignment.getCourse())) {
            throw new RuntimeException("Student is not enrolled in this course");
        }

        // Check if submission deadline has passed
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime deadline = assignment.getDeadline();
        LocalDateTime lateDeadline = assignment.getLateSubmissionDeadline();
        
        if (now.isAfter(deadline)) {
            if (lateDeadline == null || now.isAfter(lateDeadline)) {
                throw new RuntimeException("Submission deadline has passed");
            }
        }

        // Check if student has already submitted
        if (submissionRepository.existsByAssignmentAndStudent(assignment, student)) {
            throw new RuntimeException("You have already submitted this assignment");
        }

        // Create submission
        StudentSubmission submission = StudentSubmission.builder()
                .assignment(assignment)
                .student(student)
                .submissionText(submissionText)
                .build();
        
        // Save first to get the submittedAt timestamp
        StudentSubmission savedSubmission = submissionRepository.save(submission);
        
        // Calculate submission status after saving (when submittedAt is available)
        savedSubmission.calculateSubmissionStatus();
        
        // Save again with the calculated status
        savedSubmission = submissionRepository.save(savedSubmission);

        // Handle file upload if provided
        SubmissionFile submissionFile = null;
        if (file != null && !file.isEmpty()) {
            submissionFile = saveSubmissionFile(file, savedSubmission);
        }

        // Notify teacher about the new submission
        notificationService.createAssignmentSubmissionNotification(assignment, student);

        // Update assessment grid to link this submission
        updateAssessmentGridWithSubmission(assignment, student, savedSubmission);

        return mapToResponse(savedSubmission, submissionFile != null ? List.of(submissionFile) : List.of());
    }

    /**
     * Get all submissions for an assignment (teacher view)
     */
    public List<StudentSubmissionResponse> getSubmissionsForAssignment(Long assignmentId, Long teacherId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        // Verify teacher permissions
        if (!assignment.getCreatedBy().getId().equals(teacherId) && 
            !assignment.getCourse().getAssignedTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("Not authorized to view submissions for this assignment");
        }

        List<StudentSubmission> submissions = submissionRepository.findByAssignmentOrderBySubmittedAtAsc(assignment);
        
        return submissions.stream()
                .map(submission -> {
                    List<SubmissionFile> files = submissionFileRepository.findBySubmissionOrderByUploadedAtAsc(submission);
                    return mapToResponse(submission, files);
                })
                .collect(Collectors.toList());
    }

    /**
     * Get student's submissions
     */
    public List<StudentSubmissionResponse> getStudentSubmissions(Long studentId) {
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<StudentSubmission> submissions = submissionRepository.findByStudentOrderBySubmittedAtDesc(student);
        
        return submissions.stream()
                .map(submission -> {
                    List<SubmissionFile> files = submissionFileRepository.findBySubmissionOrderByUploadedAtAsc(submission);
                    return mapToResponse(submission, files);
                })
                .collect(Collectors.toList());
    }

    /**
     * Check if student has submitted for an assignment
     */
    public boolean hasStudentSubmitted(Long assignmentId, Long studentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        return submissionRepository.existsByAssignmentAndStudent(assignment, student);
    }

    /**
     * Get student's submission for a specific assignment
     */
    public StudentSubmissionResponse getStudentSubmission(Long assignmentId, Long studentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        StudentSubmission submission = submissionRepository.findByAssignmentAndStudent(assignment, student)
                .orElseThrow(() -> new RuntimeException("No submission found for this assignment"));

        List<SubmissionFile> files = submissionFileRepository.findBySubmissionOrderByUploadedAtAsc(submission);
        return mapToResponse(submission, files);
    }

    /**
     * Update assignment submission (only allowed before final deadline and if submission was on-time)
     */
    public StudentSubmissionResponse updateSubmission(Long assignmentId, Long studentId, 
                                                    String submissionText, MultipartFile file) throws IOException {
        
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Check if student is enrolled in the course
        if (!isStudentEnrolledInCourse(student, assignment.getCourse())) {
            throw new RuntimeException("Student is not enrolled in this course");
        }

        // Find existing submission
        StudentSubmission existingSubmission = submissionRepository.findByAssignmentAndStudent(assignment, student)
                .orElseThrow(() -> new RuntimeException("No submission found to update"));

        // Check if editing is allowed based on deadlines
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime deadline = assignment.getDeadline();
        LocalDateTime lateDeadline = assignment.getLateSubmissionDeadline();
        
        // Check if late submission deadline has passed (submission is completely closed)
        if (lateDeadline != null && now.isAfter(lateDeadline)) {
            throw new RuntimeException("Cannot edit submission - late submission deadline has passed");
        }
        
        // If no late deadline is set and main deadline has passed, no editing allowed
        if (lateDeadline == null && now.isAfter(deadline)) {
            throw new RuntimeException("Cannot edit submission - deadline has passed and no late submission allowed");
        }

        // Update submission text
        if (submissionText != null) {
            existingSubmission.setSubmissionText(submissionText);
        }

        // Handle file update if provided
        if (file != null && !file.isEmpty()) {
            // Delete old files first
            List<SubmissionFile> oldFiles = submissionFileRepository.findBySubmissionOrderByUploadedAtAsc(existingSubmission);
            for (SubmissionFile oldFile : oldFiles) {
                deleteSubmissionFile(oldFile);
            }

            // Save new file
            saveSubmissionFile(file, existingSubmission);
        }

        // Check if editing after deadline should mark as late
        LocalDateTime originalDeadline = assignment.getDeadline();
        if (now.isAfter(originalDeadline)) {
            // If editing after the original deadline, mark as late
            existingSubmission.setIsLate(true);
            existingSubmission.setSubmissionStatus(StudentSubmission.SubmissionStatus.LATE);
        }
        // Otherwise preserve original submission status

        // Save updated submission
        StudentSubmission updatedSubmission = submissionRepository.save(existingSubmission);

        // Update assessment grid to link this submission (in case it wasn't linked before)
        updateAssessmentGridWithSubmission(assignment, student, updatedSubmission);

        // Get all current files (should be just the new one if file was provided)
        List<SubmissionFile> currentFiles = submissionFileRepository.findBySubmissionOrderByUploadedAtAsc(updatedSubmission);

        return mapToResponse(updatedSubmission, currentFiles);
    }

    /**
     * Delete a submission file from filesystem and database
     */
    private void deleteSubmissionFile(SubmissionFile submissionFile) {
        try {
            // Delete from filesystem
            Path filePath = Paths.get(submissionFile.getFilePath());
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.debug("Deleted submission file from filesystem: {}", filePath.toAbsolutePath());
            }
            
            // Delete from database
            submissionFileRepository.delete(submissionFile);
            log.debug("Deleted submission file from database: {}", submissionFile.getOriginalFilename());
        } catch (IOException e) {
            log.error("Failed to delete submission file: {}", submissionFile.getFilePath(), e);
            // Still delete from database even if filesystem deletion fails
            submissionFileRepository.delete(submissionFile);
        }
    }

    /**
     * Download submission file
     */
    public Resource downloadSubmissionFile(Long fileId) throws MalformedURLException {
        SubmissionFile submissionFile = submissionFileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("Submission file not found"));

        Path filePath = Paths.get(submissionFile.getFilePath());
        log.debug("Attempting to download submission file from path: {}", filePath.toAbsolutePath());
        
        Resource resource = new FileSystemResource(filePath);

        if (resource.exists() && resource.isReadable()) {
            log.debug("Submission file found and readable: {}", submissionFile.getOriginalFilename());
            return resource;
        } else {
            log.error("Submission file not found or not readable. Path: {}, Exists: {}, Readable: {}", 
                     filePath.toAbsolutePath(), 
                     Files.exists(filePath), 
                     Files.isReadable(filePath));
            throw new RuntimeException("Submission file not found or not readable: " + submissionFile.getOriginalFilename());
        }
    }

    /**
     * Get submission statistics for an assignment
     */
    public SubmissionStatsResponse getSubmissionStats(Long assignmentId) {
        long totalSubmissions = submissionRepository.countSubmissionsByAssignmentId(assignmentId);
        long lateSubmissions = submissionRepository.countLateSubmissionsByAssignmentId(assignmentId);
        long onTimeSubmissions = totalSubmissions - lateSubmissions;

        return SubmissionStatsResponse.builder()
                .assignmentId(assignmentId)
                .totalSubmissions(totalSubmissions)
                .onTimeSubmissions(onTimeSubmissions)
                .lateSubmissions(lateSubmissions)
                .build();
    }

    // Private helper methods

    private SubmissionFile saveSubmissionFile(MultipartFile file, StudentSubmission submission) throws IOException {
        // Validate file
        validateFile(file);

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFilename);
        String storedFilename = UUID.randomUUID().toString() + fileExtension;
        
        // Create submission-specific directory
        Path submissionPath = Paths.get(uploadDir, "submissions", submission.getId().toString());
        Files.createDirectories(submissionPath);
        
        Path filePath = submissionPath.resolve(storedFilename);

        log.debug("Saving submission file: {} -> {} at path: {}", originalFilename, storedFilename, filePath.toAbsolutePath());

        // Save file to disk
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        // Verify file was actually saved
        if (!Files.exists(filePath)) {
            throw new IOException("Failed to save submission file to disk: " + filePath);
        }

        log.info("Submission file successfully saved: {} (size: {} bytes) at {}", 
                originalFilename, file.getSize(), filePath.toAbsolutePath());

        // Save file info to database
        SubmissionFile submissionFile = SubmissionFile.builder()
                .submission(submission)
                .originalFilename(originalFilename)
                .storedFilename(storedFilename)
                .filePath(filePath.toString())
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .build();

        return submissionFileRepository.save(submissionFile);
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("File size exceeds maximum allowed size (50MB)");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || filename.trim().isEmpty()) {
            throw new RuntimeException("Invalid filename");
        }

        String extension = getFileExtension(filename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new RuntimeException("Only ZIP files are allowed for assignment submissions");
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }

    private boolean isStudentEnrolledInCourse(User student, Course course) {
        // This should check the CourseEnrollment table
        // For now, assuming all students can submit (you can implement proper enrollment check)
        return student.getRole() == Role.STUDENT;
    }

    private StudentSubmissionResponse mapToResponse(StudentSubmission submission, List<SubmissionFile> files) {
        List<SubmissionFileResponse> fileResponses = files.stream()
                .map(this::mapFileToResponse)
                .collect(Collectors.toList());

        return StudentSubmissionResponse.builder()
                .id(submission.getId())
                .assignmentId(submission.getAssignment().getId())
                .assignmentTitle(submission.getAssignment().getTitle())
                .studentId(submission.getStudent().getId())
                .studentName(submission.getStudent().getName())
                .studentEmail(submission.getStudent().getEmail())
                .submissionText(submission.getSubmissionText())
                .submittedAt(submission.getSubmittedAt())
                .submissionStatus(submission.getSubmissionStatus())
                .isLate(submission.getIsLate())
                .files(fileResponses)
                .deadline(submission.getAssignment().getDeadline())
                .lateSubmissionDeadline(submission.getAssignment().getLateSubmissionDeadline())
                .maxMarks(submission.getAssignment().getMaxMarks())
                .build();
    }

    private SubmissionFileResponse mapFileToResponse(SubmissionFile file) {
        return SubmissionFileResponse.builder()
                .id(file.getId())
                .originalFilename(file.getOriginalFilename())
                .storedFilename(file.getStoredFilename())
                .fileSize(file.getFileSize())
                .contentType(file.getContentType())
                .uploadedAt(file.getUploadedAt())
                .build();
    }

    /**
     * Update assessment grid to link the submission when it's created
     */
    private void updateAssessmentGridWithSubmission(Assignment assignment, User student, StudentSubmission submission) {
        try {
            // Find existing assessment grid entry for this assignment and student
            AssessmentGrid assessmentGrid = assessmentGridRepository.findByAssignmentAndStudent(assignment, student)
                    .orElse(null);
            
            if (assessmentGrid != null && assessmentGrid.getSubmission() == null) {
                // Update the assessment grid to link the submission
                assessmentGrid.setSubmission(submission);
                assessmentGridRepository.save(assessmentGrid);
                log.info("Updated assessment grid {} to link submission {}", assessmentGrid.getId(), submission.getId());
            } else if (assessmentGrid == null) {
                log.info("No assessment grid found for assignment {} and student {}, it will be created when needed", 
                        assignment.getId(), student.getId());
            } else {
                log.info("Assessment grid {} already has submission linked", assessmentGrid.getId());
            }
        } catch (Exception e) {
            log.error("Failed to update assessment grid with submission: {}", e.getMessage(), e);
            // Don't fail the submission creation if assessment grid update fails
        }
    }

    @Data
    @Builder
    public static class SubmissionStatsResponse {
        private Long assignmentId;
        private long totalSubmissions;
        private long onTimeSubmissions;
        private long lateSubmissions;
    }
}
