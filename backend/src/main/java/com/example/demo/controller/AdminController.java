package com.example.demo.controller;

import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepo;
    private final EmailService emailService;

    // 1) List all pending users
    @GetMapping("/pending")
    public List<User> listPending() {
        return userRepo.findAll().stream()
            .filter(u -> !u.isApproved())
            .toList();
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

    // 3) Get all users (for admin management)
    @GetMapping("/users")
    public List<User> getAllUsers() {
        return userRepo.findAll();
    }
}
