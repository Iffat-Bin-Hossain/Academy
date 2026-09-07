package com.example.demo.plagiarism.analyzer;

import java.util.List;

public interface LanguageAnalyzer {
    String getLanguage();
    boolean supports(String extension);
    TokenStream tokenize(String sourceCode);
    NormalizedSource normalize(String sourceCode);
    List<FunctionBlock> extractFunctions(String sourceCode);
    List<String> extractImports(String sourceCode);
    AstTree extractAst(String sourceCode);
    ControlFlowGraph extractControlFlow(String sourceCode);
    CodeMetrics extractMetrics(String sourceCode);
}
