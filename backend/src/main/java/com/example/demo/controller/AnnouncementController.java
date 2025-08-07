package com.example.demo.controller;

import com.example.demo.model.AnnouncementResponse;
import com.example.demo.service.AnnouncementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
@Slf4j
public class AnnouncementController {

    private final AnnouncementService announcementService;

    /**
     * Get all announcements for a course
     * GET /api/announcements/course/{courseId}
     */
    @GetMapping("/course/{courseId}")
    public ResponseEntity<?> getAnnouncementsForCourse(@PathVariable Long courseId) {
        try {
            List<AnnouncementResponse> announcements = announcementService.getAnnouncementsForCourse(courseId);
            return ResponseEntity.ok(announcements);
        } catch (RuntimeException e) {
            log.error("Error fetching announcements for course {}: {}", courseId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Create a general announcement
     * POST /api/announcements/course/{courseId}?teacherId={teacherId}
     */
    @PostMapping("/course/{courseId}")
    public ResponseEntity<?> createGeneralAnnouncement(
            @PathVariable Long courseId,
            @RequestParam Long teacherId,
            @RequestBody Map<String, String> request) {
        try {
            String title = request.get("title");
            String content = request.get("content");
            
            if (title == null || title.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Title is required"));
            }
            
            if (content == null || content.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Content is required"));
            }

            AnnouncementResponse announcement = announcementService.createGeneralAnnouncement(
                    courseId, teacherId, title.trim(), content.trim());
            return ResponseEntity.ok(announcement);
        } catch (RuntimeException e) {
            log.error("Error creating announcement: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
