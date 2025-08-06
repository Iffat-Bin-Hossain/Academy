package com.example.demo.model;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentSubmissionRequest {
    private Long assignmentId;
    private String submissionText; // Optional text submission
}
