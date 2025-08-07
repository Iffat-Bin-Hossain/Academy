package com.example.demo.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementResponse {
    private Long id;
    private String title;
    private String content;
    private Announcement.AnnouncementType type;
    private String authorName;
    private LocalDateTime createdAt;
    private Long referenceId;
    private String referenceType;
    private Long courseId;
}
