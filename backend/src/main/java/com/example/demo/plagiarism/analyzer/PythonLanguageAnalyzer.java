package com.example.demo.plagiarism.analyzer;

import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class PythonLanguageAnalyzer extends GenericFallbackAnalyzer {

    private static final Set<String> PYTHON_EXTENSIONS = Set.of("py", "pyw", "pyi");

    @Override
    public String getLanguage() {
        return "PYTHON";
    }

    @Override
    public boolean supports(String extension) {
        return extension != null && PYTHON_EXTENSIONS.contains(extension.toLowerCase());
    }
}
