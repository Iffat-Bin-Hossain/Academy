package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "course_teachers")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseTeacher {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;
    
    @ManyToOne
    @JoinColumn(name = "teacher_id", nullable = false)
    private User teacher;
    
    @CreationTimestamp
    @Column(name = "assigned_at", updatable = false)
    private LocalDateTime assignedAt;
    
    @Column(name = "teacher_role")
    @Builder.Default
    private String role = "TEACHER"; // "PRIMARY", "ASSISTANT", "GUEST", "TEACHER"
    
    @Column(name = "is_active")
    @Builder.Default
    private boolean active = true;
    
    // Unique constraint to prevent duplicate assignments
    @Table(uniqueConstraints = {
        @UniqueConstraint(columnNames = {"course_id", "teacher_id"})
    })
    public static class TableConstraints {}
}
