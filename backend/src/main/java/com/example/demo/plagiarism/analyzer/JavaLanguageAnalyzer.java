package com.example.demo.plagiarism.analyzer;

import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class JavaLanguageAnalyzer extends GenericFallbackAnalyzer {

    private static final Set<String> JAVA_EXTENSIONS = Set.of("java");

    @Override
    public String getLanguage() {
        return "JAVA";
    }

    @Override
    public boolean supports(String extension) {
        return extension != null && JAVA_EXTENSIONS.contains(extension.toLowerCase());
    }
}
