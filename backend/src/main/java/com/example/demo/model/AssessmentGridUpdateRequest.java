package com.example.demo.model;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentGridUpdateRequest {
    private Long courseId;
    private Long assignmentId;
    private Long studentId;
    private Double teacherMark;
    private Double manualWeight;
    private String gradingNotes;
    private Boolean latePenaltyApplied;
    private Boolean copyPenaltyApplied;
}
