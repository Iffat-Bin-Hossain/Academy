package com.example.demo.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    // Basic info (read-only for non-admin)
    private Long id;
    private String name;
    private String username;
    private String email;
    private String role;
    private String status;
    
    // Common editable fields
    private String phone;
    private String altEmail;
    private String timezone;
    private String bio;
    private String profilePhotoUrl;
    
    // Teacher-specific fields
    private String officeRoom;
    private String researchInterests;
    private String personalWebsite;
    private String scholarProfileUrl;
    
    // Student-specific fields (some read-only)
    private String program;
    private String major;
    private String yearSemester;
    private String advisor;
    private String clubsActivities;
    private Double gpa;
    private Integer retakeCount;
    
    // Admin-specific fields
    private String department;
    private String accessLevel;
    private String adminNotes;
    
    // Timestamps
    private String createdAt;
    private String updatedAt;
}
