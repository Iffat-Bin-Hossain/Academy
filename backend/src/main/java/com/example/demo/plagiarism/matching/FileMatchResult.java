package com.example.demo.plagiarism.matching;

import com.example.demo.plagiarism.ingestion.ExtractedFile;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FileMatchResult {
    private ExtractedFile file1;
    private ExtractedFile file2;
    private Classification classification;
    private double matchConfidence;
    private boolean isRenamed;
    private String rationale;

    public enum Classification {
        EXACT_MATCH,
        PROBABLE_MATCH,
        POSSIBLE_MATCH,
        UNRELATED,
        UNIQUE_FILE
    }
}
