package com.example.demo.model;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscussionThreadResponse {
    private Long id;
    private String title;
    private String description;
    private Long courseId;
    private String courseTitle;
    private String courseCode;
    private Long createdById;
    private String createdByName;
    private String createdByRole;
    private Long assignmentId;
    private String assignmentTitle;
    private Long resourceId;
    private String resourceTitle;
    private String resourceName;
    private Boolean isActive;
    private Boolean isPinned;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer postCount;
    private LocalDateTime lastActivityAt;
    private List<DiscussionPostResponse> posts;
}
