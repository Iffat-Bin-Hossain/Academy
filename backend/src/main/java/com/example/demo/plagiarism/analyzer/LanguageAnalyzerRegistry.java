package com.example.demo.plagiarism.analyzer;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
public class LanguageAnalyzerRegistry {

    private final List<LanguageAnalyzer> analyzers;

    public LanguageAnalyzerRegistry(List<LanguageAnalyzer> analyzers) {
        this.analyzers = analyzers;
    }

    public LanguageAnalyzer getAnalyzer(String extension) {
        if (extension == null || extension.isEmpty()) {
            return getFallbackAnalyzer();
        }

        for (LanguageAnalyzer analyzer : analyzers) {
            if (!"GENERIC".equals(analyzer.getLanguage()) && analyzer.supports(extension)) {
                return analyzer;
            }
        }
        return getFallbackAnalyzer();
    }

    public LanguageAnalyzer getFallbackAnalyzer() {
        for (LanguageAnalyzer a : analyzers) {
            if ("GENERIC".equals(a.getLanguage())) {
                return a;
            }
        }
        return new GenericFallbackAnalyzer();
    }
}
