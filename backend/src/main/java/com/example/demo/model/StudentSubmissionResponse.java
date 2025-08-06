package com.example.demo.model;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentSubmissionResponse {
    private Long id;
    private Long assignmentId;
    private String assignmentTitle;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String submissionText;
    private LocalDateTime submittedAt;
    private StudentSubmission.SubmissionStatus submissionStatus;
    private Boolean isLate;
    private List<SubmissionFileResponse> files;
    
    // Assignment details for context
    private LocalDateTime deadline;
    private LocalDateTime lateSubmissionDeadline;
    private Integer maxMarks;
}
