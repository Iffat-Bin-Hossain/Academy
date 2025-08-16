package com.example.demo.repository;

import com.example.demo.model.Message;
import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MessageRepository extends JpaRepository<Message, Long> {
    
    // Get all messages for a user (both sent and received)
    @Query("SELECT m FROM Message m WHERE m.recipient = :user OR m.sender = :user ORDER BY m.createdAt DESC")
    List<Message> findAllMessagesForUser(@Param("user") User user);
    
    // Get received messages for a user
    List<Message> findByRecipientOrderByCreatedAtDesc(User recipient);
    
    // Get sent messages for a user
    List<Message> findBySenderOrderByCreatedAtDesc(User sender);
    
    // Get unread messages count for a user
    @Query("SELECT COUNT(m) FROM Message m WHERE m.recipient = :user AND m.isRead = false")
    Long countUnreadMessagesForUser(@Param("user") User user);
    
    // Get conversation between two users
    @Query("SELECT m FROM Message m WHERE " +
           "(m.sender = :user1 AND m.recipient = :user2) OR " +
           "(m.sender = :user2 AND m.recipient = :user1) " +
           "ORDER BY m.createdAt ASC")
    List<Message> findConversationBetweenUsers(@Param("user1") User user1, @Param("user2") User user2);
    
    // Get unique conversations for a user
    @Query("SELECT DISTINCT " +
           "CASE WHEN m.sender = :user THEN m.recipient ELSE m.sender END " +
           "FROM Message m WHERE m.sender = :user OR m.recipient = :user")
    List<User> findUniqueConversationPartnersForUser(@Param("user") User user);
    
    // Get unread messages from a specific sender to a recipient
    List<Message> findBySenderAndRecipientAndIsReadFalse(User sender, User recipient);
    
    // Get all unread messages for a recipient
    List<Message> findByRecipientAndIsReadFalse(User recipient);
    
    // Count unread messages from a specific sender to a recipient
    @Query("SELECT COUNT(m) FROM Message m WHERE m.sender = :sender AND m.recipient = :recipient AND m.isRead = false")
    Long countUnreadMessagesFromSender(@Param("sender") User sender, @Param("recipient") User recipient);
    
    // Find messages related to a specific course
    List<Message> findByRelatedCourse(com.example.demo.model.Course course);
}
