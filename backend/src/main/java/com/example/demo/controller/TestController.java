package com.example.demo.controller;

import com.example.demo.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
public class TestController {

    private final EmailService emailService;

    @GetMapping("/api/test")
    public String testApi() {
        return "Backend is working!";
    }

    @PostMapping("/api/test/email")
    public ResponseEntity<?> testEmail(@RequestParam String to) {
        boolean sent = emailService.sendTestEmail(to);
        if (sent) {
            return ResponseEntity.ok(Map.of("success", true, "message", "Test email successfully sent to " + to));
        } else {
            return ResponseEntity.badRequest().body(Map.of(
                "success", false, 
                "message", "Failed to deliver email via SMTP. Please verify SMTP_USERNAME and SMTP_PASSWORD in your .env file."
            ));
        }
    }
}
