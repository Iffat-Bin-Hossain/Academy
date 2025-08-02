package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private static final Logger logger = LoggerFactory.getLogger(AdminController.class);
    private final UserRepository userRepo;
    private final EmailService emailService;

    // 1) List all pending users sorted by registration time (newest first)
    @GetMapping("/pending")
    public List<User> listPending() {
        logger.info("Fetching pending users...");
        List<User> pendingUsers = userRepo.findByIsApprovedFalseOrderByCreatedAtDesc();
        logger.info("Found {} pending users", pendingUsers.size());
        pendingUsers.forEach(user -> logger.info("User: {}, Approved: {}", user.getName(), user.isApproved()));
        return pendingUsers;
    }

    // 2) Approve a user by ID
    @PostMapping("/approve/{id}")
    public ResponseEntity<?> approve(@PathVariable Long id) {
        try {
            User user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            user.setApproved(true);
            userRepo.save(user);
            
            // Send approval notification email
            emailService.sendApprovalNotification(user.getEmail(), user.getName());
            
            return ResponseEntity.ok(Map.of(
                "message", "User approved successfully",
                "user", Map.of(
                    "id", user.getId(),
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "role", user.getRole()
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 3) Reject a user by ID (delete the request)
    @PostMapping("/reject/{id}")
    public ResponseEntity<?> reject(@PathVariable Long id) {
        try {
            User user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Send rejection notification email
            emailService.sendRejectionNotification(user.getEmail(), user.getName());
            
            // Delete the user from database
            userRepo.delete(user);
            
            return ResponseEntity.ok(Map.of(
                "message", "User request rejected and removed",
                "user", Map.of(
                    "id", user.getId(),
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "role", user.getRole()
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 4) Get all users (for admin management)
    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepo.findAll();
    }
}
