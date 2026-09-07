package com.example.demo.plagiarism.analyzer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CodeMetrics {
    private int totalLines;
    private int codeLines;
    private int commentLines;
    private int blankLines;
    private int tokenCount;
    private int functionCount;
    private int cyclomaticComplexity;
    private int distinctIdentifiers;
}
