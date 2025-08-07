package com.example.demo.model;

import lombok.Data;

@Data
public class DiscussionThreadCreateRequest {
    private String title;
    private String description;
    private Long courseId;
    private Long assignmentId; // Optional
    private String resourceName; // Optional
    private Boolean isPinned = false;
}
