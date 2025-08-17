package com.example.demo.controller;

import com.example.demo.model.*;
import com.example.demo.service.AuthService;
import com.example.demo.service.UserService;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final AuthService authService;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest request) {
        try {
            String result = userService.signup(request);
            return ResponseEntity.ok(Map.of("message", result));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(Map.of("error", ex.getMessage()));
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        System.out.println("Login attempt with username: ");
        try {
            String token = authService.login(req);
            return ResponseEntity.ok(new LoginResponse(token));
        } catch (ResponseStatusException ex) {
            return ResponseEntity
                .status(ex.getStatusCode())
                .body(Map.of("error", ex.getReason()));
        }
    }
}
