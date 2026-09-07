package com.example.demo.plagiarism.engine;

import com.example.demo.plagiarism.model.PlagiarismBaseline;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@Slf4j
public class BaselineSubtractionEngine {

    /**
     * Calculates what percentage of the overlapping code between two submissions is attributable to starter code / baseline.
     */
    public double calculateBaselineContribution(
            String codeA,
            String codeB,
            List<PlagiarismBaseline> baselines,
            WinnowingTokenEngine.WinnowingResult winnowingResult) {

        if (baselines == null || baselines.isEmpty()) {
            return 0.0;
        }

        Set<String> baselineLines = new HashSet<>();
        for (PlagiarismBaseline baseline : baselines) {
            String content = baseline.getCodeContent();
            if (content != null && !content.isEmpty()) {
                String[] lines = content.split("\r\n|\r|\n");
                for (String l : lines) {
                    String trimmed = l.trim();
                    if (trimmed.length() > 5) {
                        baselineLines.add(trimmed);
                    }
                }
            }
        }

        if (baselineLines.isEmpty()) return 0.0;

        // Find shared lines between A and B
        String[] linesA = codeA != null ? codeA.split("\r\n|\r|\n") : new String[0];
        String[] linesB = codeB != null ? codeB.split("\r\n|\r|\n") : new String[0];

        Set<String> setA = new HashSet<>();
        for (String l : linesA) {
            String t = l.trim();
            if (t.length() > 5) setA.add(t);
        }

        Set<String> setB = new HashSet<>();
        for (String l : linesB) {
            String t = l.trim();
            if (t.length() > 5) setB.add(t);
        }

        Set<String> sharedLines = new HashSet<>(setA);
        sharedLines.retainAll(setB);

        if (sharedLines.isEmpty()) {
            return 0.0;
        }

        // Count how many of the shared lines are in the baseline starter code
        int baselineSharedCount = 0;
        for (String line : sharedLines) {
            if (baselineLines.contains(line)) {
                baselineSharedCount++;
            }
        }

        double contributionRatio = (double) baselineSharedCount / sharedLines.size();
        log.info("Baseline contribution calculated: {} / {} shared lines ({:.1f}%)",
                baselineSharedCount, sharedLines.size(), contributionRatio * 100);

        return contributionRatio;
    }
}
