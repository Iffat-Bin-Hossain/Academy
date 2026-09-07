package com.example.demo.plagiarism.analyzer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ControlFlowGraph {
    @Builder.Default
    private List<BasicBlock> blocks = new ArrayList<>();
    private int entryBlockId;
    @Builder.Default
    private List<Integer> exitBlockIds = new ArrayList<>();
    private int cyclomaticComplexity;
    private int branchCount;
    private int loopCount;
    private String signature; // Graph topology hash
}
