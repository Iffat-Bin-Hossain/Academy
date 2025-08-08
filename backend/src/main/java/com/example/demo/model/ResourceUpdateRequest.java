package com.example.demo.model;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceUpdateRequest {
    private String title;
    private String description;
    private String topic;
    private String week;
    private String tags;
    
    // For link resources
    private String url;
    
    // For note resources
    private String noteContent;
    
    // Visibility settings
    private LocalDateTime visibleFrom;
    private LocalDateTime visibleUntil;
    private Boolean isVisible;
    private Boolean isActive;
    
    // File update flag
    private Boolean replaceFile;
    
    // Resource type change support
    private Resource.ResourceType resourceType;
    private Boolean resourceTypeChanged;
}
