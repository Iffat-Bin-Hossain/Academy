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
public class AstNode {
    private String type; // e.g. "FunctionDeclaration", "IfStatement", "ForLoop", "BinaryExpression"
    private String value;
    @Builder.Default
    private List<AstNode> children = new ArrayList<>();
    private int startLine;
    private int endLine;
    private String subtreeHash;

    public void addChild(AstNode child) {
        this.children.add(child);
    }
}
