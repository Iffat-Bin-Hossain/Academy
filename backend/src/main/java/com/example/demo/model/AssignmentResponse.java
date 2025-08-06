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
public class AssignmentResponse {
    private Long id;
    private String title;
    private String content;
    private Integer maxMarks;
    private Long courseId;
    private String courseTitle;
    private String courseCode;
    private Long createdById;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime deadline;
    private LocalDateTime lateSubmissionDeadline;
    private String instructions;
    private AssignmentType assignmentType;
    private Boolean isActive;
    private Boolean isOverdue;
    private Boolean canSubmitLate;
    private List<AssignmentFileResponse> attachments;
}
