package com.example.demo.repository;

import com.example.demo.model.DiscussionPost;
import com.example.demo.model.DiscussionThread;
import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiscussionPostRepository extends JpaRepository<DiscussionPost, Long> {
    
    // Find all posts in a thread (top-level posts only)
    List<DiscussionPost> findByThreadAndParentPostIsNullAndIsDeletedFalseOrderByCreatedAtAsc(DiscussionThread thread);
    
    // Find all posts in a thread including replies
    List<DiscussionPost> findByThreadAndIsDeletedFalseOrderByCreatedAtAsc(DiscussionThread thread);
    
    // Find replies to a specific post
    List<DiscussionPost> findByParentPostAndIsDeletedFalseOrderByCreatedAtAsc(DiscussionPost parentPost);
    
    // Count posts in a thread
    long countByThreadAndIsDeletedFalse(DiscussionThread thread);
    
    // Find posts by author
    List<DiscussionPost> findByAuthorAndIsDeletedFalseOrderByCreatedAtDesc(User author);
    
    // Get latest post in a thread for last activity
    @Query("SELECT dp FROM DiscussionPost dp WHERE dp.thread.id = :threadId AND dp.isDeleted = false ORDER BY dp.createdAt DESC")
    List<DiscussionPost> findLatestPostInThread(@Param("threadId") Long threadId);
}
