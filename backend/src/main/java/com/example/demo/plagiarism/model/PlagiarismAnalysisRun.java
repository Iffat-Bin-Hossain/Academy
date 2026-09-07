package com.example.demo.plagiarism.model;

import com.example.demo.model.Assignment;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "plagiarism_analysis_runs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlagiarismAnalysisRun {

    @Id
    @Column(name = "id", length = 64)
    private String id; // UUID string

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @Column(name = "status", nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RunStatus status = RunStatus.PENDING;

    @Column(name = "progress_current")
    @Builder.Default
    private int progressCurrent = 0;

    @Column(name = "progress_total")
    @Builder.Default
    private int progressTotal = 0;

    @Column(name = "current_stage")
    private String currentStage;

    @Column(name = "threshold")
    @Builder.Default
    private double threshold = 70.0;

    @Column(name = "total_submissions")
    private int totalSubmissions;

    @Column(name = "total_comparisons")
    private int totalComparisons;

    @Column(name = "candidate_pairs_count")
    private int candidatePairsCount;

    @Column(name = "suspicious_pairs_count")
    private int suspiciousPairsCount;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "error_message", length = 2000)
    private String errorMessage;

    @Column(name = "exact_weight")
    @Builder.Default
    private double exactWeight = 0.25;

    @Column(name = "token_weight")
    @Builder.Default
    private double tokenWeight = 0.15;

    @Column(name = "ast_weight")
    @Builder.Default
    private double astWeight = 0.25;

    @Column(name = "cfg_weight")
    @Builder.Default
    private double cfgWeight = 0.15;

    @Column(name = "fingerprint_weight")
    @Builder.Default
    private double fingerprintWeight = 0.10;

    @Column(name = "semantic_weight")
    @Builder.Default
    private double semanticWeight = 0.10;

    @CreationTimestamp
    @Column(name = "started_at", updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public enum RunStatus {
        PENDING,
        EXTRACTING,
        PARSING,
        ANALYZING,
        COMPARING,
        GENERATING_REPORT,
        COMPLETED,
        FAILED,
        CANCELLED
    }
}
