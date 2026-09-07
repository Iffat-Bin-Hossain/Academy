package com.example.demo.plagiarism.engine;

import com.example.demo.plagiarism.analyzer.ControlFlowGraph;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class ControlFlowEngine {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CfgMatchResult {
        private double topologySimilarity;
        private double complexitySimilarity;
        private double finalScore;
        private boolean exactTopologyMatch;
    }

    public CfgMatchResult compare(ControlFlowGraph cfgA, ControlFlowGraph cfgB) {
        CfgMatchResult result = new CfgMatchResult();

        if (cfgA == null || cfgB == null) return result;

        // Exact signature topology match
        if (cfgA.getSignature() != null && cfgA.getSignature().equals(cfgB.getSignature())) {
            result.setExactTopologyMatch(true);
            result.setTopologySimilarity(1.0);
            result.setComplexitySimilarity(1.0);
            result.setFinalScore(1.0);
            return result;
        }

        // Branch count ratio
        int branchesA = cfgA.getBranchCount();
        int branchesB = cfgB.getBranchCount();
        double branchSim = ratio(branchesA, branchesB);

        // Loop count ratio
        int loopsA = cfgA.getLoopCount();
        int loopsB = cfgB.getLoopCount();
        double loopSim = ratio(loopsA, loopsB);

        // Cyclomatic complexity ratio
        int compA = cfgA.getCyclomaticComplexity();
        int compB = cfgB.getCyclomaticComplexity();
        double compSim = ratio(compA, compB);

        // Block count ratio
        int blocksA = cfgA.getBlocks().size();
        int blocksB = cfgB.getBlocks().size();
        double blockSim = ratio(blocksA, blocksB);

        double topologySim = (branchSim * 0.35) + (loopSim * 0.35) + (blockSim * 0.30);
        double finalScore = (topologySim * 0.70) + (compSim * 0.30);

        result.setTopologySimilarity(topologySim);
        result.setComplexitySimilarity(compSim);
        result.setFinalScore(finalScore);

        return result;
    }

    private double ratio(int a, int b) {
        if (a == 0 && b == 0) return 1.0;
        if (a == 0 || b == 0) return 0.0;
        return (double) Math.min(a, b) / Math.max(a, b);
    }
}
