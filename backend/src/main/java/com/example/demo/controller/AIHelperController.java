package com.example.demo.controller;

import com.example.demo.service.AIHelperService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/ai-helper")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8081"})
public class AIHelperController {

    private final AIHelperService aiHelperService;

    /**
     * Get AI-powered learning resources for a student's query in a specific course
     * POST /api/ai-helper/resources
     */
    @PostMapping("/resources")
    public ResponseEntity<Object> getLearningResources(
            @RequestParam Long courseId,
            @RequestParam Long studentId,
            @RequestBody Map<String, String> requestBody) {
        try {
            String query = requestBody.get("query");
            if (query == null || query.trim().isEmpty()) {
                return ResponseEntity.badRequest().body((Object) Map.of("error", "Query cannot be empty"));
            }

            Map<String, Object> resources = aiHelperService.findLearningResourcesSync(courseId, studentId, query);
            return ResponseEntity.ok((Object) resources);
        } catch (RuntimeException e) {
            log.error("Error getting AI learning resources: {}", e.getMessage());
            return ResponseEntity.badRequest().body((Object) Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get suggested study topics based on course content
     * GET /api/ai-helper/suggestions/{courseId}
     */
    @GetMapping("/suggestions/{courseId}")
    public ResponseEntity<?> getStudySuggestions(
            @PathVariable Long courseId,
            @RequestParam Long studentId) {
        try {
            Map<String, Object> suggestions = aiHelperService.getStudySuggestions(courseId, studentId);
            return ResponseEntity.ok(suggestions);
        } catch (RuntimeException e) {
            log.error("Error getting study suggestions: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get personalized study plan for student
     * GET /api/ai-helper/study-plan/{courseId}
     */
    @GetMapping("/study-plan/{courseId}")
    public ResponseEntity<?> getStudyPlan(
            @PathVariable Long courseId,
            @RequestParam Long studentId) {
        try {
            Map<String, Object> studyPlan = aiHelperService.generateStudyPlan(courseId, studentId);
            return ResponseEntity.ok(studyPlan);
        } catch (RuntimeException e) {
            log.error("Error generating study plan: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
