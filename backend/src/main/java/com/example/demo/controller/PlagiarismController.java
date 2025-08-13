package com.example.demo.controller;

import com.example.demo.dto.PlagiarismCheckRequest;
import com.example.demo.dto.PlagiarismAnalysisResponse;
import com.example.demo.service.PlagiarismService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/plagiarism")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://127.0.0.1:3000"})
public class PlagiarismController {

    private final PlagiarismService plagiarismService;

    /**
     * Start plagiarism check for an assignment
     * POST /api/plagiarism/check/{assignmentId}
     */
    @PostMapping("/check/{assignmentId}")
    public ResponseEntity<?> startPlagiarismCheck(
            @PathVariable Long assignmentId,
            @RequestBody PlagiarismCheckRequest request) {
        try {
            String analysisId = plagiarismService.startPlagiarismAnalysis(assignmentId, request);
            return ResponseEntity.ok(Map.of("analysisId", analysisId));
        } catch (RuntimeException e) {
            log.error("Error starting plagiarism check: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get plagiarism analysis status
     * GET /api/plagiarism/status/{analysisId}
     */
    @GetMapping("/status/{analysisId}")
    public ResponseEntity<?> getAnalysisStatus(@PathVariable String analysisId) {
        try {
            PlagiarismAnalysisResponse response = plagiarismService.getAnalysisStatus(analysisId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error getting analysis status: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get plagiarism analysis results
     * GET /api/plagiarism/results/{analysisId}
     */
    @GetMapping("/results/{analysisId}")
    public ResponseEntity<?> getAnalysisResults(@PathVariable String analysisId) {
        try {
            PlagiarismAnalysisResponse response = plagiarismService.getAnalysisResults(analysisId);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            log.error("Error getting analysis results: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Cancel plagiarism analysis
     * DELETE /api/plagiarism/cancel/{analysisId}
     */
    @DeleteMapping("/cancel/{analysisId}")
    public ResponseEntity<?> cancelAnalysis(@PathVariable String analysisId) {
        try {
            plagiarismService.cancelAnalysis(analysisId);
            return ResponseEntity.ok(Map.of("message", "Analysis cancelled successfully"));
        } catch (RuntimeException e) {
            log.error("Error cancelling analysis: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
