package com.example.demo.plagiarism.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "plagiarism_evidence_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlagiarismEvidenceItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pair_id", nullable = false)
    private PlagiarismSimilarityPair pair;

    @Column(name = "evidence_type", nullable = false, length = 64)
    @Enumerated(EnumType.STRING)
    private EvidenceType evidenceType;

    @Column(name = "file1_path")
    private String file1Path;

    @Column(name = "file2_path")
    private String file2Path;

    @Column(name = "start_line1")
    private int startLine1;

    @Column(name = "end_line1")
    private int endLine1;

    @Column(name = "start_line2")
    private int startLine2;

    @Column(name = "end_line2")
    private int endLine2;

    @Column(name = "similarity_score")
    private double similarityScore;

    @Column(name = "confidence_score")
    private double confidenceScore;

    @Column(name = "is_baseline")
    @Builder.Default
    private boolean isBaseline = false;

    @Column(name = "snippet1", columnDefinition = "TEXT")
    private String snippet1;

    @Column(name = "snippet2", columnDefinition = "TEXT")
    private String snippet2;

    @Column(name = "explanation", columnDefinition = "TEXT")
    private String explanation;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum EvidenceType {
        EXACT_BLOCK,
        IDENTIFIER_RENAMING,
        AST_STRUCTURAL,
        CFG_MATCH,
        FINGERPRINT_MATCH,
        UNUSUAL_NAMING,
        HELPER_FUNCTION,
        SEMANTIC_EQUIVALENCE,
        STARTER_CODE_BASELINE
    }
}
