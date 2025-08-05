package com.example.demo.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AssignmentCreateRequest {
    private String title;
    private String content;
    private Integer maxMarks;
    private Long courseId;
    private LocalDateTime deadline;
    private LocalDateTime lateSubmissionDeadline;
    private String instructions;
    private AssignmentType assignmentType;
}
