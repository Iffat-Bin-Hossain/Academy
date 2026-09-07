package com.example.demo.plagiarism.analyzer;

import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class CppLanguageAnalyzer extends GenericFallbackAnalyzer {

    private static final Set<String> CPP_EXTENSIONS = Set.of("cpp", "cc", "cxx", "hpp", "hxx");

    @Override
    public String getLanguage() {
        return "CPP";
    }

    @Override
    public boolean supports(String extension) {
        return extension != null && CPP_EXTENSIONS.contains(extension.toLowerCase());
    }
}
