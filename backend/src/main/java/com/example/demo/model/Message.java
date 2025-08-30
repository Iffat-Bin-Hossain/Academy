package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sender_id", nullable = false)
    private User sender;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @Column(name = "subject", nullable = false)
    private String subject;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_read", nullable = false)
    @Builder.Default
    private Boolean isRead = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "related_course_id")
    private Course relatedCourse; // Optional: Course related to message

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false)
    @Builder.Default
    private MessageType messageType = MessageType.DIRECT;

    // File attachment fields
    @Column(name = "attachment_url")
    private String attachmentUrl;

    @Column(name = "attachment_filename")
    private String attachmentFilename;

    @Column(name = "attachment_size")
    private Long attachmentSize;

    @Column(name = "attachment_content_type")
    private String attachmentContentType;

    // Reply functionality fields
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reply_to_message_id")
    private Message replyToMessage;

    @Column(name = "reply_to_content")
    private String replyToContent;

    @Column(name = "reply_to_sender_name")
    private String replyToSenderName;

    // Forwarding functionality field
    @Column(name = "is_forwarded")
    @Builder.Default
    private Boolean isForwarded = false;

    // Enum for message types
    public enum MessageType {
        DIRECT, // Direct message between users
        COURSE_RELATED, // Message related to a specific course
        SYSTEM, // System generated message
        ANNOUNCEMENT // Announcement from admin/teacher
    }
}
