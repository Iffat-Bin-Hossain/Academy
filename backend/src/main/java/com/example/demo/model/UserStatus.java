package com.example.demo.model;

public enum UserStatus {
    PENDING,    // User registered but waiting for admin approval
    ACTIVE,     // User is approved and can use the system
    DISABLED,   // User is disabled by admin and cannot login
    REJECTED    // User registration was rejected by admin
}
