package com.example.demo.controller;

import com.example.demo.service.GeminiAIService;
import com.example.demo.service.CourseService;
import com.example.demo.model.Course;
import com.example.demo.repository.CourseEnrollmentRepository;
import com.example.demo.repository.UserRepository;
import com.example.demo.model.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    @Autowired
    private GeminiAIService geminiAIService;

    @Autowired
    private CourseService courseService;

    @Autowired
    private CourseEnrollmentRepository courseEnrollmentRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/message")
    public ResponseEntity<Map<String, Object>> sendMessage(
            @RequestBody Map<String, String> request,
            @RequestParam Long courseId,
            @RequestParam Long studentId) {
        
        System.out.println("Chat Debug: Received message for courseId: " + courseId + ", studentId: " + studentId);

        String message = request.get("message");
        System.out.println("Chat Debug: Message content: " + message);
        
        if (message == null || message.trim().isEmpty()) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Message cannot be empty");
            System.out.println("Chat Error: Empty message received");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        // Verify student and course exist (make it more flexible for testing)
        User student = userRepository.findById(studentId).orElse(null);
        Course course = courseService.getCourseById(courseId);
        
        System.out.println("Chat Debug: Student found: " + (student != null ? student.getEmail() : "null"));
        System.out.println("Chat Debug: Course found: " + (course != null ? course.getTitle() : "null"));
        
        if (student == null || course == null) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Invalid student or course");
            System.err.println("Chat Error: Student or course not found. StudentId: " + studentId + ", CourseId: " + courseId);
            return ResponseEntity.badRequest().body(errorResponse);
        }

        // Check enrollment - but allow AI chat even if not strictly enrolled (for testing)
        boolean isEnrolled = !courseEnrollmentRepository.findByStudentAndCourse(student, course).isEmpty();
        System.out.println("Chat Debug: Student ID " + student.getId() + " enrollment status for course " + course.getTitle() + ": " + isEnrolled);
        
        // For now, allow chat regardless of enrollment status to test AI functionality
        // if (!isEnrolled) {
        //     Map<String, Object> errorResponse = new HashMap<>();
        //     errorResponse.put("error", "You are not enrolled in this course");
        //     return ResponseEntity.status(403).body(errorResponse);
        // }

        // Get course context
        String courseContext = getCourseContext(courseId);

        // Generate AI response synchronously
        try {
            String aiResponse = geminiAIService.generateResponseSync(message, courseContext);
            
            Map<String, Object> response = new HashMap<>();
            response.put("message", aiResponse);
            response.put("timestamp", System.currentTimeMillis());
            response.put("isAI", true);
            response.put("courseContext", courseContext != null);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Chat Error: Failed to generate AI response: " + e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Failed to generate AI response");
            errorResponse.put("message", "I'm sorry, I encountered an error. Please try again.");
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("aiConfigured", geminiAIService.isConfigured());
        status.put("service", "AI Chat Assistant");
        status.put("version", "1.0");
        status.put("timestamp", System.currentTimeMillis());
        
        return ResponseEntity.ok(status);
    }

    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> testChat(@RequestBody Map<String, String> request) {
        Map<String, Object> response = new HashMap<>();
        String message = request.get("message");
        
        response.put("received", message);
        response.put("aiConfigured", geminiAIService.isConfigured());
        response.put("timestamp", System.currentTimeMillis());
        
        // Test AI service directly
        try {
            String aiResponse = geminiAIService.generateResponse(message, "Test Course").get();
            response.put("aiResponse", aiResponse);
            response.put("success", true);
        } catch (Exception e) {
            response.put("error", e.getMessage());
            response.put("success", false);
        }
        
        return ResponseEntity.ok(response);
    }

    private String getCourseContext(Long courseId) {
        try {
            Course course = courseService.getCourseById(courseId);
            if (course != null) {
                StringBuilder context = new StringBuilder();
                context.append(course.getTitle());
                if (course.getDescription() != null) {
                    context.append(" - ").append(course.getDescription());
                }
                return context.toString();
            }
        } catch (Exception e) {
            // Log error but don't fail the request
            System.err.println("Error getting course context: " + e.getMessage());
        }
        return null;
    }
}
