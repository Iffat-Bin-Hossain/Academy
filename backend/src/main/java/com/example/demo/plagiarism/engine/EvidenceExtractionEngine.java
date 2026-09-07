package com.example.demo.plagiarism.engine;

import com.example.demo.plagiarism.analyzer.FunctionBlock;
import com.example.demo.plagiarism.analyzer.NormalizedSource;
import com.example.demo.plagiarism.model.PlagiarismEvidenceItem;
import com.example.demo.plagiarism.model.PlagiarismSimilarityPair;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@Slf4j
public class EvidenceExtractionEngine {

    /**
     * Extracts structured, explainable evidence items for a similarity pair.
     */
    public List<PlagiarismEvidenceItem> extractEvidence(
            PlagiarismSimilarityPair pair,
            String file1Path,
            String file2Path,
            NormalizedSource normA,
            NormalizedSource normB,
            AstStructuralEngine.AstMatchResult astResult,
            WinnowingTokenEngine.WinnowingResult winnowingResult,
            ExactMatchEngine.ExactMatchResult exactResult,
            ControlFlowEngine.CfgMatchResult cfgResult,
            double baselineContribution) {

        List<PlagiarismEvidenceItem> items = new ArrayList<>();

        // 1. Exact Match Blocks
        if (exactResult.isExactFileMatch) {
            items.add(PlagiarismEvidenceItem.builder()
                    .pair(pair)
                    .evidenceType(PlagiarismEvidenceItem.EvidenceType.EXACT_BLOCK)
                    .file1Path(file1Path)
                    .file2Path(file2Path)
                    .startLine1(1)
                    .endLine1(100)
                    .startLine2(1)
                    .endLine2(100)
                    .similarityScore(100.0)
                    .confidenceScore(99.0)
                    .explanation("Entire file contents are character-for-character identical.")
                    .build());
        } else if (exactResult.isNormalizedMatch) {
            items.add(PlagiarismEvidenceItem.builder()
                    .pair(pair)
                    .evidenceType(PlagiarismEvidenceItem.EvidenceType.EXACT_BLOCK)
                    .file1Path(file1Path)
                    .file2Path(file2Path)
                    .startLine1(1)
                    .endLine1(50)
                    .startLine2(1)
                    .endLine2(50)
                    .similarityScore(98.0)
                    .confidenceScore(95.0)
                    .explanation("Exact source code match once comments and layout formatting are normalized.")
                    .build());
        }

        // 2. Function-Level Structural Matches
        if (astResult != null && astResult.getMatchedFunctions() != null) {
            for (AstStructuralEngine.MatchedFunction mf : astResult.getMatchedFunctions()) {
                if (mf.getSimilarity() >= 0.75) {
                    boolean renamed = !mf.getFuncA().equalsIgnoreCase(mf.getFuncB());
                    String expl = renamed ?
                            String.format("Function '%s' in File A has identical structural logic to '%s' in File B (renamed function).", mf.getFuncA(), mf.getFuncB()) :
                            String.format("Function '%s' has identical AST branch/loop and statement hierarchy.", mf.getFuncA());

                    items.add(PlagiarismEvidenceItem.builder()
                            .pair(pair)
                            .evidenceType(renamed ? PlagiarismEvidenceItem.EvidenceType.IDENTIFIER_RENAMING : PlagiarismEvidenceItem.EvidenceType.HELPER_FUNCTION)
                            .file1Path(file1Path)
                            .file2Path(file2Path)
                            .startLine1(mf.getStartLineA())
                            .endLine1(mf.getEndLineA())
                            .startLine2(mf.getStartLineB())
                            .endLine2(mf.getEndLineB())
                            .similarityScore(mf.getSimilarity() * 100.0)
                            .confidenceScore(88.0)
                            .explanation(expl)
                            .build());
                }
            }
        }

        // 3. Shared Unusual Identifiers (Forensic Smoking Gun)
        if (normA != null && normB != null) {
            Set<String> unusualA = new HashSet<>(normA.getUnusualIdentifiers());
            unusualA.retainAll(normB.getUnusualIdentifiers());

            if (!unusualA.isEmpty()) {
                items.add(PlagiarismEvidenceItem.builder()
                        .pair(pair)
                        .evidenceType(PlagiarismEvidenceItem.EvidenceType.UNUSUAL_NAMING)
                        .file1Path(file1Path)
                        .file2Path(file2Path)
                        .similarityScore(90.0)
                        .confidenceScore(85.0)
                        .explanation("Unusual identical identifier names shared: " + String.join(", ", unusualA))
                        .build());
            }
        }

        // 4. Distinctive Winnowing Fingerprints
        if (winnowingResult != null && winnowingResult.getMatchingFingerprints() >= 5) {
            items.add(PlagiarismEvidenceItem.builder()
                    .pair(pair)
                    .evidenceType(PlagiarismEvidenceItem.EvidenceType.FINGERPRINT_MATCH)
                    .file1Path(file1Path)
                    .file2Path(file2Path)
                    .similarityScore(winnowingResult.getFinalScore() * 100.0)
                    .confidenceScore(80.0)
                    .explanation(String.format("%d identical MOSS-style rolling code fingerprints matched across files.",
                            winnowingResult.getMatchingFingerprints()))
                    .build());
        }

        // 5. Baseline Starter Code Evidence (Positive False-Positive Filter)
        if (baselineContribution >= 0.15) {
            items.add(PlagiarismEvidenceItem.builder()
                    .pair(pair)
                    .evidenceType(PlagiarismEvidenceItem.EvidenceType.STARTER_CODE_BASELINE)
                    .file1Path(file1Path)
                    .file2Path(file2Path)
                    .isBaseline(true)
                    .similarityScore(baselineContribution * 100.0)
                    .confidenceScore(95.0)
                    .explanation(String.format("%.1f%% of common code overlap is attributable to instructor starter code/templates and has been discounted.",
                            baselineContribution * 100.0))
                    .build());
        }

        return items;
    }
}
