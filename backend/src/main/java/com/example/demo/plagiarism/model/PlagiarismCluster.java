package com.example.demo.plagiarism.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "plagiarism_clusters")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlagiarismCluster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "run_id", nullable = false)
    private PlagiarismAnalysisRun run;

    @Column(name = "cluster_number", nullable = false)
    private int clusterNumber;

    @Column(name = "risk_level", length = 32)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ClusterRiskLevel riskLevel = ClusterRiskLevel.MEDIUM;

    @Column(name = "student_count")
    private int studentCount;

    @Column(name = "student_details_json", columnDefinition = "TEXT")
    private String studentDetailsJson;

    @Column(name = "average_similarity")
    private double averageSimilarity;

    @Column(name = "summary_text", columnDefinition = "TEXT")
    private String summaryText;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum ClusterRiskLevel {
        LOW,
        MEDIUM,
        HIGH
    }
}
