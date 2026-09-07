package com.example.demo.plagiarism.analyzer;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NormalizedSource {
    private String rawSource;
    private String normalizedSource; // stripped of comments, uniform whitespace
    private String identifierNormalizedSource; // variables canonicalized to VAR_0, etc.
    @Builder.Default
    private Map<String, String> identifierMap = new HashMap<>();
    @Builder.Default
    private List<String> unusualIdentifiers = new ArrayList<>(); // tracked as forensic evidence
    private String normalizedHash;
}
