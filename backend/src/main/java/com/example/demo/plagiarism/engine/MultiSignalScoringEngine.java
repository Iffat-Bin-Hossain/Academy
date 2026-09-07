package com.example.demo.plagiarism.engine;

import com.example.demo.plagiarism.model.PlagiarismAnalysisRun;
import com.example.demo.plagiarism.model.PlagiarismSimilarityPair;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class MultiSignalScoringEngine {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MultiSignalScores {
        private double rawSimilarityScore; // 0 - 100
        private double suspicionScore;     // 0 - 100
        private double confidenceScore;    // 0 - 100
        private PlagiarismSimilarityPair.RiskCategory riskCategory;
        private String rationale;
    }

    public MultiSignalScores computeScores(
            PlagiarismAnalysisRun run,
            double exactScore,       // 0 - 1
            double tokenScore,       // 0 - 1
            double astScore,         // 0 - 1
            double cfgScore,         // 0 - 1
            double fingerprintScore, // 0 - 1
            double semanticScore,    // 0 - 1
            double behavioralScore,  // 0 - 1
            double baselineContribution, // 0 - 1
            int codeLineCount,
            int matchingFingerprintCount,
            int unusualIdentifiersCount) {

        double wExact = run != null ? run.getExactWeight() : 0.25;
        double wToken = run != null ? run.getTokenWeight() : 0.15;
        double wAst = run != null ? run.getAstWeight() : 0.25;
        double wCfg = run != null ? run.getCfgWeight() : 0.15;
        double wFp = run != null ? run.getFingerprintWeight() : 0.10;
        double wSem = run != null ? run.getSemanticWeight() : 0.10;

        // 1. Raw Similarity Score: Weighted average of all similarity engines
        double rawSim = (exactScore * wExact) +
                        (tokenScore * wToken) +
                        (astScore * wAst) +
                        (cfgScore * wCfg) +
                        (fingerprintScore * wFp) +
                        (semanticScore * wSem);
        rawSim = Math.min(1.0, Math.max(0.0, rawSim)) * 100.0;

        // 2. Suspicion Score: Adjust raw similarity based on baseline subtraction, code length, and distinctive fingerprints
        double suspicion = rawSim;

        // Baseline deduction: If 40% of overlap is starter code, deduct heavily
        if (baselineContribution > 0) {
            double deduction = baselineContribution * 0.85 * rawSim;
            suspicion = Math.max(0.0, suspicion - deduction);
        }

        // Trivial/Short code false-positive penalty (applied only when not an exact verbatim match)
        if (exactScore < 0.90) {
            if (codeLineCount < 10) {
                suspicion *= 0.40; // Penalty for tiny programs that naturally look alike
            } else if (codeLineCount < 20) {
                suspicion *= 0.70;
            }
        }

        // Distinctive fingerprints boost suspicion:
        if (matchingFingerprintCount >= 10 && unusualIdentifiersCount > 0) {
            suspicion = Math.min(100.0, suspicion * 1.15);
        }

        // 3. Confidence Score: Evaluates agreement among multiple independent detectors
        int agreeingEngines = 0;
        if (exactScore > 0.80) agreeingEngines += 2;
        if (tokenScore > 0.65) agreeingEngines++;
        if (astScore > 0.65) agreeingEngines++;
        if (cfgScore > 0.65) agreeingEngines++;
        if (fingerprintScore > 0.60) agreeingEngines++;
        if (semanticScore > 0.70) agreeingEngines++;

        double confidence;
        if (exactScore > 0.95) {
            confidence = 98.0;
        } else {
            confidence = Math.min(95.0, (agreeingEngines / 6.0) * 80.0 + (codeLineCount > 30 ? 15.0 : 5.0));
        }

        // 4. Determine Risk Category
        PlagiarismSimilarityPair.RiskCategory category;
        if (suspicion >= 75.0 && confidence >= 60.0) {
            category = PlagiarismSimilarityPair.RiskCategory.STRONG_EVIDENCE;
        } else if (suspicion >= 50.0) {
            category = PlagiarismSimilarityPair.RiskCategory.REVIEW_RECOMMENDED;
        } else {
            category = PlagiarismSimilarityPair.RiskCategory.NO_CONCERN;
        }

        // 5. Generate human-readable rationale
        StringBuilder rat = new StringBuilder();
        if (exactScore > 0.95) {
            rat.append("Exact verbatim file copy detected. ");
        } else {
            if (astScore > 0.75) rat.append("Identical AST structural decomposition. ");
            if (matchingFingerprintCount > 5) rat.append(matchingFingerprintCount).append(" distinctive fingerprints match. ");
            if (unusualIdentifiersCount > 0) rat.append("Shared unusual naming patterns found. ");
            if (baselineContribution > 0.20) {
                rat.append(String.format("Note: %.0f%% of common code is attributable to assignment template/starter code. ", baselineContribution * 100));
            }
        }

        return MultiSignalScores.builder()
                .rawSimilarityScore(rawSim)
                .suspicionScore(suspicion)
                .confidenceScore(confidence)
                .riskCategory(category)
                .rationale(rat.toString().trim())
                .build();
    }
}
