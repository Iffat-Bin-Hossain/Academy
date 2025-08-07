package com.example.demo.controller;

import com.example.demo.model.NotificationResponse;
import com.example.demo.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@Slf4j
public class NotificationController {

    private final NotificationService notificationService;

    /**
     * Get all notifications for the current user
     * GET /api/notifications
     */
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(@RequestParam Long userId) {
        try {
            List<NotificationResponse> notifications = notificationService.getNotificationsForUser(userId);
            return ResponseEntity.ok(notifications);
        } catch (RuntimeException e) {
            log.error("Error fetching notifications for user {}: {}", userId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get unread notifications for the current user
     * GET /api/notifications/unread
     */
    @GetMapping("/unread")
    public ResponseEntity<List<NotificationResponse>> getUnreadNotifications(@RequestParam Long userId) {
        try {
            List<NotificationResponse> notifications = notificationService.getUnreadNotifications(userId);
            return ResponseEntity.ok(notifications);
        } catch (RuntimeException e) {
            log.error("Error fetching unread notifications for user {}: {}", userId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Get unread notification count for the current user
     * GET /api/notifications/unread/count
     */
    @GetMapping("/unread/count")
    public ResponseEntity<Map<String, Object>> getUnreadCount(@RequestParam Long userId) {
        try {
            long count = notificationService.getUnreadCount(userId);
            return ResponseEntity.ok(Map.of(
                "count", count,
                "hasUnread", count > 0
            ));
        } catch (RuntimeException e) {
            log.error("Error fetching unread count for user {}: {}", userId, e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Mark a notification as read
     * PUT /api/notifications/{id}/read
     */
    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> markAsRead(
            @PathVariable Long id,
            @RequestParam Long userId) {
        try {
            notificationService.markAsRead(id, userId);
            return ResponseEntity.ok(Map.of("message", "Notification marked as read"));
        } catch (RuntimeException e) {
            log.error("Error marking notification {} as read for user {}: {}", id, userId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Mark all notifications as read for the current user
     * PUT /api/notifications/read-all
     */
    @PutMapping("/read-all")
    public ResponseEntity<Map<String, String>> markAllAsRead(@RequestParam Long userId) {
        try {
            notificationService.markAllAsRead(userId);
            return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
        } catch (RuntimeException e) {
            log.error("Error marking all notifications as read for user {}: {}", userId, e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
