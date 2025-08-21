package com.example.demo.repository;

import com.example.demo.model.Notification;
import com.example.demo.model.Notification.NotificationType;
import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // Find all notifications for a user, ordered by creation date (newest first)
    List<Notification> findByRecipientOrderByCreatedAtDesc(User recipient);
    
    // Find unread notifications for a user
    List<Notification> findByRecipientAndIsReadFalseOrderByCreatedAtDesc(User recipient);
    
    // Count unread notifications for a user
    long countByRecipientAndIsReadFalse(User recipient);
    
    // Find recent notifications (last 30 days) for a user
    @Query("SELECT n FROM Notification n WHERE n.recipient = :recipient AND n.createdAt >= :since ORDER BY n.createdAt DESC")
    List<Notification> findRecentNotifications(@Param("recipient") User recipient, @Param("since") java.time.LocalDateTime since);
    
    // Find notifications by type for a user
    List<Notification> findByRecipientAndTypeOrderByCreatedAtDesc(User recipient, Notification.NotificationType type);
    
    // Find notifications for a specific course
    @Query("SELECT n FROM Notification n WHERE n.recipient = :recipient AND n.relatedCourse.id = :courseId ORDER BY n.createdAt DESC")
    List<Notification> findByCourseForUser(@Param("recipient") User recipient, @Param("courseId") Long courseId);
    
    // Find all notifications related to a specific course (for deletion)
    List<Notification> findByRelatedCourse(com.example.demo.model.Course course);
    
    // Check if plagiarism notification already exists for user
    boolean existsByRecipientIdAndTypeAndMessageContaining(Long recipientId, NotificationType type, String messageSubstring);
}
