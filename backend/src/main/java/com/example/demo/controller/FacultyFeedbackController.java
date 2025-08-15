package com.example.demo.controller;

import com.example.demo.model.FacultyFeedbackRequest;
import com.example.demo.model.FacultyFeedbackResponse;
import com.example.demo.service.FacultyFeedbackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/faculty-feedback")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8081"})
public class FacultyFeedbackController {

    private final FacultyFeedbackService feedbackService;

    /**
     * Submit faculty feedback
     * POST /api/faculty-feedback
     */
    @PostMapping
    public ResponseEntity<?> submitFeedback(@Valid @RequestBody FacultyFeedbackRequest request) {
        try {
            log.info("Received faculty feedback submission from student {} for teacher {} in course {}", 
                    request.getStudentId(), request.getTeacherId(), request.getCourseId());
            
            FacultyFeedbackResponse response = feedbackService.submitFeedback(request);
            
            return ResponseEntity.ok(Map.of(
                "message", "Feedback submitted successfully",
                "feedback", response
            ));
        } catch (RuntimeException e) {
            log.error("Error submitting faculty feedback: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get feedback submitted by a student for a specific course
     * GET /api/faculty-feedback/student/{studentId}/course/{courseId}
     */
    @GetMapping("/student/{studentId}/course/{courseId}")
    public ResponseEntity<?> getStudentFeedbackForCourse(
            @PathVariable Long studentId,
            @PathVariable Long courseId) {
        try {
            FacultyFeedbackResponse feedback = feedbackService.getStudentFeedbackForCourse(studentId, courseId);
            return ResponseEntity.ok(feedback);
        } catch (RuntimeException e) {
            log.error("Error fetching student feedback: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all feedback for a specific teacher (teacher view)
     * GET /api/faculty-feedback/teacher/{teacherId}
     */
    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<?> getTeacherFeedback(@PathVariable Long teacherId) {
        try {
            List<FacultyFeedbackResponse> feedbackList = feedbackService.getTeacherFeedback(teacherId);
            return ResponseEntity.ok(feedbackList);
        } catch (RuntimeException e) {
            log.error("Error fetching teacher feedback: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get feedback for a teacher in a specific course
     * GET /api/faculty-feedback/teacher/{teacherId}/course/{courseId}
     */
    @GetMapping("/teacher/{teacherId}/course/{courseId}")
    public ResponseEntity<?> getTeacherCourseFeedback(
            @PathVariable Long teacherId,
            @PathVariable Long courseId) {
        try {
            List<FacultyFeedbackResponse> feedbackList = feedbackService.getTeacherCourseFeedback(teacherId, courseId);
            return ResponseEntity.ok(feedbackList);
        } catch (RuntimeException e) {
            log.error("Error fetching teacher course feedback: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all feedback submitted by a specific student
     * GET /api/faculty-feedback/student/{studentId}
     */
    @GetMapping("/student/{studentId}")
    public ResponseEntity<?> getStudentFeedback(@PathVariable Long studentId) {
        try {
            List<FacultyFeedbackResponse> feedbackList = feedbackService.getStudentFeedback(studentId);
            return ResponseEntity.ok(feedbackList);
        } catch (RuntimeException e) {
            log.error("Error fetching student feedback: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get teacher statistics including average ratings
     * GET /api/faculty-feedback/teacher/{teacherId}/stats
     */
    @GetMapping("/teacher/{teacherId}/stats")
    public ResponseEntity<?> getTeacherStats(@PathVariable Long teacherId) {
        try {
            FacultyFeedbackService.TeacherFeedbackStats stats = feedbackService.getTeacherStats(teacherId);
            return ResponseEntity.ok(stats);
        } catch (RuntimeException e) {
            log.error("Error fetching teacher feedback stats: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete feedback (admin only)
     * DELETE /api/faculty-feedback/{feedbackId}
     */
    @DeleteMapping("/{feedbackId}")
    public ResponseEntity<?> deleteFeedback(@PathVariable Long feedbackId) {
        try {
            feedbackService.deleteFeedback(feedbackId);
            return ResponseEntity.ok(Map.of("message", "Feedback deleted successfully"));
        } catch (RuntimeException e) {
            log.error("Error deleting feedback: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
