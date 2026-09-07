package com.example.demo.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlagiarismAnalysisResponse {
    private String status; // "processing", "completed", "failed", "cancelled"
    private Progress progress;
    private PlagiarismResults results;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Progress {
        private int current;
        private int total;
        private String stage;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PlagiarismResults {
        private List<SimilarityPair> similarities;
        private List<ClusterSummary> clusters;
        private Map<String, Map<String, Double>> similarityMatrix;
        private AnalysisMetadata metadata;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SimilarityPair {
        private Long pairId;
        private String student1Name;
        private String student2Name;
        private Long student1Id;
        private Long student2Id;
        private double similarity;        // Raw similarity score
        private double suspicionScore;     // Weighted suspicion after baseline deduction
        private double confidenceScore;    // Agreement across independent engines
        private String riskCategory;       // NO_CONCERN, REVIEW_RECOMMENDED, STRONG_EVIDENCE
        private String type;
        private String filesCompared;
        private String detectionMethod;
        private Double aiConfidence;
        private String code1;
        private String code2;
        private double exactMatchScore;
        private double tokenScore;
        private double astScore;
        private double cfgScore;
        private double fingerprintScore;
        private double semanticScore;
        private double baselineContribution;
        private String summaryRationale;
        private Integer clusterId;
        private List<EvidenceDto> evidenceItems;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class EvidenceDto {
        private String evidenceType;
        private String file1Path;
        private String file2Path;
        private int startLine1;
        private int endLine1;
        private int startLine2;
        private int endLine2;
        private double similarityScore;
        private double confidenceScore;
        private boolean isBaseline;
        private String explanation;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ClusterSummary {
        private int clusterNumber;
        private String riskLevel;
        private int studentCount;
        private double averageSimilarity;
        private String summaryText;
        private List<Map<String, Object>> students;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AnalysisMetadata {
        private long analysisTime;
        private int totalSubmissions;
        private int comparisons;
        private String algorithm;
        private boolean aiUsed;
        private int suspiciousPairs;
        private int clusterCount;
    }
}
