package com.example.demo.repository;

import com.example.demo.model.MessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MessageReactionRepository extends JpaRepository<MessageReaction, Long> {
    
    List<MessageReaction> findByMessageId(Long messageId);
    
    Optional<MessageReaction> findByMessageIdAndUserIdAndEmoji(Long messageId, Long userId, String emoji);
    
    @Query("SELECT mr FROM MessageReaction mr WHERE mr.message.id = :messageId")
    List<MessageReaction> findReactionsByMessageId(@Param("messageId") Long messageId);
    
    void deleteByMessageIdAndUserIdAndEmoji(Long messageId, Long userId, String emoji);
}
