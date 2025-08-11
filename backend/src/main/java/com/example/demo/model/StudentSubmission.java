package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "student_submissions", 
       uniqueConstraints = {@UniqueConstraint(columnNames = {"assignment_id", "student_id"})})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentSubmission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student; // Student who submitted

    @Column(name = "submission_text", columnDefinition = "TEXT")
    private String submissionText; // Optional text submission

    @CreationTimestamp
    @Column(name = "submitted_at", updatable = true)
    private LocalDateTime submittedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "submission_status", nullable = false)
    @Builder.Default
    private SubmissionStatus submissionStatus = SubmissionStatus.ON_TIME;

    @Column(name = "is_late", nullable = false)
    @Builder.Default
    private Boolean isLate = false;

    // Calculated field - determines if submission was late
    public void calculateSubmissionStatus() {
        if (this.submittedAt == null || this.assignment == null) {
            return;
        }
        
        LocalDateTime deadline = this.assignment.getDeadline();
        LocalDateTime lateDeadline = this.assignment.getLateSubmissionDeadline();
        
        if (this.submittedAt.isAfter(deadline)) {
            this.isLate = true;
            if (lateDeadline != null && this.submittedAt.isBefore(lateDeadline)) {
                this.submissionStatus = SubmissionStatus.LATE;
            } else {
                this.submissionStatus = SubmissionStatus.OVERDUE;
            }
        } else {
            this.isLate = false;
            this.submissionStatus = SubmissionStatus.ON_TIME;
        }
    }

    public enum SubmissionStatus {
        ON_TIME,    // Submitted before deadline
        LATE,       // Submitted after deadline but before late deadline
        OVERDUE     // Submitted after late deadline (if no late deadline allowed)
    }
}
