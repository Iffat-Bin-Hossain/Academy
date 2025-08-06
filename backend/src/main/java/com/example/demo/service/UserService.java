package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final EmailValidationService emailValidationService;

    public String signup(SignupRequest request) {
        // Validate input fields
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Name is required");
        }
        
        if (request.getEmail() == null || request.getEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("Email is required");
        }
        
        if (request.getPassword() == null || request.getPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("Password is required");
        }
        
        if (request.getRole() == null) {
            throw new IllegalArgumentException("Role is required");
        }
        
        // Validate email format and existence
        EmailValidationService.EmailValidationResult emailValidation = 
            emailValidationService.validateEmail(request.getEmail().trim());
        
        if (!emailValidation.isValid()) {
            throw new IllegalArgumentException(emailValidation.getMessage());
        }
        
        // Validate password length
        if (request.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters long");
        }
        
        // Check if email already exists
        if (userRepo.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email already in use!");
        }

        // Check if trying to signup as ADMIN
        if (request.getRole() == Role.ADMIN) {
            throw new IllegalArgumentException("You cannot sign up as ADMIN.");
        }

        // Create user with PENDING status (waiting for admin approval)
        User user = User.builder()
                .name(request.getName().trim())
                .email(request.getEmail().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .status(UserStatus.PENDING) // Set to PENDING - user needs admin approval
                .isApproved(false) // Keep for backward compatibility
                .build();

        userRepo.save(user);
        
        // Send welcome email
        emailService.sendWelcomeEmail(user.getEmail(), user.getName());
        
        return "Signup successful! Please wait for admin approval. You will be notified via email once approved.";
    }
}
