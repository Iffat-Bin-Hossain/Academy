package com.example.demo.plagiarism.analyzer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AstTree {
    private AstNode root;
    private int totalNodes;
    private int maxDepth;
    @Builder.Default
    private Set<String> subtreeHashes = new HashSet<>();
}
