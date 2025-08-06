package com.example.demo.service;

import com.example.demo.config.JwtUtil;
import com.example.demo.model.*;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepo;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public String login(LoginRequest req) {
        // 1) Find user by email
        User user = userRepo.findByEmail(req.getEmail())
            .orElseThrow(() ->
               new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials")
            );

        // 2) Check password
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        // 3) Check user status
        if (user.getStatus() == UserStatus.DISABLED) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Your account has been disabled by the administrator.");
        }
        
        if (user.getStatus() == UserStatus.PENDING || !user.isApproved()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin approval pending");
        }

        // 4) Generate JWT
        return jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole());
    }
}
