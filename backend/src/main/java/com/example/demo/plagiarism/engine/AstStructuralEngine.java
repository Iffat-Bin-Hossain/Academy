package com.example.demo.plagiarism.engine;

import com.example.demo.plagiarism.analyzer.AstNode;
import com.example.demo.plagiarism.analyzer.AstTree;
import com.example.demo.plagiarism.analyzer.FunctionBlock;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
@Slf4j
public class AstStructuralEngine {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AstMatchResult {
        private double subtreeSimilarity;
        private double functionStructuralSimilarity;
        private double finalScore;
        private int matchingSubtrees;
        private int totalSubtrees;
        @Builder.Default
        private List<MatchedFunction> matchedFunctions = new ArrayList<>();
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class MatchedFunction {
        private String funcA;
        private String funcB;
        private int startLineA;
        private int endLineA;
        private int startLineB;
        private int endLineB;
        private double similarity;
    }

    public AstMatchResult compare(AstTree treeA, AstTree treeB, List<FunctionBlock> funcsA, List<FunctionBlock> funcsB) {
        AstMatchResult result = new AstMatchResult();

        if (treeA == null || treeB == null) return result;

        // 1. Subtree Hash Overlap (Jaccard on all subtrees)
        Set<String> subA = treeA.getSubtreeHashes();
        Set<String> subB = treeB.getSubtreeHashes();

        if (!subA.isEmpty() && !subB.isEmpty()) {
            Set<String> inter = new HashSet<>(subA);
            inter.retainAll(subB);

            Set<String> union = new HashSet<>(subA);
            union.addAll(subB);

            double subSim = union.isEmpty() ? 0.0 : (double) inter.size() / union.size();
            result.setSubtreeSimilarity(subSim);
            result.setMatchingSubtrees(inter.size());
            result.setTotalSubtrees(union.size());
        }

        // 2. Function-level AST Structural Comparison
        if (funcsA != null && funcsB != null && !funcsA.isEmpty() && !funcsB.isEmpty()) {
            double funcTotalScore = 0.0;
            int comparisons = 0;

            for (FunctionBlock fA : funcsA) {
                double maxFuncSim = 0.0;
                FunctionBlock bestMatchB = null;

                for (FunctionBlock fB : funcsB) {
                    double sim = compareFunctionAst(fA, fB);
                    if (sim > maxFuncSim) {
                        maxFuncSim = sim;
                        bestMatchB = fB;
                    }
                }

                if (bestMatchB != null && maxFuncSim >= 0.60) {
                    result.getMatchedFunctions().add(MatchedFunction.builder()
                            .funcA(fA.getName())
                            .funcB(bestMatchB.getName())
                            .startLineA(fA.getStartLine())
                            .endLineA(fA.getEndLine())
                            .startLineB(bestMatchB.getStartLine())
                            .endLineB(bestMatchB.getEndLine())
                            .similarity(maxFuncSim)
                            .build());
                }

                funcTotalScore += maxFuncSim;
                comparisons++;
            }

            double avgFuncSim = comparisons == 0 ? 0.0 : funcTotalScore / comparisons;
            result.setFunctionStructuralSimilarity(avgFuncSim);
        }

        // 3. Combined AST score
        double finalScore = (result.getSubtreeSimilarity() * 0.5) + (result.getFunctionStructuralSimilarity() * 0.5);
        result.setFinalScore(finalScore);

        return result;
    }

    private double compareFunctionAst(FunctionBlock fA, FunctionBlock fB) {
        if (fA == null || fB == null) return 0.0;

        // If normalized AST subtree hashes match exactly
        if (fA.getAstSubtreeHash() != null && fA.getAstSubtreeHash().equals(fB.getAstSubtreeHash())) {
            return 1.0;
        }

        // Parameter count similarity
        int paramCountA = fA.getParameterTypes().size();
        int paramCountB = fB.getParameterTypes().size();
        double paramSim = paramCountA == paramCountB ? 1.0 : (1.0 / (1.0 + Math.abs(paramCountA - paramCountB)));

        // Complexity similarity
        int compA = fA.getComplexity();
        int compB = fB.getComplexity();
        double compSim = 1.0 / (1.0 + Math.abs(compA - compB));

        // Token length similarity
        int tokA = fA.getTokenCount();
        int tokB = fB.getTokenCount();
        double tokRatio = (tokA <= 0 || tokB <= 0) ? 0.0 : (double) Math.min(tokA, tokB) / Math.max(tokA, tokB);

        return (paramSim * 0.25) + (compSim * 0.35) + (tokRatio * 0.40);
    }
}
