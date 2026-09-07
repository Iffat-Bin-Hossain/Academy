package com.example.demo.plagiarism.ingestion;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ExtractedFile {
    private String relativePath;
    private String filename;
    private String extension;
    private String content;
    private byte[] rawBytes;
    private String sha256;
    private String normalizedSha256;
    private long sizeBytes;
    private int lineCount;
    private int tokenCount;
    private String detectedLanguage;
    private boolean isBinary;
    private String parseStatus; // "SUCCESS", "FALLBACK", "ERROR"
}
