package com.example.demo.model;

import lombok.Data;

@Data
public class DiscussionPostCreateRequest {
    private Long threadId;
    private Long parentPostId; // Optional for replies
    private String content;
}
