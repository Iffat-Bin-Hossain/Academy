package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient; // User who will receive the notification

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private NotificationType type;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "message", nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(name = "redirect_url")
    private String redirectUrl; // URL to redirect when notification is clicked

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_course_id")
    private Course relatedCourse; // Optional: Course related to notification

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_assignment_id")
    private Assignment relatedAssignment; // Optional: Assignment related to notification

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_resource_id")
    private Resource relatedResource; // Optional: Resource related to notification

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_user_id")
    private User relatedUser; // Optional: User related to notification (e.g., student who submitted)

    @Column(name = "related_thread_id")
    private Long relatedThreadId; // Optional: Discussion thread ID

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    // Enum for notification types
    public enum NotificationType {
        // Admin notifications
        NEW_SIGNUP_REQUEST,
        
        // Teacher notifications
        TEACHER_COURSE_ASSIGNMENT,
        TEACHER_COURSE_REMOVAL,
        TEACHER_COURSE_REPLACEMENT,
        STUDENT_ENROLLMENT_REQUEST,
        ASSIGNMENT_SUBMISSION,
        DISCUSSION_POST,
        FACULTY_FEEDBACK,
        
        // Student notifications
        ENROLLMENT_APPROVED,
        ENROLLMENT_REJECTED,
        NEW_ASSIGNMENT,
        NEW_RESOURCE,
        ASSIGNMENT_UPDATED,
        RESOURCE_UPDATED,
        NEW_DISCUSSION_THREAD,
        NEW_COURSE_CREATED,
        DISCUSSION_REPLY,
        DISCUSSION_POST_REACTION,
        DISCUSSION_TAG,
        ASSIGNMENT_GRADED,
        
        // General notifications
        COURSE_ANNOUNCEMENT,
        SYSTEM_NOTIFICATION,
        ACCOUNT_APPROVED,
        ACCOUNT_REJECTED,
        
        // User profile update notifications
        USER_PROFILE_UPDATED,
        USER_STATUS_CHANGED,
        USER_ROLE_CHANGED
    }
}
