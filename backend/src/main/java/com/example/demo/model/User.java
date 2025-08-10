package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @Column(unique = true)
    private String email;

    private String password;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private UserStatus status = UserStatus.PENDING;

    // Keeping for backward compatibility during migration
    private boolean isApproved;

    // Common profile fields for all users
    private String username; // Added for profile display
    private String phone;
    private String altEmail;
    private String timezone;
    
    @Column(columnDefinition = "TEXT")
    private String bio;
    
    private String profilePhotoUrl;
    
    // Teacher-specific fields
    private String officeRoom;
    
    @Column(columnDefinition = "TEXT")
    private String researchInterests;
    
    private String personalWebsite;
    private String scholarProfileUrl;
    
    // Student-specific fields
    private String program;
    private String major;
    private String yearSemester;
    private String advisor;
    private String clubsActivities;
    private Double gpa;
    private Integer retakeCount;
    
    // Admin-specific fields (since admin can edit all common fields, we add admin-specific ones)
    private String department;
    private String accessLevel;
    
    @Column(columnDefinition = "TEXT")
    private String adminNotes;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
