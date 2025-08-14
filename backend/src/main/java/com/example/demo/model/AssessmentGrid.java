package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "assessment_grids", 
       uniqueConstraints = {@UniqueConstraint(columnNames = {"assignment_id", "student_id"})})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssessmentGrid {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id")
    private StudentSubmission submission; // Null if no submission

    // Assessment fields
    @Column(name = "teacher_mark")
    private Double teacherMark; // Mark entered by teacher

    @Column(name = "manual_weight")
    @Builder.Default
    private Double manualWeight = 1.0; // Default weight is 1.0

    @Column(name = "late_penalty_applied", nullable = false)
    @Builder.Default
    private Boolean latePenaltyApplied = false;

    @Column(name = "copy_penalty_applied", nullable = false)
    @Builder.Default
    private Boolean copyPenaltyApplied = false;

    @Column(name = "final_mark")
    private Double finalMark; // Calculated final mark after penalties

    @Column(name = "grading_notes")
    private String gradingNotes; // Teacher's notes

    @Column(name = "copy_checker_file_path")
    private String copyCheckerFilePath; // Path to copy checker CSV

    @Column(name = "is_processed", nullable = false)
    @Builder.Default
    private Boolean isProcessed = false; // Whether grading has been processed

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "graded_by")
    private User gradedBy; // Teacher who graded

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "graded_at")
    private LocalDateTime gradedAt; // When the grading was completed

    // Helper methods
    public void calculateFinalMark() {
        if (teacherMark == null) {
            this.finalMark = null;
            return;
        }

        double calculatedMark = teacherMark * manualWeight;

        // Automatically apply late penalty (5% deduction) if submission is late
        if (submission != null && submission.getIsLate()) {
            // Automatically set late penalty as applied
            this.latePenaltyApplied = true;
            calculatedMark = calculatedMark * 0.95; // Deduct 5%
        } else {
            // No late submission, ensure penalty flag is false
            this.latePenaltyApplied = false;
        }

        // Apply copy penalty (deduct full assignment marks as negative)
        if (copyPenaltyApplied) {
            calculatedMark = -assignment.getMaxMarks(); // Negative total assignment marks
        }

        this.finalMark = calculatedMark; // Allow negative marks for copy penalty
    }

    public boolean hasSubmission() {
        return submission != null;
    }

    public String getSubmissionStatus() {
        if (submission == null) {
            return "NOT_SUBMITTED";
        }
        return submission.getSubmissionStatus().toString();
    }

    public LocalDateTime getSubmissionDate() {
        return submission != null ? submission.getSubmittedAt() : null;
    }
}
