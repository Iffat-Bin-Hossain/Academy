package com.example.demo.plagiarism.analyzer;

import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class CLanguageAnalyzer extends GenericFallbackAnalyzer {

    private static final Set<String> C_EXTENSIONS = Set.of("c", "h");

    @Override
    public String getLanguage() {
        return "C";
    }

    @Override
    public boolean supports(String extension) {
        return extension != null && C_EXTENSIONS.contains(extension.toLowerCase());
    }
}
