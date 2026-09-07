package com.example.demo.plagiarism.model;

import com.example.demo.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "plagiarism_similarity_pairs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlagiarismSimilarityPair {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "run_id", nullable = false)
    private PlagiarismAnalysisRun run;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student1_id", nullable = false)
    private User student1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student2_id", nullable = false)
    private User student2;

    @Column(name = "submission1_id", nullable = false)
    private Long submission1Id;

    @Column(name = "submission2_id", nullable = false)
    private Long submission2Id;

    @Column(name = "raw_similarity_score")
    private double rawSimilarityScore;

    @Column(name = "suspicion_score")
    private double suspicionScore;

    @Column(name = "confidence_score")
    private double confidenceScore;

    @Column(name = "exact_match_score")
    private double exactMatchScore;

    @Column(name = "token_score")
    private double tokenScore;

    @Column(name = "ast_score")
    private double astScore;

    @Column(name = "cfg_score")
    private double cfgScore;

    @Column(name = "fingerprint_score")
    private double fingerprintScore;

    @Column(name = "semantic_score")
    private double semanticScore;

    @Column(name = "behavioral_score")
    private double behavioralScore;

    @Column(name = "baseline_contribution")
    private double baselineContribution;

    @Column(name = "risk_category", length = 32)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RiskCategory riskCategory = RiskCategory.NO_CONCERN;

    @Column(name = "dominant_language", length = 32)
    private String dominantLanguage;

    @Column(name = "compared_files_summary", length = 500)
    private String comparedFilesSummary;

    @Column(name = "cluster_id")
    private Integer clusterId;

    @Column(name = "code1_sample", columnDefinition = "TEXT")
    private String code1Sample;

    @Column(name = "code2_sample", columnDefinition = "TEXT")
    private String code2Sample;

    @Column(name = "summary_rationale", columnDefinition = "TEXT")
    private String summaryRationale;

    @Transient
    private java.util.List<PlagiarismEvidenceItem> transientEvidenceItems;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum RiskCategory {
        NO_CONCERN,
        REVIEW_RECOMMENDED,
        STRONG_EVIDENCE
    }
}
