package com.example.demo.plagiarism.engine;

import com.example.demo.plagiarism.analyzer.Token;
import com.example.demo.plagiarism.analyzer.TokenStream;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@Slf4j
public class WinnowingTokenEngine {

    private static final int K_GRAM_SIZE = 5;
    private static final int WINDOW_SIZE = 4;
    private static final long PRIME_BASE = 31;
    private static final long MODULUS = 1_000_000_007L;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class Fingerprint {
        private long hash;
        private int tokenPosition;
        private int line;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class WinnowingResult {
        private double jaccardSimilarity;
        private double containmentSimilarity; // For detecting partial copying
        private double finalScore;
        private int matchingFingerprints;
        private int totalFingerprintsA;
        private int totalFingerprintsB;
        @Builder.Default
        private List<Fingerprint> matchedList = new ArrayList<>();
    }

    /**
     * Generates Winnowing fingerprints from a TokenStream.
     */
    public List<Fingerprint> generateFingerprints(TokenStream stream) {
        List<Fingerprint> fingerprints = new ArrayList<>();
        if (stream == null || stream.size() < K_GRAM_SIZE) {
            return fingerprints;
        }

        List<Token> tokens = stream.getTokens();
        int n = tokens.size();

        // 1. Calculate k-gram hashes
        long[] hashes = new long[n - K_GRAM_SIZE + 1];
        int[] lines = new int[n - K_GRAM_SIZE + 1];

        // Initial k-gram hash
        long currentHash = 0;
        long highestPower = 1;
        for (int i = 0; i < K_GRAM_SIZE - 1; i++) {
            highestPower = (highestPower * PRIME_BASE) % MODULUS;
        }

        for (int i = 0; i < K_GRAM_SIZE; i++) {
            int val = tokens.get(i).getNormalizedValue() != null ?
                    tokens.get(i).getNormalizedValue().hashCode() : tokens.get(i).getValue().hashCode();
            currentHash = (currentHash * PRIME_BASE + (val & 0xFFFF)) % MODULUS;
        }
        hashes[0] = currentHash;
        lines[0] = tokens.get(0).getLine();

        // Rolling hash for subsequent k-grams
        for (int i = 1; i <= n - K_GRAM_SIZE; i++) {
            int prevVal = tokens.get(i - 1).getNormalizedValue() != null ?
                    tokens.get(i - 1).getNormalizedValue().hashCode() : tokens.get(i - 1).getValue().hashCode();
            int nextVal = tokens.get(i + K_GRAM_SIZE - 1).getNormalizedValue() != null ?
                    tokens.get(i + K_GRAM_SIZE - 1).getNormalizedValue().hashCode() : tokens.get(i + K_GRAM_SIZE - 1).getValue().hashCode();

            currentHash = (currentHash - (prevVal & 0xFFFF) * highestPower) % MODULUS;
            if (currentHash < 0) currentHash += MODULUS;
            currentHash = (currentHash * PRIME_BASE + (nextVal & 0xFFFF)) % MODULUS;

            hashes[i] = currentHash;
            lines[i] = tokens.get(i).getLine();
        }

        // 2. Winnowing: Select minimum hash in each sliding window
        int numHashes = hashes.length;
        if (numHashes < WINDOW_SIZE) {
            long minH = hashes[0];
            int minIdx = 0;
            for (int i = 1; i < numHashes; i++) {
                if (hashes[i] < minH) {
                    minH = hashes[i];
                    minIdx = i;
                }
            }
            fingerprints.add(new Fingerprint(minH, minIdx, lines[minIdx]));
            return fingerprints;
        }

        int lastMinIndex = -1;
        for (int i = 0; i <= numHashes - WINDOW_SIZE; i++) {
            long minHash = Long.MAX_VALUE;
            int minIndex = -1;

            for (int j = 0; j < WINDOW_SIZE; j++) {
                int currIdx = i + j;
                if (hashes[currIdx] <= minHash) {
                    minHash = hashes[currIdx];
                    minIndex = currIdx;
                }
            }

            if (minIndex != lastMinIndex) {
                fingerprints.add(new Fingerprint(minHash, minIndex, lines[minIndex]));
                lastMinIndex = minIndex;
            }
        }

        return fingerprints;
    }

    /**
     * Compares two TokenStreams using Winnowing fingerprints.
     */
    public WinnowingResult compare(TokenStream streamA, TokenStream streamB) {
        List<Fingerprint> fpA = generateFingerprints(streamA);
        List<Fingerprint> fpB = generateFingerprints(streamB);

        WinnowingResult result = new WinnowingResult();
        result.setTotalFingerprintsA(fpA.size());
        result.setTotalFingerprintsB(fpB.size());

        if (fpA.isEmpty() || fpB.isEmpty()) {
            return result;
        }

        Set<Long> setA = new HashSet<>();
        for (Fingerprint f : fpA) setA.add(f.getHash());

        Set<Long> setB = new HashSet<>();
        for (Fingerprint f : fpB) setB.add(f.getHash());

        Set<Long> intersection = new HashSet<>(setA);
        intersection.retainAll(setB);

        Set<Long> union = new HashSet<>(setA);
        union.addAll(setB);

        double jaccard = union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
        double containment = Math.min(setA.size(), setB.size()) == 0 ? 0.0 :
                (double) intersection.size() / Math.min(setA.size(), setB.size());

        // Final score combines Jaccard with Containment (giving partial copy weight)
        double finalScore = (jaccard * 0.6) + (containment * 0.4);

        result.setJaccardSimilarity(jaccard);
        result.setContainmentSimilarity(containment);
        result.setFinalScore(finalScore);
        result.setMatchingFingerprints(intersection.size());

        for (Fingerprint f : fpA) {
            if (setB.contains(f.getHash())) {
                result.getMatchedList().add(f);
            }
        }

        return result;
    }
}
