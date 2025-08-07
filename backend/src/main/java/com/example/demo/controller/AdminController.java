package com.example.demo.controller;

import com.example.demo.model.Role;
import com.example.demo.model.User;
import com.example.demo.model.UserStatus;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.EmailService;
import com.example.demo.service.NotificationService;
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
    private final NotificationService notificationService;

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
            user.setStatus(UserStatus.ACTIVE); // Set status to ACTIVE
            userRepo.save(user);
            
            // Send approval notification email
            emailService.sendApprovalNotification(user.getEmail(), user.getName());
            
            // Create in-app notification for the user
            notificationService.createAccountApprovalNotification(user, true);
            
            return ResponseEntity.ok(Map.of(
                "message", "User approved successfully",
                "user", Map.of(
                    "id", user.getId(),
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "role", user.getRole(),
                    "status", user.getStatus()
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

    // 5) Toggle user status (Enable/Disable)
    @PostMapping("/users/{id}/toggle-status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Long id) {
        try {
            User user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Protect admin users - they cannot be disabled
            if (user.getRole() == Role.ADMIN) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Admin users cannot be disabled for security reasons"
                ));
            }
            
            // Toggle between ACTIVE and DISABLED
            if (user.getStatus() == UserStatus.ACTIVE) {
                user.setStatus(UserStatus.DISABLED);
            } else if (user.getStatus() == UserStatus.DISABLED) {
                user.setStatus(UserStatus.ACTIVE);
                user.setApproved(true); // Ensure approved when enabling
            } else {
                // If PENDING, set to ACTIVE (approve)
                user.setStatus(UserStatus.ACTIVE);
                user.setApproved(true);
            }
            
            userRepo.save(user);
            
            return ResponseEntity.ok(Map.of(
                "message", "User status updated successfully",
                "user", Map.of(
                    "id", user.getId(),
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "role", user.getRole(),
                    "status", user.getStatus()
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 6) Update user role
    @PostMapping("/users/{id}/change-role")
    public ResponseEntity<?> changeUserRole(@PathVariable Long id, @RequestBody Map<String, String> request) {
        try {
            User user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            String roleStr = request.get("role");
            if (roleStr == null || roleStr.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Role is required"));
            }
            
            Role newRole;
            try {
                newRole = Role.valueOf(roleStr.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid role: " + roleStr));
            }
            
            user.setRole(newRole);
            userRepo.save(user);
            
            return ResponseEntity.ok(Map.of(
                "message", "User role updated successfully",
                "user", Map.of(
                    "id", user.getId(),
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "role", user.getRole(),
                    "status", user.getStatus()
                )
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // 7) Update user details (name, email, role, status)
    @PutMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> updates) {
        try {
            User user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Update name if provided
            if (updates.containsKey("name")) {
                String name = (String) updates.get("name");
                if (name != null && !name.trim().isEmpty()) {
                    user.setName(name.trim());
                }
            }
            
            // Update email if provided
            if (updates.containsKey("email")) {
                String email = (String) updates.get("email");
                if (email != null && !email.trim().isEmpty()) {
                    // Check if email is already in use by another user
                    userRepo.findByEmail(email.trim().toLowerCase())
                        .filter(existingUser -> !existingUser.getId().equals(user.getId()))
                        .ifPresent(existingUser -> {
                            throw new RuntimeException("Email already in use by another user");
                        });
                    user.setEmail(email.trim().toLowerCase());
                }
            }
            
            // Update role if provided
            if (updates.containsKey("role")) {
                String roleStr = (String) updates.get("role");
                if (roleStr != null && !roleStr.trim().isEmpty()) {
                    try {
                        Role newRole = Role.valueOf(roleStr.toUpperCase());
                        user.setRole(newRole);
                    } catch (IllegalArgumentException e) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Invalid role: " + roleStr));
                    }
                }
            }
            
            // Update status if provided
            if (updates.containsKey("status")) {
                String statusStr = (String) updates.get("status");
                if (statusStr != null && !statusStr.trim().isEmpty()) {
                    try {
                        UserStatus newStatus = UserStatus.valueOf(statusStr.toUpperCase());
                        user.setStatus(newStatus);
                        // Update isApproved based on status
                        user.setApproved(newStatus == UserStatus.ACTIVE);
                    } catch (IllegalArgumentException e) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Invalid status: " + statusStr));
                    }
                }
            }
            
            userRepo.save(user);
            
            return ResponseEntity.ok(Map.of(
                "message", "User updated successfully",
                "user", Map.of(
                    "id", user.getId(),
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "role", user.getRole(),
                    "status", user.getStatus()
                )
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Error updating user: " + e.getMessage()));
        }
    }
}
