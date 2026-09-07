package com.example.demo.plagiarism.engine;

import com.example.demo.plagiarism.analyzer.NormalizedSource;
import com.example.demo.plagiarism.ingestion.SecureArchiveExtractor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.*;

@Component
@Slf4j
public class ExactMatchEngine {

    public static class ExactMatchResult {
        public double score; // 0.0 to 1.0
        public boolean isExactFileMatch;
        public boolean isNormalizedMatch;
        public int matchingBlocks;
        public int totalBlocks;
        public List<String> matchingBlockHashes = new ArrayList<>();
    }

    /**
     * Evaluates exact match between two sources.
     */
    public ExactMatchResult compare(NormalizedSource sourceA, NormalizedSource sourceB) {
        ExactMatchResult result = new ExactMatchResult();

        if (sourceA == null || sourceB == null) return result;

        String rawA = sourceA.getRawSource();
        String rawB = sourceB.getRawSource();

        // 1. Raw exact match
        if (rawA != null && rawB != null && rawA.equals(rawB) && !rawA.trim().isEmpty()) {
            result.score = 1.0;
            result.isExactFileMatch = true;
            result.isNormalizedMatch = true;
            return result;
        }

        // 2. Normalized exact match (ignores formatting, whitespace, comments)
        String normA = sourceA.getNormalizedSource();
        String normB = sourceB.getNormalizedSource();

        if (normA != null && normB != null && !normA.isEmpty() && normA.equals(normB)) {
            result.score = 0.98;
            result.isNormalizedMatch = true;
            return result;
        }

        // 3. Block-level exact matching
        List<String> blocksA = extractBlocks(normA);
        List<String> blocksB = extractBlocks(normB);

        result.totalBlocks = Math.max(blocksA.size(), blocksB.size());
        if (result.totalBlocks == 0) return result;

        Set<String> setB = new HashSet<>();
        for (String b : blocksB) {
            setB.add(hashBlock(b));
        }

        int matches = 0;
        for (String a : blocksA) {
            String h = hashBlock(a);
            if (setB.contains(h)) {
                matches++;
                result.matchingBlockHashes.add(h);
            }
        }

        result.matchingBlocks = matches;
        result.score = (double) matches / result.totalBlocks;

        return result;
    }

    private List<String> extractBlocks(String code) {
        List<String> blocks = new ArrayList<>();
        if (code == null || code.isEmpty()) return blocks;

        String[] lines = code.split("\n");
        StringBuilder current = new StringBuilder();
        int count = 0;

        for (String line : lines) {
            current.append(line).append("\n");
            count++;
            // A logical block every 4 lines or on closing brace
            if (count >= 4 || line.endsWith("}") || line.endsWith(";")) {
                String b = current.toString().trim();
                if (!b.isEmpty() && b.length() > 20) {
                    blocks.add(b);
                }
                current.setLength(0);
                count = 0;
            }
        }
        if (current.length() > 0 && current.toString().trim().length() > 20) {
            blocks.add(current.toString().trim());
        }
        return blocks;
    }

    private String hashBlock(String block) {
        return SecureArchiveExtractor.computeSha256(block.getBytes(StandardCharsets.UTF_8)).substring(0, 16);
    }
}
