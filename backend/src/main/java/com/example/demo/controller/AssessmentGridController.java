package com.example.demo.controller;

import com.example.demo.model.*;
import com.example.demo.service.AssessmentGridService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assessment-grid")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8081"})
public class AssessmentGridController {

    private final AssessmentGridService assessmentGridService;

    /**
     * Generate or get assessment grid for a course
     * GET /api/assessment-grid/course/{courseId}
     */
    @GetMapping("/course/{courseId}")
    public ResponseEntity<?> getCourseAssessmentGrid(
            @PathVariable Long courseId,
            @RequestParam Long teacherId) {
        try {
            List<AssessmentGridResponse> grid = assessmentGridService.generateAssessmentGrid(courseId, teacherId);
            return ResponseEntity.ok(grid);
        } catch (RuntimeException e) {
            log.error("Error getting assessment grid for course {}: {}", courseId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get assessment grid for a specific assignment
     * GET /api/assessment-grid/assignment/{assignmentId}
     */
    @GetMapping("/assignment/{assignmentId}")
    public ResponseEntity<?> getAssignmentAssessmentGrid(
            @PathVariable Long assignmentId,
            @RequestParam Long teacherId) {
        try {
            List<AssessmentGridResponse> grid = assessmentGridService.getAssignmentAssessmentGrid(assignmentId, teacherId);
            return ResponseEntity.ok(grid);
        } catch (RuntimeException e) {
            log.error("Error getting assessment grid for assignment {}: {}", assignmentId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update individual assessment
     * PUT /api/assessment-grid/assessment
     */
    @PutMapping("/assessment")
    public ResponseEntity<?> updateAssessment(
            @RequestBody AssessmentGridUpdateRequest request,
            @RequestParam Long teacherId) {
        try {
            AssessmentGridResponse response = assessmentGridService.updateAssessment(request, teacherId);
            return ResponseEntity.ok(Map.of(
                "message", "Assessment updated successfully",
                "assessment", response
            ));
        } catch (RuntimeException e) {
            log.error("Error updating assessment: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Bulk update assessments
     * PUT /api/assessment-grid/bulk-update
     */
    @PutMapping("/bulk-update")
    public ResponseEntity<?> bulkUpdateAssessments(
            @RequestBody BulkAssessmentUpdateRequest request,
            @RequestParam Long teacherId) {
        try {
            List<AssessmentGridResponse> responses = assessmentGridService.bulkUpdateAssessments(request, teacherId);
            return ResponseEntity.ok(Map.of(
                "message", "Bulk update completed",
                "updated", responses.size(),
                "assessments", responses
            ));
        } catch (RuntimeException e) {
            log.error("Error bulk updating assessments: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Upload copy checker CSV file
     * POST /api/assessment-grid/copy-checker/{assignmentId}
     */
    @PostMapping("/copy-checker/{assignmentId}")
    public ResponseEntity<?> uploadCopyChecker(
            @PathVariable Long assignmentId,
            @RequestParam("file") MultipartFile file,
            @RequestParam Long teacherId) {
        try {
            String result = assessmentGridService.uploadCopyCheckerFile(assignmentId, file, teacherId);
            return ResponseEntity.ok(Map.of("message", result));
        } catch (IOException e) {
            log.error("Error uploading copy checker file: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        } catch (RuntimeException e) {
            log.error("Error processing copy checker: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Process grading for an assignment
     * POST /api/assessment-grid/process/{assignmentId}
     */
    @PostMapping("/process/{assignmentId}")
    public ResponseEntity<?> processAssignmentGrading(
            @PathVariable Long assignmentId,
            @RequestParam Long teacherId) {
        try {
            String result = assessmentGridService.processAssignmentGrading(assignmentId, teacherId);
            return ResponseEntity.ok(Map.of("message", result));
        } catch (RuntimeException e) {
            log.error("Error processing grading for assignment {}: {}", assignmentId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Debug endpoint to test CSV parsing without applying penalties
     * POST /api/assessment-grid/debug-copy-checker/{assignmentId}
     */
    @PostMapping("/debug-copy-checker/{assignmentId}")
    public ResponseEntity<?> debugCopyChecker(
            @PathVariable Long assignmentId,
            @RequestParam("file") MultipartFile file,
            @RequestParam Long teacherId) {
        try {
            // This is for debugging - it won't apply penalties, just show what would happen
            return ResponseEntity.ok(assessmentGridService.debugCopyCheckerFile(assignmentId, file, teacherId));
        } catch (Exception e) {
            log.error("Error debugging copy checker: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update late penalties for all students in a course (manual trigger)
     * POST /api/assessment-grid/update-late-penalties/{courseId}
     */
    @PostMapping("/update-late-penalties/{courseId}")
    public ResponseEntity<?> updateLatePenalties(
            @PathVariable Long courseId,
            @RequestParam Long teacherId) {
        try {
            String result = assessmentGridService.updateLatePenaltiesForCourse(courseId, teacherId);
            return ResponseEntity.ok(Map.of("message", result));
        } catch (RuntimeException e) {
            log.error("Error updating late penalties for course {}: {}", courseId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
