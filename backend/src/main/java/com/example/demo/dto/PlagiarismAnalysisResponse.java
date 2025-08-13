package com.example.demo.dto;

import lombok.Data;
import java.util.List;

@Data
public class PlagiarismAnalysisResponse {
    private String status; // "processing", "completed", "failed"
    private Progress progress;
    private PlagiarismResults results;

    @Data
    public static class Progress {
        private int current;
        private int total;
        private String stage;
    }

    @Data
    public static class PlagiarismResults {
        private List<SimilarityPair> similarities;
        private AnalysisMetadata metadata;
    }

    @Data
    public static class SimilarityPair {
        private String student1Name;
        private String student2Name;
        private Long student1Id;
        private Long student2Id;
        private double similarity;
        private String type;
        private String filesCompared;
        private String detectionMethod;
        private Double aiConfidence;
        private String code1;
        private String code2;
        private List<String> matchedSegments;
    }

    @Data
    public static class AnalysisMetadata {
        private long analysisTime;
        private int totalSubmissions;
        private int comparisons;
        private String algorithm;
        private boolean aiUsed;
    }
}
