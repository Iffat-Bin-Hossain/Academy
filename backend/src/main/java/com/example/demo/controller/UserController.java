package com.example.demo.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

@RestController
@RequestMapping("/api/user")
public class UserController {

    // Example of authenticated route
    @GetMapping("/me")
    public String whoAmI(@AuthenticationPrincipal String email) {
        return "Hello, " + email;
    }
}
