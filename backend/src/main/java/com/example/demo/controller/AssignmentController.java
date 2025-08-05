package com.example.demo.controller;

import com.example.demo.model.*;
import com.example.demo.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
@Slf4j
public class AssignmentController {

    private final AssignmentService assignmentService;

    /**
     * Create a new assignment
     * POST /api/assignments
     */
    @PostMapping
    public ResponseEntity<?> createAssignment(
            @RequestBody AssignmentCreateRequest request,
            @RequestParam Long teacherId) {
        try {
            log.info("Creating assignment request: {}", request.getTitle());
            AssignmentResponse assignment = assignmentService.createAssignment(request, teacherId);
            return ResponseEntity.ok(assignment);
        } catch (RuntimeException e) {
            log.error("Error creating assignment: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update an existing assignment
     * PUT /api/assignments/{assignmentId}
     */
    @PutMapping("/{assignmentId}")
    public ResponseEntity<?> updateAssignment(
            @PathVariable Long assignmentId,
            @RequestBody AssignmentUpdateRequest request,
            @RequestParam Long teacherId) {
        try {
            log.info("Updating assignment {}", assignmentId);
            AssignmentResponse assignment = assignmentService.updateAssignment(assignmentId, request, teacherId);
            return ResponseEntity.ok(assignment);
        } catch (RuntimeException e) {
            log.error("Error updating assignment: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all assignments for a specific course
     * GET /api/assignments/course/{courseId}
     */
    @GetMapping("/course/{courseId}")
    public ResponseEntity<?> getAssignmentsForCourse(@PathVariable Long courseId) {
        try {
            List<AssignmentResponse> assignments = assignmentService.getAssignmentsForCourse(courseId);
            return ResponseEntity.ok(assignments);
        } catch (RuntimeException e) {
            log.error("Error fetching assignments for course: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all assignments created by a specific teacher
     * GET /api/assignments/teacher/{teacherId}
     */
    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<?> getAssignmentsByTeacher(@PathVariable Long teacherId) {
        try {
            List<AssignmentResponse> assignments = assignmentService.getAssignmentsByTeacher(teacherId);
            return ResponseEntity.ok(assignments);
        } catch (RuntimeException e) {
            log.error("Error fetching assignments for teacher: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get assignments for a specific course created by a specific teacher
     * GET /api/assignments/course/{courseId}/teacher/{teacherId}
     */
    @GetMapping("/course/{courseId}/teacher/{teacherId}")
    public ResponseEntity<?> getAssignmentsForCourseByTeacher(
            @PathVariable Long courseId,
            @PathVariable Long teacherId) {
        try {
            List<AssignmentResponse> assignments = assignmentService.getAssignmentsForCourseByTeacher(courseId, teacherId);
            return ResponseEntity.ok(assignments);
        } catch (RuntimeException e) {
            log.error("Error fetching assignments for course by teacher: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get a specific assignment by ID
     * GET /api/assignments/{assignmentId}
     */
    @GetMapping("/{assignmentId}")
    public ResponseEntity<?> getAssignmentById(@PathVariable Long assignmentId) {
        try {
            AssignmentResponse assignment = assignmentService.getAssignmentById(assignmentId);
            return ResponseEntity.ok(assignment);
        } catch (RuntimeException e) {
            log.error("Error fetching assignment: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete an assignment (soft delete)
     * DELETE /api/assignments/{assignmentId}
     */
    @DeleteMapping("/{assignmentId}")
    public ResponseEntity<?> deleteAssignment(
            @PathVariable Long assignmentId,
            @RequestParam Long teacherId) {
        try {
            String result = assignmentService.deleteAssignment(assignmentId, teacherId);
            return ResponseEntity.ok(Map.of("message", result));
        } catch (RuntimeException e) {
            log.error("Error deleting assignment: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get overdue assignments
     * GET /api/assignments/overdue
     */
    @GetMapping("/overdue")
    public ResponseEntity<?> getOverdueAssignments() {
        try {
            List<AssignmentResponse> assignments = assignmentService.getOverdueAssignments();
            return ResponseEntity.ok(assignments);
        } catch (RuntimeException e) {
            log.error("Error fetching overdue assignments: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get assignments with upcoming deadlines (within 24 hours)
     * GET /api/assignments/upcoming
     */
    @GetMapping("/upcoming")
    public ResponseEntity<?> getUpcomingDeadlines() {
        try {
            List<AssignmentResponse> assignments = assignmentService.getUpcomingDeadlines();
            return ResponseEntity.ok(assignments);
        } catch (RuntimeException e) {
            log.error("Error fetching upcoming assignments: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get assignment statistics for a teacher
     * GET /api/assignments/teacher/{teacherId}/stats
     */
    @GetMapping("/teacher/{teacherId}/stats")
    public ResponseEntity<?> getTeacherStats(@PathVariable Long teacherId) {
        try {
            AssignmentService.AssignmentStats stats = assignmentService.getTeacherStats(teacherId);
            return ResponseEntity.ok(stats);
        } catch (RuntimeException e) {
            log.error("Error fetching teacher assignment stats: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
