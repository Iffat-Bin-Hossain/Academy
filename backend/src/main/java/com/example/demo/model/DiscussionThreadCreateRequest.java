package com.example.demo.model;

import lombok.Data;

@Data
public class DiscussionThreadCreateRequest {
    private String title;
    private String description;
    private Long courseId;
    private Long assignmentId; // Optional
    private Long resourceId; // Optional - link to a resource
    private String resourceName; // Optional - custom resource name
    private Boolean isPinned = false;
}
