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
public class FunctionBlock {
    private String name;
    private String returnType;
    @Builder.Default
    private List<String> parameterTypes = new ArrayList<>();
    private int startLine;
    private int endLine;
    private String rawBody;
    private String normalizedBody;
    private String astSubtreeHash;
    private int complexity;
    private int tokenCount;
}
