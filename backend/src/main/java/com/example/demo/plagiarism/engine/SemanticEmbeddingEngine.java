package com.example.demo.plagiarism.engine;

import com.example.demo.plagiarism.analyzer.CodeMetrics;
import com.example.demo.plagiarism.analyzer.NormalizedSource;
import com.example.demo.plagiarism.analyzer.Token;
import com.example.demo.plagiarism.analyzer.TokenStream;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

@Component
@Slf4j
public class SemanticEmbeddingEngine {

    /**
     * Computes code embedding cosine similarity between two code units based on structural feature vectors.
     */
    public double calculateSemanticSimilarity(TokenStream streamA, TokenStream streamB, CodeMetrics metricsA, CodeMetrics metricsB) {
        if (streamA == null || streamB == null || streamA.size() == 0 || streamB.size() == 0) {
            return 0.0;
        }

        // Build feature frequency vectors
        Map<String, Double> vecA = buildFeatureVector(streamA, metricsA);
        Map<String, Double> vecB = buildFeatureVector(streamB, metricsB);

        return cosineSimilarity(vecA, vecB);
    }

    private Map<String, Double> buildFeatureVector(TokenStream stream, CodeMetrics metrics) {
        Map<String, Double> vector = new HashMap<>();

        // 1. Token n-gram and keyword frequencies
        for (Token t : stream.getTokens()) {
            String key = "TOK_" + (t.getNormalizedValue() != null ? t.getNormalizedValue() : t.getValue());
            vector.put(key, vector.getOrDefault(key, 0.0) + 1.0);
        }

        // 2. Structural metrics features
        if (metrics != null) {
            vector.put("METRIC_COMPLEXITY", (double) metrics.getCyclomaticComplexity());
            vector.put("METRIC_FUNCS", (double) metrics.getFunctionCount());
            vector.put("METRIC_TOKENS", (double) metrics.getTokenCount());
            vector.put("METRIC_LINES", (double) metrics.getCodeLines());
        }

        // Normalize vector to unit length
        double magnitude = 0.0;
        for (double v : vector.values()) {
            magnitude += v * v;
        }
        magnitude = Math.sqrt(magnitude);

        if (magnitude > 0) {
            for (Map.Entry<String, Double> entry : vector.entrySet()) {
                entry.setValue(entry.getValue() / magnitude);
            }
        }

        return vector;
    }

    private double cosineSimilarity(Map<String, Double> vecA, Map<String, Double> vecB) {
        double dotProduct = 0.0;
        for (Map.Entry<String, Double> entry : vecA.entrySet()) {
            if (vecB.containsKey(entry.getKey())) {
                dotProduct += entry.getValue() * vecB.get(entry.getKey());
            }
        }
        return Math.max(0.0, Math.min(1.0, dotProduct));
    }
}
