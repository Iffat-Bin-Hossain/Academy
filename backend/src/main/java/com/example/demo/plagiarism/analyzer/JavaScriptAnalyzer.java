package com.example.demo.plagiarism.analyzer;

import org.springframework.stereotype.Component;

import java.util.Set;

@Component
public class JavaScriptAnalyzer extends GenericFallbackAnalyzer {

    private static final Set<String> JS_EXTENSIONS = Set.of("js", "jsx", "ts", "tsx", "mjs", "cjs");

    @Override
    public String getLanguage() {
        return "JAVASCRIPT";
    }

    @Override
    public boolean supports(String extension) {
        return extension != null && JS_EXTENSIONS.contains(extension.toLowerCase());
    }
}
