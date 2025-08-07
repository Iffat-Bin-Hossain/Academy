package com.example.demo.model;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DiscussionPostResponse {
    private Long id;
    private Long threadId;
    private Long parentPostId;
    private Long authorId;
    private String authorName;
    private String authorRole;
    private String content;
    private Boolean isEdited;
    private Boolean isDeleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<DiscussionPostResponse> replies;
    private Map<String, Integer> reactionCounts; // e.g., {"LIKE": 5, "HELPFUL": 2}
    private String userReaction; // Current user's reaction if any
}
