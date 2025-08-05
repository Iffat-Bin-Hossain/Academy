package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AssignmentService {

    private final AssignmentRepository assignmentRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final CourseTeacherRepository courseTeacherRepository;

    /**
     * Create a new assignment for a course
     * Only teachers assigned to the course can create assignments
     */
    public AssignmentResponse createAssignment(AssignmentCreateRequest request, Long teacherId) {
        log.info("Creating assignment '{}' for course {} by teacher {}", 
                request.getTitle(), request.getCourseId(), teacherId);

        // Validate teacher
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        if (!teacher.getRole().equals(Role.TEACHER)) {
            throw new RuntimeException("Only teachers can create assignments");
        }

        if (!teacher.isApproved()) {
            throw new RuntimeException("Teacher account is not approved");
        }

        // Validate course
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Check if teacher is assigned to this course
        boolean isAssigned = courseTeacherRepository.existsByCourseAndTeacherAndActiveTrue(course, teacher) ||
                           (course.getAssignedTeacher() != null && course.getAssignedTeacher().getId().equals(teacherId));

        if (!isAssigned) {
            throw new RuntimeException("Teacher is not assigned to this course");
        }

        // Validate request
        validateAssignmentRequest(request);

        // Create assignment
        Assignment assignment = Assignment.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .maxMarks(request.getMaxMarks())
                .course(course)
                .createdBy(teacher)
                .deadline(request.getDeadline())
                .lateSubmissionDeadline(request.getLateSubmissionDeadline())
                .instructions(request.getInstructions())
                .assignmentType(request.getAssignmentType() != null ? request.getAssignmentType() : AssignmentType.HOMEWORK)
                .isActive(true)
                .build();

        Assignment savedAssignment = assignmentRepository.save(assignment);
        log.info("Assignment '{}' created successfully with ID: {}", savedAssignment.getTitle(), savedAssignment.getId());

        return mapToResponse(savedAssignment);
    }

    /**
     * Update an existing assignment
     * Any teacher assigned to the course can update assignments in that course
     */
    public AssignmentResponse updateAssignment(Long assignmentId, AssignmentUpdateRequest request, Long teacherId) {
        log.info("Updating assignment {} by teacher {}", assignmentId, teacherId);

        // Validate teacher
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        if (!teacher.getRole().equals(Role.TEACHER)) {
            throw new RuntimeException("Only teachers can update assignments");
        }

        if (!teacher.isApproved()) {
            throw new RuntimeException("Teacher account is not approved");
        }

        // Get assignment
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        // Check if teacher is assigned to the course
        Course course = assignment.getCourse();
        boolean isAssigned = courseTeacherRepository.existsByCourseAndTeacherAndActiveTrue(course, teacher) ||
                           (course.getAssignedTeacher() != null && course.getAssignedTeacher().getId().equals(teacherId));

        if (!isAssigned) {
            throw new RuntimeException("You are not assigned to this course, cannot update assignment");
        }

        // Validate update request
        if (request.getTitle() != null && request.getTitle().trim().isEmpty()) {
            throw new RuntimeException("Assignment title cannot be empty");
        }

        if (request.getMaxMarks() != null && request.getMaxMarks() <= 0) {
            throw new RuntimeException("Maximum marks must be greater than 0");
        }

        if (request.getDeadline() != null && request.getDeadline().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Deadline cannot be in the past");
        }

        // Update fields
        if (request.getTitle() != null) assignment.setTitle(request.getTitle());
        if (request.getContent() != null) assignment.setContent(request.getContent());
        if (request.getMaxMarks() != null) assignment.setMaxMarks(request.getMaxMarks());
        if (request.getDeadline() != null) assignment.setDeadline(request.getDeadline());
        if (request.getLateSubmissionDeadline() != null) assignment.setLateSubmissionDeadline(request.getLateSubmissionDeadline());
        if (request.getInstructions() != null) assignment.setInstructions(request.getInstructions());
        if (request.getAssignmentType() != null) assignment.setAssignmentType(request.getAssignmentType());
        if (request.getIsActive() != null) assignment.setIsActive(request.getIsActive());

        Assignment updatedAssignment = assignmentRepository.save(assignment);
        log.info("Assignment '{}' updated successfully", updatedAssignment.getTitle());

        return mapToResponse(updatedAssignment);
    }

    /**
     * Get all assignments for a course (visible to students and teachers)
     */
    public List<AssignmentResponse> getAssignmentsForCourse(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        List<Assignment> assignments = assignmentRepository.findActiveByCourseId(courseId);
        return assignments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get all assignments created by a specific teacher
     */
    public List<AssignmentResponse> getAssignmentsByTeacher(Long teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        List<Assignment> assignments = assignmentRepository.findByCreatedByAndIsActiveTrueOrderByCreatedAtDesc(teacher);
        return assignments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get assignments for a specific course created by a specific teacher
     */
    public List<AssignmentResponse> getAssignmentsForCourseByTeacher(Long courseId, Long teacherId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        // Check if teacher is assigned to this course
        boolean isAssigned = courseTeacherRepository.existsByCourseAndTeacherAndActiveTrue(course, teacher) ||
                           (course.getAssignedTeacher() != null && course.getAssignedTeacher().getId().equals(teacherId));

        if (!isAssigned) {
            throw new RuntimeException("Teacher is not assigned to this course");
        }

        List<Assignment> assignments = assignmentRepository.findByCourseAndCreatedByOrderByCreatedAtDesc(course, teacher);
        return assignments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get a specific assignment by ID
     */
    public AssignmentResponse getAssignmentById(Long assignmentId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (!assignment.getIsActive()) {
            throw new RuntimeException("Assignment is not active");
        }

        return mapToResponse(assignment);
    }

    /**
     * Delete an assignment (soft delete - mark as inactive)
     * Any teacher assigned to the course can delete assignments in that course
     */
    public String deleteAssignment(Long assignmentId, Long teacherId) {
        log.info("Deleting assignment {} by teacher {}", assignmentId, teacherId);

        // Validate teacher
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        if (!teacher.getRole().equals(Role.TEACHER)) {
            throw new RuntimeException("Only teachers can delete assignments");
        }

        if (!teacher.isApproved()) {
            throw new RuntimeException("Teacher account is not approved");
        }

        // Get assignment
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        // Check if teacher is assigned to the course
        Course course = assignment.getCourse();
        boolean isAssigned = courseTeacherRepository.existsByCourseAndTeacherAndActiveTrue(course, teacher) ||
                           (course.getAssignedTeacher() != null && course.getAssignedTeacher().getId().equals(teacherId));

        if (!isAssigned) {
            throw new RuntimeException("You are not assigned to this course, cannot delete assignment");
        }

        assignment.setIsActive(false);
        assignmentRepository.save(assignment);

        log.info("Assignment '{}' deleted successfully", assignment.getTitle());
        return "Assignment deleted successfully";
    }

    /**
     * Get overdue assignments
     */
    public List<AssignmentResponse> getOverdueAssignments() {
        List<Assignment> overdueAssignments = assignmentRepository.findOverdueAssignments(LocalDateTime.now());
        return overdueAssignments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get assignments with upcoming deadlines (within next 24 hours)
     */
    public List<AssignmentResponse> getUpcomingDeadlines() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime tomorrow = now.plusHours(24);
        
        List<Assignment> upcomingAssignments = assignmentRepository.findUpcomingDeadlines(now, tomorrow);
        return upcomingAssignments.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get assignment statistics for a teacher
     */
    public AssignmentStats getTeacherStats(Long teacherId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        long totalAssignments = assignmentRepository.countByCreatedByAndIsActiveTrue(teacher);
        List<Assignment> overdueAssignments = assignmentRepository.findOverdueAssignments(LocalDateTime.now())
                .stream()
                .filter(a -> a.getCreatedBy().getId().equals(teacherId))
                .collect(Collectors.toList());

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime tomorrow = now.plusHours(24);
        List<Assignment> upcomingAssignments = assignmentRepository.findUpcomingDeadlines(now, tomorrow)
                .stream()
                .filter(a -> a.getCreatedBy().getId().equals(teacherId))
                .collect(Collectors.toList());

        return AssignmentStats.builder()
                .totalAssignments(totalAssignments)
                .overdueAssignments(overdueAssignments.size())
                .upcomingDeadlines(upcomingAssignments.size())
                .build();
    }

    /**
     * Validate assignment request
     */
    private void validateAssignmentRequest(AssignmentCreateRequest request) {
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new RuntimeException("Assignment title is required");
        }

        if (request.getMaxMarks() == null || request.getMaxMarks() <= 0) {
            throw new RuntimeException("Maximum marks must be greater than 0");
        }

        if (request.getDeadline() == null) {
            throw new RuntimeException("Assignment deadline is required");
        }

        if (request.getDeadline().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Deadline cannot be in the past");
        }

        if (request.getLateSubmissionDeadline() != null && 
            request.getLateSubmissionDeadline().isBefore(request.getDeadline())) {
            throw new RuntimeException("Late submission deadline cannot be before the main deadline");
        }
    }

    /**
     * Map Assignment entity to AssignmentResponse DTO
     */
    private AssignmentResponse mapToResponse(Assignment assignment) {
        LocalDateTime now = LocalDateTime.now();
        boolean isOverdue = assignment.getDeadline().isBefore(now);
        boolean canSubmitLate = assignment.getLateSubmissionDeadline() != null && 
                               assignment.getLateSubmissionDeadline().isAfter(now);

        return AssignmentResponse.builder()
                .id(assignment.getId())
                .title(assignment.getTitle())
                .content(assignment.getContent())
                .maxMarks(assignment.getMaxMarks())
                .courseId(assignment.getCourse().getId())
                .courseTitle(assignment.getCourse().getTitle())
                .courseCode(assignment.getCourse().getCourseCode())
                .createdById(assignment.getCreatedBy().getId())
                .createdByName(assignment.getCreatedBy().getName())
                .createdAt(assignment.getCreatedAt())
                .updatedAt(assignment.getUpdatedAt())
                .deadline(assignment.getDeadline())
                .lateSubmissionDeadline(assignment.getLateSubmissionDeadline())
                .instructions(assignment.getInstructions())
                .assignmentType(assignment.getAssignmentType())
                .isActive(assignment.getIsActive())
                .isOverdue(isOverdue)
                .canSubmitLate(canSubmitLate)
                .build();
    }

    // Inner class for assignment statistics
    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class AssignmentStats {
        private long totalAssignments;
        private long overdueAssignments;
        private long upcomingDeadlines;
    }
}
