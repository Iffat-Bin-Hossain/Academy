package com.example.demo.model;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {
    private Long id;
    private String type;
    private String title;
    private String message;
    private String redirectUrl;
    private Boolean isRead;
    private LocalDateTime createdAt;
    private LocalDateTime readAt;
    
    // Related entity info for context
    private RelatedCourse relatedCourse;
    private RelatedAssignment relatedAssignment;
    private RelatedUser relatedUser;
    private Long relatedThreadId;
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RelatedCourse {
        private Long id;
        private String title;
        private String courseCode;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RelatedAssignment {
        private Long id;
        private String title;
        private LocalDateTime deadline;
    }
    
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RelatedUser {
        private Long id;
        private String name;
        private String email;
        private String role;
    }
}
