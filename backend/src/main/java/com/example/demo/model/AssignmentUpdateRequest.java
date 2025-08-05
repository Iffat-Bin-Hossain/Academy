package com.example.demo.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AssignmentUpdateRequest {
    private String title;
    private String content;
    private Integer maxMarks;
    private LocalDateTime deadline;
    private LocalDateTime lateSubmissionDeadline;
    private String instructions;
    private AssignmentType assignmentType;
    private Boolean isActive;
}
