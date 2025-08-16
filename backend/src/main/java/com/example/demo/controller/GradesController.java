package com.example.demo.controller;

import com.example.demo.service.GradesService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/grades")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8081"})
public class GradesController {

    private final GradesService gradesService;

    /**
     * Get student grades for a specific course
     * GET /api/grades/student/{studentId}/course/{courseId}
     */
    @GetMapping("/student/{studentId}/course/{courseId}")
    public ResponseEntity<?> getStudentGradesForCourse(
            @PathVariable Long studentId,
            @PathVariable Long courseId) {
        try {
            Map<String, Object> grades = gradesService.getStudentGradesForCourse(studentId, courseId);
            return ResponseEntity.ok(grades);
        } catch (RuntimeException e) {
            log.error("Error fetching grades for student {} in course {}: {}", studentId, courseId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all grades for a student across all enrolled courses
     * GET /api/grades/student/{studentId}
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getAllStudentGrades(@PathVariable Long studentId) {
        try {
            Map<String, Object> allGrades = gradesService.getAllStudentGrades(studentId);
            return ResponseEntity.ok(allGrades);
        } catch (RuntimeException e) {
            log.error("Error fetching all grades for student {}: {}", studentId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get student performance analytics
     * GET /api/grades/student/{studentId}/performance
     */
    @GetMapping("/student/{studentId}/performance")
    public ResponseEntity<?> getStudentPerformanceAnalytics(@PathVariable Long studentId) {
        try {
            Map<String, Object> performance = gradesService.getStudentPerformanceAnalytics(studentId);
            return ResponseEntity.ok(performance);
        } catch (RuntimeException e) {
            log.error("Error fetching performance analytics for student {}: {}", studentId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Toggle grade visibility for an assignment (teacher only)
     * PUT /api/grades/assignment/{assignmentId}/visibility
     */
    @PutMapping("/assignment/{assignmentId}/visibility")
    public ResponseEntity<?> toggleAssignmentGradeVisibility(
            @PathVariable Long assignmentId,
            @RequestParam Long teacherId,
            @RequestParam boolean visible) {
        try {
            String result = gradesService.toggleAssignmentGradeVisibility(assignmentId, teacherId, visible);
            return ResponseEntity.ok(Map.of("message", result));
        } catch (RuntimeException e) {
            log.error("Error toggling grade visibility for assignment {}: {}", assignmentId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get grade visibility status for assignments in a course
     * GET /api/grades/course/{courseId}/visibility
     */
    @GetMapping("/course/{courseId}/visibility")
    public ResponseEntity<?> getCourseGradeVisibility(@PathVariable Long courseId) {
        try {
            Map<String, Object> visibility = gradesService.getCourseGradeVisibility(courseId);
            return ResponseEntity.ok(visibility);
        } catch (RuntimeException e) {
            log.error("Error fetching grade visibility for course {}: {}", courseId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
