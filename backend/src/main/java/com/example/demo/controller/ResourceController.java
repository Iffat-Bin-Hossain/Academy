package com.example.demo.controller;

import com.example.demo.model.*;
import com.example.demo.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.FileInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
@Slf4j
public class ResourceController {

    private final ResourceService resourceService;

    /**
     * Create a new file resource
     * POST /api/resources/file?teacherId={teacherId}
     */
    @PostMapping("/file")
    public ResponseEntity<?> createFileResource(
            @RequestParam("file") MultipartFile file,
            @RequestParam("title") String title,
            @RequestParam("courseId") Long courseId,
            @RequestParam("teacherId") Long teacherId,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "topic", required = false) String topic,
            @RequestParam(value = "week", required = false) String week,
            @RequestParam(value = "tags", required = false) String tags,
            @RequestParam(value = "isVisible", required = false, defaultValue = "true") Boolean isVisible) {
        try {
            ResourceCreateRequest request = ResourceCreateRequest.builder()
                    .title(title)
                    .description(description)
                    .resourceType(Resource.ResourceType.FILE)
                    .topic(topic)
                    .week(week)
                    .tags(tags)
                    .courseId(courseId)
                    .isVisible(isVisible)
                    .build();

            ResourceResponse resource = resourceService.createResourceWithFile(request, file, teacherId);
            return ResponseEntity.ok(resource);
        } catch (IOException e) {
            log.error("Error uploading file: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to upload file: " + e.getMessage()));
        } catch (RuntimeException e) {
            log.error("Error creating file resource: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Create a new link resource
     * POST /api/resources/link?teacherId={teacherId}
     */
    @PostMapping("/link")
    public ResponseEntity<?> createLinkResource(
            @Valid @RequestBody ResourceCreateRequest request,
            @RequestParam Long teacherId) {
        try {
            ResourceResponse resource = resourceService.createLinkResource(request, teacherId);
            return ResponseEntity.ok(resource);
        } catch (RuntimeException e) {
            log.error("Error creating link resource: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Create a new note resource
     * POST /api/resources/note?teacherId={teacherId}
     */
    @PostMapping("/note")
    public ResponseEntity<?> createNoteResource(
            @Valid @RequestBody ResourceCreateRequest request,
            @RequestParam Long teacherId) {
        try {
            ResourceResponse resource = resourceService.createNoteResource(request, teacherId);
            return ResponseEntity.ok(resource);
        } catch (RuntimeException e) {
            log.error("Error creating note resource: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all resources for a course
     * GET /api/resources/course/{courseId}?userId={userId}
     */
    @GetMapping("/course/{courseId}")
    public ResponseEntity<?> getResourcesForCourse(
            @PathVariable Long courseId,
            @RequestParam Long userId) {
        try {
            List<ResourceResponse> resources = resourceService.getResourcesForCourse(courseId, userId);
            return ResponseEntity.ok(resources);
        } catch (RuntimeException e) {
            log.error("Error fetching resources for course: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get resources with filters
     * GET /api/resources/course/{courseId}/filter?userId={userId}&topic={topic}&week={week}&type={type}
     */
    @GetMapping("/course/{courseId}/filter")
    public ResponseEntity<?> getResourcesWithFilters(
            @PathVariable Long courseId,
            @RequestParam Long userId,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String week,
            @RequestParam(required = false) Resource.ResourceType type) {
        try {
            List<ResourceResponse> resources = resourceService.getResourcesWithFilters(
                    courseId, topic, week, type, userId);
            return ResponseEntity.ok(resources);
        } catch (RuntimeException e) {
            log.error("Error fetching filtered resources: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Search resources in a course
     * GET /api/resources/course/{courseId}/search?userId={userId}&q={searchTerm}
     */
    @GetMapping("/course/{courseId}/search")
    public ResponseEntity<?> searchResourcesInCourse(
            @PathVariable Long courseId,
            @RequestParam Long userId,
            @RequestParam String q) {
        try {
            List<ResourceResponse> resources = resourceService.searchResourcesInCourse(courseId, q, userId);
            return ResponseEntity.ok(resources);
        } catch (RuntimeException e) {
            log.error("Error searching resources: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get a specific resource
     * GET /api/resources/{resourceId}?userId={userId}
     */
    @GetMapping("/{resourceId}")
    public ResponseEntity<?> getResource(
            @PathVariable Long resourceId,
            @RequestParam Long userId) {
        try {
            ResourceResponse resource = resourceService.getResource(resourceId, userId);
            return ResponseEntity.ok(resource);
        } catch (RuntimeException e) {
            log.error("Error fetching resource: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update a resource
     * PUT /api/resources/{resourceId}?teacherId={teacherId}
     */
    @PutMapping("/{resourceId}")
    public ResponseEntity<?> updateResource(
            @PathVariable Long resourceId,
            @Valid @RequestBody ResourceUpdateRequest request,
            @RequestParam Long teacherId) {
        try {
            ResourceResponse resource = resourceService.updateResource(resourceId, request, teacherId);
            return ResponseEntity.ok(resource);
        } catch (RuntimeException e) {
            log.error("Error updating resource: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete a resource
     * DELETE /api/resources/{resourceId}?teacherId={teacherId}
     */
    @DeleteMapping("/{resourceId}")
    public ResponseEntity<?> deleteResource(
            @PathVariable Long resourceId,
            @RequestParam Long teacherId) {
        try {
            String result = resourceService.deleteResource(resourceId, teacherId);
            return ResponseEntity.ok(Map.of("message", result));
        } catch (RuntimeException e) {
            log.error("Error deleting resource: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Download a resource file
     * GET /api/resources/{resourceId}/download?userId={userId}
     */
    @GetMapping("/{resourceId}/download")
    public ResponseEntity<?> downloadResource(
            @PathVariable Long resourceId,
            @RequestParam Long userId) {
        try {
            // Get resource info first
            ResourceResponse resourceInfo = resourceService.getResource(resourceId, userId);
            
            if (resourceInfo.getResourceType() != Resource.ResourceType.FILE) {
                return ResponseEntity.badRequest().body(Map.of("error", "Resource is not a downloadable file"));
            }

            // Get file path
            Path filePath = resourceService.downloadResource(resourceId, userId);
            
            // Prepare file for download
            InputStreamResource resource = new InputStreamResource(new FileInputStream(filePath.toFile()));
            
            // Determine content type
            String contentType = resourceInfo.getContentType();
            if (contentType == null) {
                contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }
            }

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                           "attachment; filename=\"" + resourceInfo.getOriginalFilename() + "\"")
                    .contentType(MediaType.parseMediaType(contentType))
                    .contentLength(filePath.toFile().length())
                    .body(resource);
                    
        } catch (IOException e) {
            log.error("Error downloading file: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to download file"));
        } catch (RuntimeException e) {
            log.error("Error downloading resource: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get topics for a course
     * GET /api/resources/course/{courseId}/topics
     */
    @GetMapping("/course/{courseId}/topics")
    public ResponseEntity<?> getTopicsForCourse(@PathVariable Long courseId) {
        try {
            List<String> topics = resourceService.getTopicsForCourse(courseId);
            return ResponseEntity.ok(topics);
        } catch (RuntimeException e) {
            log.error("Error fetching topics: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get weeks for a course
     * GET /api/resources/course/{courseId}/weeks
     */
    @GetMapping("/course/{courseId}/weeks")
    public ResponseEntity<?> getWeeksForCourse(@PathVariable Long courseId) {
        try {
            List<String> weeks = resourceService.getWeeksForCourse(courseId);
            return ResponseEntity.ok(weeks);
        } catch (RuntimeException e) {
            log.error("Error fetching weeks: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Debug endpoint to check teacher assignment status
     * GET /api/resources/debug/teacher-assignment?teacherId={teacherId}&courseId={courseId}
     */
    @GetMapping("/debug/teacher-assignment")
    public ResponseEntity<?> debugTeacherAssignment(
            @RequestParam Long teacherId,
            @RequestParam Long courseId) {
        try {
            Map<String, Object> debugInfo = resourceService.debugTeacherAssignment(teacherId, courseId);
            return ResponseEntity.ok(debugInfo);
        } catch (RuntimeException e) {
            log.error("Error debugging teacher assignment: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
