package com.example.demo.plagiarism.model;

import com.example.demo.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "plagiarism_review_decisions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlagiarismReviewDecision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pair_id", nullable = false)
    private PlagiarismSimilarityPair pair;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @Column(name = "decision", nullable = false, length = 64)
    @Enumerated(EnumType.STRING)
    private DecisionType decision;

    @Column(name = "penalty_percentage")
    private Double penaltyPercentage;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "decided_at", updatable = false)
    private LocalDateTime decidedAt;

    public enum DecisionType {
        CONFIRMED_PLAGIARISM,
        FALSE_POSITIVE,
        NEEDS_INVESTIGATION,
        CLEARED
    }
}
