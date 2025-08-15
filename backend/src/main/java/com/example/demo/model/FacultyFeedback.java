package com.example.demo.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "faculty_feedback")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class FacultyFeedback {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "student_id", nullable = false)
    private Long studentId;
    
    @Column(name = "teacher_id", nullable = false)
    private Long teacherId;
    
    @Column(name = "course_id", nullable = false)
    private Long courseId;
    
    @Column(name = "teaching_quality", nullable = false)
    private Integer teachingQuality; // 1-5 rating
    
    @Column(name = "course_content", nullable = false)
    private Integer courseContent; // 1-5 rating
    
    @Column(name = "responsiveness", nullable = false)
    private Integer responsiveness; // 1-5 rating
    
    @Column(name = "overall_satisfaction", nullable = false)
    private Integer overallSatisfaction; // 1-5 rating
    
    @Column(name = "comments", columnDefinition = "TEXT")
    private String comments;
    
    @Column(name = "is_anonymous", nullable = false)
    private Boolean isAnonymous = true;
    
    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Relationships for easy access
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", insertable = false, updatable = false)
    private User student;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id", insertable = false, updatable = false)
    private User teacher;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", insertable = false, updatable = false)
    private Course course;
    
    @PrePersist
    protected void onCreate() {
        submittedAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Validation method to ensure ratings are within valid range
    public boolean isValidRating(Integer rating) {
        return rating != null && rating >= 1 && rating <= 5;
    }
    
    // Calculate average rating
    public Double getAverageRating() {
        if (teachingQuality == null || courseContent == null || responsiveness == null || overallSatisfaction == null) {
            return null;
        }
        return (teachingQuality + courseContent + responsiveness + overallSatisfaction) / 4.0;
    }
}
