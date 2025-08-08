package com.example.demo.repository;

import com.example.demo.model.Course;
import com.example.demo.model.DiscussionThread;
import com.example.demo.model.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiscussionThreadRepository extends JpaRepository<DiscussionThread, Long> {
    
    // Find all active threads for a course
    @Query("SELECT dt FROM DiscussionThread dt WHERE dt.course.id = :courseId AND dt.isActive = true ORDER BY dt.isPinned DESC, dt.updatedAt DESC")
    List<DiscussionThread> findByCourseIdAndIsActiveTrueOrderByPinnedAndUpdated(@Param("courseId") Long courseId);
    
    // Find threads by course
    List<DiscussionThread> findByCourseAndIsActiveTrueOrderByIsPinnedDescUpdatedAtDesc(Course course);
    
    // Find threads by assignment
    List<DiscussionThread> findByAssignmentAndIsActiveTrueOrderByIsPinnedDescUpdatedAtDesc(Assignment assignment);
    
    // Find threads created by a specific teacher
    @Query("SELECT dt FROM DiscussionThread dt WHERE dt.createdBy.id = :teacherId AND dt.isActive = true ORDER BY dt.updatedAt DESC")
    List<DiscussionThread> findByCreatedByIdAndIsActiveTrueOrderByUpdatedAtDesc(@Param("teacherId") Long teacherId);
    
    // Count threads for a course
    long countByCourseAndIsActiveTrue(Course course);
    
    // Search threads by title or description
    @Query("SELECT dt FROM DiscussionThread dt WHERE dt.course.id = :courseId AND dt.isActive = true " +
           "AND (LOWER(dt.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(dt.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "ORDER BY dt.isPinned DESC, dt.updatedAt DESC")
    List<DiscussionThread> searchThreadsInCourse(@Param("courseId") Long courseId, @Param("searchTerm") String searchTerm);
    
    // For course deletion - find all discussion threads by course (active and inactive)
    List<DiscussionThread> findByCourse(Course course);
}
