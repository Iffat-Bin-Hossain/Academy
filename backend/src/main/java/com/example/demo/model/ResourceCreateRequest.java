package com.example.demo.model;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResourceCreateRequest {
    @NotBlank(message = "Title is required")
    private String title;
    
    private String description;
    
    @NotNull(message = "Resource type is required")
    private Resource.ResourceType resourceType;
    
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
    
    @Builder.Default
    private Boolean isVisible = true;
    
    @NotNull(message = "Course ID is required")
    private Long courseId;
}
