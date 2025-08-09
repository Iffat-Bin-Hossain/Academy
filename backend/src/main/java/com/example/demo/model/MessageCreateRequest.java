package com.example.demo.model;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageCreateRequest {
    private Long recipientId;
    private String subject;
    private String content;
    private Long relatedCourseId; // Optional
    private String messageType; // DIRECT, COURSE_RELATED, SYSTEM, ANNOUNCEMENT
}
