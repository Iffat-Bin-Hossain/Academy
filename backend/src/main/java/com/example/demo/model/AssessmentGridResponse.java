package com.example.demo.model;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentGridResponse {
    private Long id;
    private Long assignmentId;
    private String assignmentTitle;
    private Integer maxMarks;
    private LocalDateTime assignmentDeadline;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    
    // Submission details
    private Long submissionId;
    private Boolean hasSubmission;
    private String submissionStatus;
    private LocalDateTime submissionDate;
    private Boolean isLateSubmission;
    private List<SubmissionFileResponse> submissionFiles;
    
    // Assessment details
    private Double teacherMark;
    private Double manualWeight;
    private Boolean latePenaltyApplied;
    private Boolean copyPenaltyApplied;
    private Double finalMark;
    private String gradingNotes;
    private String copyCheckerFilePath;
    private Boolean isProcessed;
    private String gradedByName;
    private LocalDateTime gradedAt;
    
    // Calculated fields
    private Double obtainedPercentage;
    private String gradeStatus; // NOT_GRADED, GRADED, NEEDS_REVIEW
}
