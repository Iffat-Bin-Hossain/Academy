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
public class BasicBlock {
    private int id;
    @Builder.Default
    private List<String> instructions = new ArrayList<>();
    private boolean isBranch;
    private boolean isLoop;
    private int startLine;
    private int endLine;
    @Builder.Default
    private List<Integer> successors = new ArrayList<>();
    @Builder.Default
    private List<Integer> predecessors = new ArrayList<>();
}
