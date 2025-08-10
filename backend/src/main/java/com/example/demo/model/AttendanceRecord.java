package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "attendance_records", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"session_id", "student_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttendanceRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private AttendanceSession session;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private AttendanceStatus status = AttendanceStatus.ABSENT;

    @Column(name = "marked_by_teacher_id")
    private Long markedByTeacherId;

    @Column(name = "teacher_override", nullable = false)
    @Builder.Default
    private Boolean teacherOverride = false;

    @Column(name = "notes")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum AttendanceStatus {
        PRESENT, ABSENT, LATE, EXCUSED
    }

    // Helper methods
    public String getDisplayStatus() {
        return switch (status) {
            case PRESENT -> "P";
            case ABSENT -> "A";
            case LATE -> "L";
            case EXCUSED -> "E";
        };
    }

    public String getStatusColor() {
        return switch (status) {
            case PRESENT -> "#10b981"; // green
            case ABSENT -> "#dc2626";  // red
            case LATE -> "#f59e0b";    // amber
            case EXCUSED -> "#6366f1"; // indigo
        };
    }
}
