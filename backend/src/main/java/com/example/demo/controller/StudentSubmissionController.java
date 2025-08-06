package com.example.demo.controller;

import com.example.demo.model.StudentSubmissionResponse;
import com.example.demo.service.StudentSubmissionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
@Slf4j
public class StudentSubmissionController {

    private final StudentSubmissionService submissionService;

    /**
     * Submit assignment
     * POST /api/submissions
     */
    @PostMapping
    public ResponseEntity<?> submitAssignment(
            @RequestParam Long assignmentId,
            @RequestParam Long studentId,
            @RequestParam(required = false) String submissionText,
            @RequestParam(required = false) MultipartFile file) {
        try {
            StudentSubmissionResponse submission = submissionService.submitAssignment(
                    assignmentId, studentId, submissionText, file);
            
            return ResponseEntity.ok(Map.of(
                "message", "Assignment submitted successfully",
                "submission", submission
            ));
        } catch (IOException e) {
            log.error("Error submitting assignment: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        } catch (RuntimeException e) {
            log.error("Error submitting assignment: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all submissions for an assignment (teacher view)
     * GET /api/submissions/assignment/{assignmentId}
     */
    @GetMapping("/assignment/{assignmentId}")
    public ResponseEntity<?> getSubmissionsForAssignment(
            @PathVariable Long assignmentId,
            @RequestParam Long teacherId) {
        try {
            List<StudentSubmissionResponse> submissions = submissionService.getSubmissionsForAssignment(
                    assignmentId, teacherId);
            
            return ResponseEntity.ok(submissions);
        } catch (RuntimeException e) {
            log.error("Error fetching assignment submissions: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get student's submissions
     * GET /api/submissions/student/{studentId}
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getStudentSubmissions(@PathVariable Long studentId) {
        try {
            List<StudentSubmissionResponse> submissions = submissionService.getStudentSubmissions(studentId);
            return ResponseEntity.ok(submissions);
        } catch (RuntimeException e) {
            log.error("Error fetching student submissions: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Check if student has submitted for an assignment
     * GET /api/submissions/check
     */
    @GetMapping("/check")
    public ResponseEntity<?> checkSubmissionStatus(
            @RequestParam Long assignmentId,
            @RequestParam Long studentId) {
        try {
            boolean hasSubmitted = submissionService.hasStudentSubmitted(assignmentId, studentId);
            return ResponseEntity.ok(Map.of(
                "hasSubmitted", hasSubmitted,
                "assignmentId", assignmentId,
                "studentId", studentId
            ));
        } catch (RuntimeException e) {
            log.error("Error checking submission status: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Download submission file
     * GET /api/submissions/files/{fileId}/download
     */
    @GetMapping("/files/{fileId}/download")
    public ResponseEntity<Resource> downloadSubmissionFile(@PathVariable Long fileId) {
        try {
            Resource resource = submissionService.downloadSubmissionFile(fileId);
            
            // Try to determine file's content type
            String contentType = "application/octet-stream";

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                           "attachment; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (MalformedURLException e) {
            log.error("Error downloading submission file: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            log.error("Error downloading submission file: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get submission statistics for an assignment
     * GET /api/submissions/assignment/{assignmentId}/stats
     */
    @GetMapping("/assignment/{assignmentId}/stats")
    public ResponseEntity<?> getSubmissionStats(@PathVariable Long assignmentId) {
        try {
            StudentSubmissionService.SubmissionStatsResponse stats = submissionService.getSubmissionStats(assignmentId);
            return ResponseEntity.ok(stats);
        } catch (RuntimeException e) {
            log.error("Error fetching submission stats: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
