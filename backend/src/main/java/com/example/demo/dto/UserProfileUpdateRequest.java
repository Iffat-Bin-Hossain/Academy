package com.example.demo.dto;

import lombok.Data;

@Data
public class UserProfileUpdateRequest {
    // Common editable fields (all roles can edit these)
    private String phone;
    private String altEmail;
    private String timezone;
    private String bio;
    private String profilePhotoUrl;
    
    // Teacher-specific editable fields
    private String officeRoom;
    private String researchInterests;
    private String personalWebsite;
    private String scholarProfileUrl;
    
    // Student-specific editable fields
    private String clubsActivities;
    
    // Admin-only fields (for updating student academic info)
    private String program;
    private String major;
    private String yearSemester;
    private String advisor;
    private Double gpa;
    private Integer retakeCount;
    
    // Admin-specific editable fields
    private String department;
    private String accessLevel;
    private String adminNotes;
}
