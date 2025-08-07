package com.example.demo.model;

import lombok.*;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResourceResponse {
    private Long id;
    private String title;
    private String description;
    private Resource.ResourceType resourceType;
    private String topic;
    private String week;
    private String tags;
    
    // File information
    private String originalFilename;
    private String contentType;
    private Long fileSize;
    private String downloadUrl;
    
    // Link information
    private String url;
    
    // Note information
    private String noteContent;
    
    // Visibility
    private LocalDateTime visibleFrom;
    private LocalDateTime visibleUntil;
    private Boolean isVisible;
    private Boolean isActive;
    
    // Analytics
    private Long downloadCount;
    private Long viewCount;
    
    // Course and user info
    private Long courseId;
    private String courseTitle;
    private String courseCode;
    private Long uploadedById;
    private String uploadedByName;
    private UserSummary uploadedBy;
    
    // Metadata
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    // Discussion threads count
    private Integer discussionThreadsCount;
    
    // Permission flags for current user
    private Boolean canEdit;
    private Boolean canDelete;
    private Boolean canCreateDiscussion;
}
