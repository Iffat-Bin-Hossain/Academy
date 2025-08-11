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

import java.util.ArrayList;
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
        List<User> pendingUsers = userRepo.findByStatusOrderByCreatedAtDesc(UserStatus.PENDING);
        logger.info("Found {} pending users", pendingUsers.size());
        pendingUsers.forEach(user -> logger.info("User: {}, Status: {}", user.getName(), user.getStatus()));
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

    // 3) Reject a user by ID (mark as rejected instead of deleting)
    @PostMapping("/reject/{id}")
    public ResponseEntity<?> reject(@PathVariable Long id) {
        try {
            User user = userRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
            
            // Check if user is already approved
            if (user.isApproved()) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Cannot reject a user that has already been approved"
                ));
            }
            
            // Mark user as rejected instead of deleting
            user.setApproved(false);
            user.setStatus(UserStatus.REJECTED);
            userRepo.save(user);
            
            // Send rejection notification email
            try {
                emailService.sendRejectionNotification(user.getEmail(), user.getName());
            } catch (Exception emailError) {
                // Log email error but don't fail the rejection
                logger.warn("Failed to send rejection email to {}: {}", user.getEmail(), emailError.getMessage());
            }
            
                        // Create in-app notification for the user
            try {
                notificationService.createAccountApprovalNotification(user, false);
            } catch (Exception notificationError) {
                // Log notification error but don't fail the rejection
                logger.warn("Failed to create rejection notification for {}: {}", user.getEmail(), notificationError.getMessage());
            }
            
            return ResponseEntity.ok(Map.of(
                "message", "User request rejected successfully",
                "user", Map.of(
                    "id", user.getId(),
                    "name", user.getName(),
                    "email", user.getEmail(),
                    "role", user.getRole(),
                    "status", user.getStatus()
                )
            ));
        } catch (Exception e) {
            logger.error("Error rejecting user with ID {}: {}", id, e.getMessage());
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
            
            // Protect rejected users - they cannot be modified
            if (user.getStatus() == UserStatus.REJECTED) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Rejected users cannot be modified. No operations are allowed."
                ));
            }
            
            // Store original status for notification
            UserStatus originalStatus = user.getStatus();
            
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
            
            // Create status change notification
            try {
                notificationService.createUserStatusChangeNotification(user, originalStatus, user.getStatus());
            } catch (Exception notificationError) {
                // Log notification error but don't fail the status update
                logger.warn("Failed to create status change notification for {}: {}", user.getEmail(), notificationError.getMessage());
            }
            
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
            
            // Protect rejected users - they cannot be modified
            if (user.getStatus() == UserStatus.REJECTED) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Rejected users cannot be modified. No operations are allowed."
                ));
            }
            
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
            
            // Store original role for notification
            Role originalRole = user.getRole();
            
            // Only update if role actually changed
            if (originalRole != newRole) {
                user.setRole(newRole);
                userRepo.save(user);
                
                // Create role change notification
                try {
                    notificationService.createUserRoleChangeNotification(user, originalRole, newRole);
                } catch (Exception notificationError) {
                    // Log notification error but don't fail the role update
                    logger.warn("Failed to create role change notification for {}: {}", user.getEmail(), notificationError.getMessage());
                }
            }
            
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
            
            // Protect rejected users - they cannot be modified
            if (user.getStatus() == UserStatus.REJECTED) {
                return ResponseEntity.badRequest().body(Map.of(
                    "error", "Rejected users cannot be modified. No operations are allowed."
                ));
            }
            
            // Store original values for notification purposes
            String originalName = user.getName();
            String originalEmail = user.getEmail();
            Role originalRole = user.getRole();
            UserStatus originalStatus = user.getStatus();
            
            // Track what changes were made
            List<String> changes = new ArrayList<>();
            boolean hasChanges = false;
            
            // Update name if provided
            if (updates.containsKey("name")) {
                String name = (String) updates.get("name");
                if (name != null && !name.trim().isEmpty() && !name.trim().equals(originalName)) {
                    user.setName(name.trim());
                    changes.add("name");
                    hasChanges = true;
                }
            }
            
            // Update email if provided
            if (updates.containsKey("email")) {
                String email = (String) updates.get("email");
                if (email != null && !email.trim().isEmpty() && !email.trim().toLowerCase().equals(originalEmail)) {
                    // Check if email is already in use by another user
                    userRepo.findByEmail(email.trim().toLowerCase())
                        .filter(existingUser -> !existingUser.getId().equals(user.getId()))
                        .ifPresent(existingUser -> {
                            throw new RuntimeException("Email already in use by another user");
                        });
                    user.setEmail(email.trim().toLowerCase());
                    changes.add("email");
                    hasChanges = true;
                }
            }
            
            // Update role if provided
            if (updates.containsKey("role")) {
                String roleStr = (String) updates.get("role");
                if (roleStr != null && !roleStr.trim().isEmpty()) {
                    try {
                        Role newRole = Role.valueOf(roleStr.toUpperCase());
                        if (newRole != originalRole) {
                            user.setRole(newRole);
                            changes.add("role");
                            hasChanges = true;
                        }
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
                        if (newStatus != originalStatus) {
                            user.setStatus(newStatus);
                            // Update isApproved based on status
                            user.setApproved(newStatus == UserStatus.ACTIVE);
                            changes.add("status");
                            hasChanges = true;
                        }
                    } catch (IllegalArgumentException e) {
                        return ResponseEntity.badRequest().body(Map.of("error", "Invalid status: " + statusStr));
                    }
                }
            }
            
            if (hasChanges) {
                userRepo.save(user);
                
                // Create appropriate notifications based on what changed
                try {
                    // General profile update notification if name or email changed
                    if ((changes.contains("name") || changes.contains("email")) && !changes.contains("role") && !changes.contains("status")) {
                        String changeDetails = String.join(", ", changes);
                        notificationService.createUserProfileUpdateNotification(user, changeDetails);
                    }
                    
                    // Role change notification
                    if (changes.contains("role")) {
                        notificationService.createUserRoleChangeNotification(user, originalRole, user.getRole());
                    }
                    
                    // Status change notification
                    if (changes.contains("status")) {
                        notificationService.createUserStatusChangeNotification(user, originalStatus, user.getStatus());
                    }
                } catch (Exception notificationError) {
                    // Log notification error but don't fail the update
                    logger.warn("Failed to create user update notification for {}: {}", user.getEmail(), notificationError.getMessage());
                }
            }
            
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

    // Bulk approve users
    @PostMapping("/bulk-approve")
    public ResponseEntity<?> bulkApprove(@RequestBody Map<String, List<Long>> request) {
        try {
            List<Long> userIds = request.get("userIds");
            if (userIds == null || userIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No user IDs provided"));
            }

            List<String> successfulUsers = new ArrayList<>();
            List<String> failedUsers = new ArrayList<>();

            for (Long userId : userIds) {
                try {
                    User user = userRepo.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found"));
                    
                    // Skip rejected users entirely - they should not be processed
                    if (user.getStatus() == UserStatus.REJECTED) {
                        failedUsers.add(user.getName() + " (rejected users cannot be modified)");
                        continue;
                    }
                    
                    // Skip already approved users
                    if (user.isApproved()) {
                        failedUsers.add(user.getName() + " (already approved)");
                        continue;
                    }
                    
                    user.setApproved(true);
                    user.setStatus(UserStatus.ACTIVE);
                    userRepo.save(user);
                    successfulUsers.add(user.getName());

                    // Send approval notification email
                    try {
                        emailService.sendApprovalNotification(user.getEmail(), user.getName());
                    } catch (Exception emailError) {
                        logger.warn("Failed to send approval email to {}: {}", user.getEmail(), emailError.getMessage());
                    }

                    // Send notification to user
                    try {
                        notificationService.createNotification(
                            user.getId(),
                            com.example.demo.model.Notification.NotificationType.ACCOUNT_APPROVED,
                            "Account Approved",
                            "Congratulations! Your Academy account has been approved. You can now access all features.",
                            "/dashboard",
                            null, null, null, null
                        );
                    } catch (Exception notificationError) {
                        logger.warn("Failed to create approval notification for user {}: {}", user.getId(), notificationError.getMessage());
                    }

                } catch (Exception e) {
                    failedUsers.add("User ID " + userId + " (" + e.getMessage() + ")");
                }
            }

            String message = String.format("Bulk approval completed. %d successful, %d failed.", 
                successfulUsers.size(), failedUsers.size());

            return ResponseEntity.ok(Map.of(
                "message", message,
                "successful", successfulUsers,
                "failed", failedUsers,
                "successCount", successfulUsers.size(),
                "failedCount", failedUsers.size()
            ));

        } catch (Exception e) {
            logger.error("Error in bulk approve: ", e);
            return ResponseEntity.badRequest().body(Map.of("error", "Error processing bulk approval: " + e.getMessage()));
        }
    }

    // Bulk reject users
    @PostMapping("/bulk-reject")
    public ResponseEntity<?> bulkReject(@RequestBody Map<String, List<Long>> request) {
        try {
            List<Long> userIds = request.get("userIds");
            if (userIds == null || userIds.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "No user IDs provided"));
            }

            List<String> successfulUsers = new ArrayList<>();
            List<String> failedUsers = new ArrayList<>();

            for (Long userId : userIds) {
                try {
                    User user = userRepo.findById(userId)
                        .orElseThrow(() -> new RuntimeException("User not found"));
                    
                    // Skip already rejected users entirely - they should not be processed
                    if (user.getStatus() == UserStatus.REJECTED) {
                        failedUsers.add(user.getName() + " (already rejected - cannot be modified)");
                        continue;
                    }
                    
                    // Skip already approved users
                    if (user.isApproved()) {
                        failedUsers.add(user.getName() + " (already approved)");
                        continue;
                    }
                    
                    user.setApproved(false);
                    user.setStatus(UserStatus.REJECTED);
                    userRepo.save(user);
                    successfulUsers.add(user.getName());

                    // Send rejection notification email
                    try {
                        emailService.sendRejectionNotification(user.getEmail(), user.getName());
                    } catch (Exception emailError) {
                        logger.warn("Failed to send rejection email to {}: {}", user.getEmail(), emailError.getMessage());
                    }

                    // Send notification to user
                    try {
                        notificationService.createNotification(
                            user.getId(),
                            com.example.demo.model.Notification.NotificationType.ACCOUNT_REJECTED,
                            "Account Rejected",
                            "We're sorry, but your Academy account application has been rejected. Please contact support for more information.",
                            "/contact",
                            null, null, null, null
                        );
                    } catch (Exception notificationError) {
                        logger.warn("Failed to create rejection notification for user {}: {}", user.getId(), notificationError.getMessage());
                    }

                } catch (Exception e) {
                    failedUsers.add("User ID " + userId + " (" + e.getMessage() + ")");
                }
            }

            String message = String.format("Bulk rejection completed. %d successful, %d failed.", 
                successfulUsers.size(), failedUsers.size());

            return ResponseEntity.ok(Map.of(
                "message", message,
                "successful", successfulUsers,
                "failed", failedUsers,
                "successCount", successfulUsers.size(),
                "failedCount", failedUsers.size()
            ));

        } catch (Exception e) {
            logger.error("Error in bulk reject: ", e);
            return ResponseEntity.badRequest().body(Map.of("error", "Error processing bulk rejection: " + e.getMessage()));
        }
    }
}
