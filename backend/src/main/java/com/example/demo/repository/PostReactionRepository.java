package com.example.demo.repository;

import com.example.demo.model.DiscussionPost;
import com.example.demo.model.PostReaction;
import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PostReactionRepository extends JpaRepository<PostReaction, Long> {
    
    // Find reaction by post and user
    Optional<PostReaction> findByPostAndUser(DiscussionPost post, User user);
    
    // Check if user has reacted to a post
    boolean existsByPostAndUser(DiscussionPost post, User user);
    
    // Find all reactions for a post
    List<PostReaction> findByPost(DiscussionPost post);
    
    // Count reactions by type for a post
    @Query("SELECT pr.reactionType, COUNT(pr) FROM PostReaction pr WHERE pr.post.id = :postId GROUP BY pr.reactionType")
    List<Object[]> countReactionsByType(@Param("postId") Long postId);
    
    // Count total reactions for a post
    long countByPost(DiscussionPost post);
    
    // Count specific reaction type for a post
    long countByPostAndReactionType(DiscussionPost post, PostReaction.ReactionType reactionType);
}
