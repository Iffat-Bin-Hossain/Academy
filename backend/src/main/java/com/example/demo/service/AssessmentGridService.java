package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AssessmentGridService {

    private final AssessmentGridRepository assessmentGridRepository;
    private final AssignmentRepository assignmentRepository;
    private final UserRepository userRepository;
    private final CourseEnrollmentRepository courseEnrollmentRepository;
    private final StudentSubmissionRepository submissionRepository;
    private final SubmissionFileRepository submissionFileRepository;

    @Value("${app.upload.dir:/app/data/uploads}")
    private String uploadDir;

    /**
     * Generate or update assessment grid for a course
     * This automatically creates entries for all assignments and enrolled students
     */
    public List<AssessmentGridResponse> generateAssessmentGrid(Long courseId, Long teacherId) {
        // Verify teacher permissions
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        if (teacher.getRole() != Role.TEACHER) {
            throw new RuntimeException("Only teachers can access assessment grids");
        }

        // Get all assignments for the course created by this teacher
        List<Assignment> assignments = assignmentRepository.findByCourseIdAndCreatedByIdOrderByDeadlineAsc(courseId, teacherId);
        
        if (assignments.isEmpty()) {
            return new ArrayList<>();
        }

        // Verify teacher has permission for this course
        Assignment firstAssignment = assignments.get(0);
        Course course = firstAssignment.getCourse();
        
        if (!course.getAssignedTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("Not authorized to access assessment grid for this course");
        }

        // Get all approved students enrolled in the course
        List<CourseEnrollment> enrollments = courseEnrollmentRepository.findByCourseAndStatus(course, EnrollmentStatus.APPROVED);
        List<User> enrolledStudents = enrollments.stream()
                .map(CourseEnrollment::getStudent)
                .collect(Collectors.toList());

        List<AssessmentGridResponse> responses = new ArrayList<>();

        // For each assignment, ensure assessment grid entries exist for all enrolled students
        for (Assignment assignment : assignments) {
            for (User student : enrolledStudents) {
                AssessmentGrid assessmentGrid = assessmentGridRepository.findByAssignmentAndStudent(assignment, student)
                        .orElse(null);

                if (assessmentGrid == null) {
                    // Create new assessment grid entry
                    assessmentGrid = createNewAssessmentGridEntry(assignment, student);
                } else {
                    // Update existing assessment grid with latest submission info
                    updateAssessmentGridWithSubmission(assessmentGrid);
                }

                // Convert to response
                AssessmentGridResponse response = mapToResponse(assessmentGrid);
                responses.add(response);
            }
        }

        return responses;
    }

    /**
     * Get assessment grid for a specific assignment
     */
    public List<AssessmentGridResponse> getAssignmentAssessmentGrid(Long assignmentId, Long teacherId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        // Verify teacher permissions
        if (!assignment.getCreatedBy().getId().equals(teacherId) && 
            !assignment.getCourse().getAssignedTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("Not authorized to access this assessment grid");
        }

        List<AssessmentGrid> assessmentGrids = assessmentGridRepository.findByAssignmentIdOrderByStudentName(assignmentId);
        
        // If no assessment grid entries exist, create them for all enrolled students
        if (assessmentGrids.isEmpty()) {
            assessmentGrids = createAssessmentGridForAssignment(assignment);
        }

        return assessmentGrids.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Update individual assessment
     */
    public AssessmentGridResponse updateAssessment(AssessmentGridUpdateRequest request, Long teacherId) {
        AssessmentGrid assessmentGrid;
        
        // Find assessment using courseId/assignmentId/studentId combination
        if (request.getCourseId() != null && request.getAssignmentId() != null && request.getStudentId() != null) {
            assessmentGrid = assessmentGridRepository.findByCourseIdAndAssignmentIdAndStudentId(
                    request.getCourseId(), request.getAssignmentId(), request.getStudentId())
                    .orElse(null);
            
            if (assessmentGrid == null) {
                // Create new assessment grid entry if it doesn't exist
                Assignment assignment = assignmentRepository.findById(request.getAssignmentId())
                        .orElseThrow(() -> new RuntimeException("Assignment not found"));
                User student = userRepository.findById(request.getStudentId())
                        .orElseThrow(() -> new RuntimeException("Student not found"));
                assessmentGrid = createNewAssessmentGridEntry(assignment, student);
            }
        } else {
            throw new RuntimeException("Either assessmentId or courseId/assignmentId/studentId must be provided");
        }

        // Verify teacher permissions
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        if (!assessmentGrid.getAssignment().getCreatedBy().getId().equals(teacherId) &&
            !assessmentGrid.getAssignment().getCourse().getAssignedTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("Not authorized to update this assessment");
        }

        // Update fields
        if (request.getTeacherMark() != null) {
            assessmentGrid.setTeacherMark(request.getTeacherMark());
        }
        if (request.getManualWeight() != null) {
            assessmentGrid.setManualWeight(request.getManualWeight());
        }
        if (request.getGradingNotes() != null) {
            assessmentGrid.setGradingNotes(request.getGradingNotes());
        }
        if (request.getLatePenaltyApplied() != null) {
            assessmentGrid.setLatePenaltyApplied(request.getLatePenaltyApplied());
        }
        if (request.getCopyPenaltyApplied() != null) {
            assessmentGrid.setCopyPenaltyApplied(request.getCopyPenaltyApplied());
        }

        assessmentGrid.setGradedBy(teacher);
        assessmentGrid.setGradedAt(LocalDateTime.now());
        assessmentGrid.setIsProcessed(true);

        // Recalculate final mark
        assessmentGrid.calculateFinalMark();

        AssessmentGrid saved = assessmentGridRepository.save(assessmentGrid);
        return mapToResponse(saved);
    }

    /**
     * Bulk update assessments
     */
    public List<AssessmentGridResponse> bulkUpdateAssessments(BulkAssessmentUpdateRequest request, Long teacherId) {
        List<AssessmentGridResponse> responses = new ArrayList<>();

        for (AssessmentGridUpdateRequest updateRequest : request.getAssessments()) {
            try {
                AssessmentGridResponse response = updateAssessment(updateRequest, teacherId);
                responses.add(response);
            } catch (Exception e) {
                log.error("Error updating assessment for student {}, assignment {}: {}", 
                         updateRequest.getStudentId(), updateRequest.getAssignmentId(), e.getMessage());
                // Continue with other updates
            }
        }

        return responses;
    }

    /**
     * Upload and process copy checker CSV
     */
    public String uploadCopyCheckerFile(Long assignmentId, MultipartFile file, Long teacherId) throws IOException {
        log.info("Starting copy checker upload for assignment ID: {}", assignmentId);
        
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        log.info("Processing copy checker for assignment: {}", assignment.getTitle());

        // Verify teacher permissions
        if (!assignment.getCreatedBy().getId().equals(teacherId) &&
            !assignment.getCourse().getAssignedTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("Not authorized to upload copy checker for this assignment");
        }

        // Validate file
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".csv")) {
            throw new RuntimeException("Only CSV files are allowed");
        }

        log.info("Uploading CSV file: {} (size: {} bytes)", originalFilename, file.getSize());

        // Create copy-checker directory
        Path copyCheckerDir = Paths.get(uploadDir, "copy-checker");
        Files.createDirectories(copyCheckerDir);

        // Save file
        String fileName = "assignment_" + assignmentId + "_copy_checker_" + System.currentTimeMillis() + ".csv";
        Path filePath = copyCheckerDir.resolve(fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        log.info("File saved to: {}", filePath.toString());

        // Process CSV file
        List<String> flaggedIdentifiers = processCopyCheckerCSV(file);
        
        if (flaggedIdentifiers.isEmpty()) {
            log.warn("No flagged identifiers found in CSV file");
            return "Copy checker file processed, but no students were flagged for copying.";
        }
        
        // Apply copy penalties
        int penalizedCount = applyCopyPenalties(assignment, flaggedIdentifiers, filePath.toString(), teacherId);

        String resultMessage = String.format(
            "Copy checker processed successfully. %d student(s) flagged for copying, %d penalties applied.", 
            flaggedIdentifiers.size(), penalizedCount
        );
        
        log.info("Copy checker upload complete: {}", resultMessage);
        return resultMessage;
    }

    /**
     * Debug copy checker without applying penalties - for testing
     */
    public Map<String, Object> debugCopyCheckerFile(Long assignmentId, MultipartFile file, Long teacherId) throws IOException {
        log.info("Starting copy checker DEBUG for assignment ID: {}", assignmentId);
        
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        log.info("Processing copy checker DEBUG for assignment: {}", assignment.getTitle());

        // Verify teacher permissions
        if (!assignment.getCreatedBy().getId().equals(teacherId) &&
            !assignment.getCourse().getAssignedTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("Not authorized to upload copy checker for this assignment");
        }

        // Validate file
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".csv")) {
            throw new RuntimeException("Only CSV files are allowed");
        }

        log.info("Debugging CSV file: {} (size: {} bytes)", originalFilename, file.getSize());

        // Process CSV file (but don't apply penalties)
        List<String> flaggedIdentifiers = processCopyCheckerCSV(file);
        
        Map<String, Object> debugInfo = new HashMap<>();
        debugInfo.put("fileName", originalFilename);
        debugInfo.put("assignmentTitle", assignment.getTitle());
        debugInfo.put("flaggedIdentifiers", flaggedIdentifiers);
        debugInfo.put("totalFlagged", flaggedIdentifiers.size());
        
        List<Map<String, Object>> studentMatches = new ArrayList<>();
        
        for (String identifier : flaggedIdentifiers) {
            Map<String, Object> matchInfo = new HashMap<>();
            matchInfo.put("identifier", identifier);
            
            Optional<User> studentOpt = Optional.empty();
            
            // Try to find student by email first, then by name
            if (identifier.contains("@")) {
                studentOpt = userRepository.findByEmail(identifier.toLowerCase());
                matchInfo.put("searchType", "email");
            } else {
                studentOpt = userRepository.findByNameIgnoreCase(identifier);
                if (!studentOpt.isPresent()) {
                    List<User> possibleStudents = userRepository.findByNameContainingIgnoreCase(identifier);
                    matchInfo.put("possibleMatches", possibleStudents.stream()
                            .map(u -> Map.of("id", u.getId(), "name", u.getName(), "email", u.getEmail()))
                            .collect(Collectors.toList()));
                    if (possibleStudents.size() == 1) {
                        studentOpt = Optional.of(possibleStudents.get(0));
                        matchInfo.put("searchType", "partial_name_match");
                    } else if (possibleStudents.size() > 1) {
                        studentOpt = possibleStudents.stream()
                                .filter(u -> u.getName().equalsIgnoreCase(identifier))
                                .findFirst();
                        matchInfo.put("searchType", "exact_name_from_multiple");
                    }
                } else {
                    matchInfo.put("searchType", "exact_name");
                }
            }
            
            if (studentOpt.isPresent()) {
                User student = studentOpt.get();
                matchInfo.put("found", true);
                matchInfo.put("studentId", student.getId());
                matchInfo.put("studentName", student.getName());
                matchInfo.put("studentEmail", student.getEmail());
                
                // Check if assessment grid exists
                Optional<AssessmentGrid> assessmentGridOpt = assessmentGridRepository.findByAssignmentAndStudent(assignment, student);
                if (assessmentGridOpt.isPresent()) {
                    AssessmentGrid ag = assessmentGridOpt.get();
                    matchInfo.put("hasAssessmentGrid", true);
                    matchInfo.put("currentTeacherMark", ag.getTeacherMark());
                    matchInfo.put("currentFinalMark", ag.getFinalMark());
                    matchInfo.put("alreadyPenalized", ag.getCopyPenaltyApplied());
                } else {
                    matchInfo.put("hasAssessmentGrid", false);
                }
            } else {
                matchInfo.put("found", false);
            }
            
            studentMatches.add(matchInfo);
        }
        
        debugInfo.put("studentMatches", studentMatches);
        debugInfo.put("message", "Debug completed - no penalties were applied");
        
        return debugInfo;
    }

    /**
     * Process grading for all students in an assignment
     */
    public String processAssignmentGrading(Long assignmentId, Long teacherId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
        
        if (!assignment.getCreatedBy().getId().equals(teacherId)) {
            throw new RuntimeException("Unauthorized access");
        }

        List<AssessmentGrid> assessments = assessmentGridRepository.findByAssignmentId(assignmentId);
        
        int processed = 0;
        for (AssessmentGrid assessment : assessments) {
            assessment.setIsProcessed(true);
            assessmentGridRepository.save(assessment);
            processed++;
        }
        
        return "Processed grading for " + processed + " students";
    }

    /**
     * Update late penalties for all assessment grids in a course
     */
    public String updateLatePenaltiesForCourse(Long courseId, Long teacherId) {
        // Verify teacher permissions
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        if (teacher.getRole() != Role.TEACHER) {
            throw new RuntimeException("Only teachers can update late penalties");
        }

        // Get all assignments for the course created by this teacher
        List<Assignment> assignments = assignmentRepository.findByCourseIdAndCreatedByIdOrderByDeadlineAsc(courseId, teacherId);
        
        if (assignments.isEmpty()) {
            return "No assignments found for this course";
        }

        // Verify teacher has permission for this course
        Assignment firstAssignment = assignments.get(0);
        Course course = firstAssignment.getCourse();
        
        if (!course.getAssignedTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("Not authorized to update late penalties for this course");
        }

        int totalUpdated = 0;
        int latePenaltiesApplied = 0;
        int latePenaltiesRemoved = 0;

        for (Assignment assignment : assignments) {
            List<AssessmentGrid> assessmentGrids = assessmentGridRepository.findByAssignmentId(assignment.getId());
            
            for (AssessmentGrid assessmentGrid : assessmentGrids) {
                // Get latest submission info
                StudentSubmission submission = submissionRepository.findByAssignmentAndStudent(
                        assignment, assessmentGrid.getStudent()).orElse(null);
                
                boolean wasLate = assessmentGrid.getLatePenaltyApplied();
                boolean isNowLate = (submission != null && submission.getIsLate());
                
                // Update submission reference
                assessmentGrid.setSubmission(submission);
                
                if (isNowLate && !wasLate) {
                    // Apply late penalty
                    assessmentGrid.setLatePenaltyApplied(true);
                    assessmentGrid.calculateFinalMark();
                    assessmentGridRepository.save(assessmentGrid);
                    latePenaltiesApplied++;
                    log.info("Applied automatic late penalty to {} for assignment {}", 
                            assessmentGrid.getStudent().getName(), assignment.getTitle());
                } else if (!isNowLate && wasLate) {
                    // Remove late penalty
                    assessmentGrid.setLatePenaltyApplied(false);
                    assessmentGrid.calculateFinalMark();
                    assessmentGridRepository.save(assessmentGrid);
                    latePenaltiesRemoved++;
                    log.info("Removed late penalty from {} for assignment {}", 
                            assessmentGrid.getStudent().getName(), assignment.getTitle());
                } else if (isNowLate) {
                    // Ensure final mark is calculated correctly for already-penalized late submissions
                    assessmentGrid.calculateFinalMark();
                    assessmentGridRepository.save(assessmentGrid);
                }
                
                totalUpdated++;
            }
        }

        return String.format("Updated %d assessment records. Applied %d late penalties, removed %d late penalties.", 
                totalUpdated, latePenaltiesApplied, latePenaltiesRemoved);
    }

    /**
     * Auto-sync assessment grid when assignments change
     */
    @Transactional
    public void syncAssessmentGridForAssignment(Assignment assignment) {
        // Get all enrolled students
        List<CourseEnrollment> enrollments = courseEnrollmentRepository.findByCourseAndStatus(assignment.getCourse(), EnrollmentStatus.APPROVED);
        
        for (CourseEnrollment enrollment : enrollments) {
            AssessmentGrid existing = assessmentGridRepository.findByAssignmentAndStudent(assignment, enrollment.getStudent())
                    .orElse(null);

            if (existing == null) {
                createNewAssessmentGridEntry(assignment, enrollment.getStudent());
            } else {
                // Update existing assessment grid with latest submission info
                updateAssessmentGridWithSubmission(existing);
            }
        }
    }

    /**
     * Update assessment grid when submission changes (for automatic late penalty detection)
     */
    @Transactional
    public void updateAssessmentGridWithSubmission(AssessmentGrid assessmentGrid) {
        // Get latest submission
        StudentSubmission submission = submissionRepository.findByAssignmentAndStudent(
                assessmentGrid.getAssignment(), assessmentGrid.getStudent())
                .orElse(null);

        // Update submission reference
        assessmentGrid.setSubmission(submission);

        // Check and apply/remove late penalty automatically
        boolean wasLate = assessmentGrid.getLatePenaltyApplied();
        boolean isNowLate = (submission != null && submission.getIsLate());

        if (isNowLate && !wasLate) {
            log.info("Applying automatic late penalty to {} for assignment {}", 
                    assessmentGrid.getStudent().getName(), assessmentGrid.getAssignment().getTitle());
            assessmentGrid.setLatePenaltyApplied(true);
        } else if (!isNowLate && wasLate) {
            log.info("Removing late penalty from {} for assignment {} (submission no longer late)", 
                    assessmentGrid.getStudent().getName(), assessmentGrid.getAssignment().getTitle());
            assessmentGrid.setLatePenaltyApplied(false);
        }

        // Recalculate final mark with updated penalty status
        assessmentGrid.calculateFinalMark();
        assessmentGridRepository.save(assessmentGrid);
    }

    /**
     * Update assessment grid when a submission is created or updated
     * Call this from StudentSubmissionService when submissions change
     */
    @Transactional  
    public void onSubmissionUpdated(Assignment assignment, User student) {
        Optional<AssessmentGrid> assessmentGridOpt = assessmentGridRepository.findByAssignmentAndStudent(assignment, student);
        
        if (assessmentGridOpt.isPresent()) {
            updateAssessmentGridWithSubmission(assessmentGridOpt.get());
        } else {
            // Create new assessment grid entry if it doesn't exist
            createNewAssessmentGridEntry(assignment, student);
        }
    }

    /**
     * Remove assessment grid entries when assignment is deleted
     */
    @Transactional
    public void removeAssessmentGridForAssignment(Assignment assignment) {
        log.info("Removing all assessment grid entries for assignment: {} (ID: {})", 
                assignment.getTitle(), assignment.getId());
        
        int deletedCount = assessmentGridRepository.findByAssignmentId(assignment.getId()).size();
        assessmentGridRepository.deleteByAssignment(assignment);
        
        log.info("Successfully removed {} assessment grid entries for assignment: {}", 
                deletedCount, assignment.getTitle());
    }

    /**
     * Remove assessment grid entries by assignment ID
     * Useful for cleanup operations when you only have the assignment ID
     */
    @Transactional
    public void removeAssessmentGridForAssignmentId(Long assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found with ID: " + assignmentId));
        
        removeAssessmentGridForAssignment(assignment);
    }

    // Private helper methods

    private AssessmentGrid createNewAssessmentGridEntry(Assignment assignment, User student) {
        // Get submission if exists
        StudentSubmission submission = submissionRepository.findByAssignmentAndStudent(assignment, student)
                .orElse(null);

        AssessmentGrid assessmentGrid = AssessmentGrid.builder()
                .assignment(assignment)
                .course(assignment.getCourse())
                .student(student)
                .submission(submission)
                .build();

        // Automatically check and apply late penalty if submission is late
        if (submission != null && submission.getIsLate()) {
            log.info("Late submission detected for student {} in assignment {}: submitted at {}, deadline was {}", 
                    student.getName(), assignment.getTitle(), submission.getSubmittedAt(), assignment.getDeadline());
            assessmentGrid.setLatePenaltyApplied(true);
        }

        return assessmentGridRepository.save(assessmentGrid);
    }

    private List<AssessmentGrid> createAssessmentGridForAssignment(Assignment assignment) {
        List<CourseEnrollment> enrollments = courseEnrollmentRepository.findByCourseAndStatus(assignment.getCourse(), EnrollmentStatus.APPROVED);
        List<AssessmentGrid> assessmentGrids = new ArrayList<>();

        for (CourseEnrollment enrollment : enrollments) {
            AssessmentGrid assessmentGrid = createNewAssessmentGridEntry(assignment, enrollment.getStudent());
            assessmentGrids.add(assessmentGrid);
        }

        return assessmentGrids;
    }

    private List<String> processCopyCheckerCSV(MultipartFile file) throws IOException {
        Set<String> flaggedIdentifiersSet = new HashSet<>(); // Use Set to avoid duplicates
        log.info("Processing copy checker CSV file: {}", file.getOriginalFilename());

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream()))) {
            String line;
            int lineNumber = 0;
            String header = null;

            while ((line = reader.readLine()) != null) {
                lineNumber++;
                line = line.trim();
                
                if (lineNumber == 1) {
                    header = line.toLowerCase();
                    log.info("CSV Header: {}", line);
                    continue; // Skip header
                }

                if (line.isEmpty()) {
                    continue; // Skip empty lines
                }

                String[] columns = line.split(",");
                
                // Detect CSV format based on header
                if (header != null && header.contains("student 1") && header.contains("student 2")) {
                    // Format: Student 1,Student 2,Similarity %,Type,Files Compared
                    // FLAG ALL STUDENTS who appear in this similarity comparison file
                    if (columns.length >= 2) {
                        String student1 = columns[0].trim();
                        String student2 = columns[1].trim();
                        
                        // Add both students to Set (automatically handles duplicates)
                        // since appearing in the copy checker file means they are flagged
                        flaggedIdentifiersSet.add(student1);
                        flaggedIdentifiersSet.add(student2);
                        
                        String similarityStr = columns.length >= 3 ? columns[2].trim() : "N/A";
                        log.info("Processing students from copy checker file ({}% similarity): {} and {}", 
                                similarityStr, student1, student2);
                    }
                } else {
                    // Legacy formats: email-based or simple formats
                    if (columns.length >= 1) {
                        String identifier = columns[0].trim();
                        
                        // Check if it's an email or name
                        boolean isEmail = identifier.contains("@");
                        boolean shouldFlag = false;
                        
                        if (columns.length == 1) {
                            // Only identifier provided - assume flagged
                            shouldFlag = true;
                        } else if (columns.length >= 2) {
                            String flaggedValue = columns[columns.length - 1].trim().toLowerCase();
                            shouldFlag = "true".equals(flaggedValue) || 
                                        "1".equals(flaggedValue) || 
                                        "yes".equals(flaggedValue) ||
                                        "flagged".equals(flaggedValue) ||
                                        "copied".equals(flaggedValue);
                        }
                        
                        if (shouldFlag) {
                            flaggedIdentifiersSet.add(identifier);
                            log.info("Flagged student {}: {}", isEmail ? "email" : "name", identifier);
                        }
                    }
                }
            }
        }

        // Convert Set back to List and log unique count
        List<String> flaggedIdentifiers = new ArrayList<>(flaggedIdentifiersSet);
        log.info("Total UNIQUE flagged identifiers found: {}", flaggedIdentifiers.size());
        log.info("Unique flagged students: {}", flaggedIdentifiers);
        return flaggedIdentifiers;
    }

    private int applyCopyPenalties(Assignment assignment, List<String> flaggedIdentifiers, String filePath, Long teacherId) {
        int penalizedCount = 0;
        User teacher = userRepository.findById(teacherId).orElse(null);
        
        log.info("Applying copy penalties for assignment '{}' to {} flagged identifiers", 
                assignment.getTitle(), flaggedIdentifiers.size());

        for (String identifier : flaggedIdentifiers) {
            log.info("Processing flagged identifier: {}", identifier);
            
            Optional<User> studentOpt = Optional.empty();
            
            // Try to find student by email first, then by name
            if (identifier.contains("@")) {
                // It's an email
                studentOpt = userRepository.findByEmail(identifier.toLowerCase());
                if (!studentOpt.isPresent()) {
                    log.warn("Student not found with email: {}", identifier);
                }
            } else {
                // It's a name - find by name (case insensitive)
                studentOpt = userRepository.findByNameIgnoreCase(identifier);
                if (!studentOpt.isPresent()) {
                    // Try partial name matching
                    List<User> possibleStudents = userRepository.findByNameContainingIgnoreCase(identifier);
                    if (possibleStudents.size() == 1) {
                        studentOpt = Optional.of(possibleStudents.get(0));
                        log.info("Found student by partial name match: {} -> {}", identifier, possibleStudents.get(0).getName());
                    } else if (possibleStudents.size() > 1) {
                        log.warn("Multiple students found with name containing '{}': {}", identifier, 
                                possibleStudents.stream().map(User::getName).collect(Collectors.toList()));
                        // Use exact match from the list
                        studentOpt = possibleStudents.stream()
                                .filter(u -> u.getName().equalsIgnoreCase(identifier))
                                .findFirst();
                    }
                    
                    if (!studentOpt.isPresent()) {
                        log.warn("Student not found with name: {}", identifier);
                        continue;
                    }
                }
            }
            
            if (!studentOpt.isPresent()) {
                continue;
            }
            
            User student = studentOpt.get();
            log.info("Found student: {} (ID: {}, Email: {})", student.getName(), student.getId(), student.getEmail());
            
            Optional<AssessmentGrid> assessmentGridOpt = assessmentGridRepository.findByAssignmentAndStudent(assignment, student);
            if (!assessmentGridOpt.isPresent()) {
                log.warn("Assessment grid not found for student {} in assignment {}", student.getName(), assignment.getTitle());
                continue;
            }
            
            AssessmentGrid assessmentGrid = assessmentGridOpt.get();
            
            // Apply copy penalty only once per assignment
            if (assessmentGrid.getCopyPenaltyApplied()) {
                log.info("Copy penalty already applied for student: {}", student.getName());
                continue;
            }
            
            log.info("Applying copy penalty to student: {} for assignment: {}", 
                    student.getName(), assignment.getTitle());
            
            Double previousFinalMark = assessmentGrid.getFinalMark();
            
            assessmentGrid.setCopyPenaltyApplied(true);
            assessmentGrid.setCopyCheckerFilePath(filePath);
            assessmentGrid.setGradedBy(teacher);
            assessmentGrid.setGradedAt(LocalDateTime.now());
            
            // Recalculate final mark with penalty
            assessmentGrid.calculateFinalMark();
            
            AssessmentGrid saved = assessmentGridRepository.save(assessmentGrid);
            log.info("Copy penalty applied successfully to {}: Final mark {} -> {} (Teacher mark: {})", 
                    student.getName(), previousFinalMark, saved.getFinalMark(), saved.getTeacherMark());
            
            penalizedCount++;
        }

        log.info("Copy penalty application complete. {} students penalized out of {} flagged", 
                penalizedCount, flaggedIdentifiers.size());
        return penalizedCount;
    }

    private AssessmentGridResponse mapToResponse(AssessmentGrid assessmentGrid) {
        // Get submission files if submission exists
        List<SubmissionFileResponse> submissionFiles = new ArrayList<>();
        if (assessmentGrid.getSubmission() != null) {
            List<SubmissionFile> files = submissionFileRepository.findBySubmissionOrderByUploadedAtAsc(assessmentGrid.getSubmission());
            submissionFiles = files.stream()
                    .map(file -> SubmissionFileResponse.builder()
                            .id(file.getId())
                            .originalFilename(file.getOriginalFilename())
                            .fileSize(file.getFileSize())
                            .contentType(file.getContentType())
                            .uploadedAt(file.getUploadedAt())
                            .downloadUrl("/api/submissions/files/" + file.getId() + "/download")
                            .build())
                    .collect(Collectors.toList());
        }

        // Calculate obtained percentage
        Double obtainedPercentage = null;
        if (assessmentGrid.getFinalMark() != null && assessmentGrid.getAssignment().getMaxMarks() != null) {
            obtainedPercentage = (assessmentGrid.getFinalMark() / assessmentGrid.getAssignment().getMaxMarks()) * 100;
        }

        // Determine grade status
        String gradeStatus = "NOT_GRADED";
        if (assessmentGrid.getIsProcessed() && assessmentGrid.getFinalMark() != null) {
            gradeStatus = "GRADED";
        } else if (assessmentGrid.getTeacherMark() != null) {
            gradeStatus = "NEEDS_REVIEW";
        }

        return AssessmentGridResponse.builder()
                .id(assessmentGrid.getId())
                .assignmentId(assessmentGrid.getAssignment().getId())
                .assignmentTitle(assessmentGrid.getAssignment().getTitle())
                .maxMarks(assessmentGrid.getAssignment().getMaxMarks())
                .assignmentDeadline(assessmentGrid.getAssignment().getDeadline())
                .studentId(assessmentGrid.getStudent().getId())
                .studentName(assessmentGrid.getStudent().getName())
                .studentEmail(assessmentGrid.getStudent().getEmail())
                .submissionId(assessmentGrid.getSubmission() != null ? assessmentGrid.getSubmission().getId() : null)
                .hasSubmission(assessmentGrid.hasSubmission())
                .submissionStatus(assessmentGrid.getSubmissionStatus())
                .submissionDate(assessmentGrid.getSubmissionDate())
                .isLateSubmission(assessmentGrid.getSubmission() != null ? assessmentGrid.getSubmission().getIsLate() : false)
                .submissionFiles(submissionFiles)
                .teacherMark(assessmentGrid.getTeacherMark())
                .manualWeight(assessmentGrid.getManualWeight())
                .latePenaltyApplied(assessmentGrid.getLatePenaltyApplied())
                .copyPenaltyApplied(assessmentGrid.getCopyPenaltyApplied())
                .finalMark(assessmentGrid.getFinalMark())
                .gradingNotes(assessmentGrid.getGradingNotes())
                .copyCheckerFilePath(assessmentGrid.getCopyCheckerFilePath())
                .isProcessed(assessmentGrid.getIsProcessed())
                .gradedByName(assessmentGrid.getGradedBy() != null ? assessmentGrid.getGradedBy().getName() : null)
                .gradedAt(assessmentGrid.getGradedAt())
                .obtainedPercentage(obtainedPercentage)
                .gradeStatus(gradeStatus)
                .build();
    }
}
