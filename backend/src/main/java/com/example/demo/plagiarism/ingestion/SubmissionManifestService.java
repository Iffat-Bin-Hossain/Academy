package com.example.demo.plagiarism.ingestion;

import com.example.demo.model.StudentSubmission;
import com.example.demo.model.User;
import com.example.demo.plagiarism.model.PlagiarismAnalysisRun;
import com.example.demo.plagiarism.model.PlagiarismSubmissionManifest;
import com.example.demo.plagiarism.repository.PlagiarismSubmissionManifestRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SubmissionManifestService {

    private final PlagiarismSubmissionManifestRepository manifestRepository;
    private final ObjectMapper objectMapper;

    /**
     * Generates and persists a submission manifest record.
     */
    public PlagiarismSubmissionManifest generateAndSaveManifest(
            PlagiarismAnalysisRun run,
            StudentSubmission submission,
            User student,
            String archiveHash,
            List<ExtractedFile> files) {

        int totalFiles = files.size();
        int totalLines = 0;
        int totalTokens = 0;
        Map<String, Integer> langCount = new HashMap<>();

        List<Map<String, Object>> fileSummaries = new ArrayList<>();

        for (ExtractedFile file : files) {
            totalLines += file.getLineCount();
            totalTokens += file.getTokenCount();
            String lang = file.getDetectedLanguage();
            if (lang != null && !lang.equals("GENERIC") && !file.isBinary()) {
                langCount.put(lang, langCount.getOrDefault(lang, 0) + 1);
            }

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("relativePath", file.getRelativePath());
            entry.put("filename", file.getFilename());
            entry.put("extension", file.getExtension());
            entry.put("language", file.getDetectedLanguage());
            entry.put("sha256", file.getSha256());
            entry.put("normalizedSha256", file.getNormalizedSha256());
            entry.put("sizeBytes", file.getSizeBytes());
            entry.put("lineCount", file.getLineCount());
            entry.put("tokenCount", file.getTokenCount());
            entry.put("parseStatus", file.getParseStatus());
            fileSummaries.add(entry);
        }

        // Determine dominant language
        String primaryLanguage = langCount.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("GENERIC");

        String manifestJson = "[]";
        try {
            manifestJson = objectMapper.writeValueAsString(fileSummaries);
        } catch (Exception e) {
            log.error("Failed to serialize file summaries to JSON: {}", e.getMessage());
        }

        PlagiarismSubmissionManifest manifest = PlagiarismSubmissionManifest.builder()
                .run(run)
                .submission(submission)
                .student(student)
                .archiveHash(archiveHash)
                .totalFiles(totalFiles)
                .totalLines(totalLines)
                .totalTokens(totalTokens)
                .primaryLanguage(primaryLanguage)
                .filesManifestJson(manifestJson)
                .build();

        return manifestRepository.save(manifest);
    }
}
