package com.example.demo.controller;

import com.example.demo.model.*;
import com.example.demo.service.AssignmentService;
import com.example.demo.service.AssignmentFileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
@Slf4j
public class AssignmentController {

    private final AssignmentService assignmentService;
    private final AssignmentFileService assignmentFileService;

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

    // ============ FILE ATTACHMENT ENDPOINTS ============

    /**
     * Upload files to an assignment
     * POST /api/assignments/{assignmentId}/files
     */
    @PostMapping("/{assignmentId}/files")
    public ResponseEntity<?> uploadFiles(
            @PathVariable Long assignmentId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam Long teacherId) {
        try {
            List<AssignmentFileResponse> uploadedFiles = assignmentFileService.uploadFiles(assignmentId, files, teacherId);
            return ResponseEntity.ok(Map.of(
                "message", "Files uploaded successfully",
                "files", uploadedFiles
            ));
        } catch (IOException e) {
            log.error("Error uploading files: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to upload files: " + e.getMessage()));
        } catch (RuntimeException e) {
            log.error("Error uploading files: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all files for an assignment
     * GET /api/assignments/{assignmentId}/files
     */
    @GetMapping("/{assignmentId}/files")
    public ResponseEntity<?> getAssignmentFiles(@PathVariable Long assignmentId) {
        try {
            List<AssignmentFileResponse> files = assignmentFileService.getAssignmentFiles(assignmentId);
            return ResponseEntity.ok(files);
        } catch (RuntimeException e) {
            log.error("Error fetching assignment files: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Download a file
     * GET /api/assignments/files/{fileId}/download
     */
    @GetMapping("/files/{fileId}/download")
    public ResponseEntity<Resource> downloadFile(@PathVariable Long fileId) {
        try {
            Resource resource = assignmentFileService.downloadFile(fileId);
            
            // Try to determine file's content type
            String contentType = "application/octet-stream";
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                           "attachment; filename=\"" + resource.getFilename() + "\"")
                    .body(resource);
        } catch (MalformedURLException e) {
            log.error("Error downloading file: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (RuntimeException e) {
            log.error("Error downloading file: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Delete a file
     * DELETE /api/assignments/files/{fileId}
     */
    @DeleteMapping("/files/{fileId}")
    public ResponseEntity<?> deleteFile(
            @PathVariable Long fileId,
            @RequestParam Long teacherId) {
        try {
            assignmentFileService.deleteFile(fileId, teacherId);
            return ResponseEntity.ok(Map.of("message", "File deleted successfully"));
        } catch (IOException e) {
            log.error("Error deleting file: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to delete file: " + e.getMessage()));
        } catch (RuntimeException e) {
            log.error("Error deleting file: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Add URL attachment to an assignment
     * POST /api/assignments/{assignmentId}/url
     */
    @PostMapping("/{assignmentId}/url")
    public ResponseEntity<?> addUrlAttachment(
            @PathVariable Long assignmentId,
            @RequestParam String url,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String description,
            @RequestParam Long teacherId) {
        try {
            AssignmentFileResponse urlAttachment = assignmentFileService.addUrlAttachment(
                assignmentId, url, title, description, teacherId);
            return ResponseEntity.ok(Map.of(
                "message", "URL attachment added successfully",
                "attachment", urlAttachment
            ));
        } catch (RuntimeException e) {
            log.error("Error adding URL attachment: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update assignment files during editing
     * PUT /api/assignments/{assignmentId}/files
     */
    @PutMapping("/{assignmentId}/files")
    public ResponseEntity<?> updateAssignmentFiles(
            @PathVariable Long assignmentId,
            @RequestParam(value = "newFiles", required = false) List<MultipartFile> newFiles,
            @RequestParam(value = "urlsToAdd", required = false) List<String> urlsToAdd,
            @RequestParam(value = "urlTitles", required = false) List<String> urlTitles,
            @RequestParam(value = "urlDescriptions", required = false) List<String> urlDescriptions,
            @RequestParam(value = "filesToDelete", required = false) List<Long> filesToDelete,
            @RequestParam Long teacherId) {
        try {
            List<AssignmentFileResponse> updatedFiles = assignmentFileService.updateAssignmentFiles(
                assignmentId, newFiles, urlsToAdd, urlTitles, urlDescriptions, filesToDelete, teacherId);
            return ResponseEntity.ok(Map.of(
                "message", "Assignment files updated successfully",
                "files", updatedFiles
            ));
        } catch (IOException e) {
            log.error("Error updating assignment files: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to update files: " + e.getMessage()));
        } catch (RuntimeException e) {
            log.error("Error updating assignment files: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
