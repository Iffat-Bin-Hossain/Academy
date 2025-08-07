package com.example.demo.repository;

import com.example.demo.model.Resource;
import com.example.demo.model.Course;
import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ResourceRepository extends JpaRepository<Resource, Long> {
    
    // Find resources by course
    List<Resource> findByCourseAndIsActiveTrueOrderByCreatedAtDesc(Course course);
    
    // Find visible resources by course (for students)
    @Query("SELECT r FROM Resource r WHERE r.course = :course AND r.isActive = true AND r.isVisible = true " +
           "AND (r.visibleFrom IS NULL OR r.visibleFrom <= :now) " +
           "AND (r.visibleUntil IS NULL OR r.visibleUntil > :now) " +
           "ORDER BY r.createdAt DESC")
    List<Resource> findVisibleResourcesByCourse(@Param("course") Course course, @Param("now") LocalDateTime now);
    
    // Find resources by course and topic
    List<Resource> findByCourseAndTopicAndIsActiveTrueOrderByCreatedAtDesc(Course course, String topic);
    
    // Find resources by course and week
    List<Resource> findByCourseAndWeekAndIsActiveTrueOrderByCreatedAtDesc(Course course, String week);
    
    // Find resources by course and type
    List<Resource> findByCourseAndResourceTypeAndIsActiveTrueOrderByCreatedAtDesc(Course course, Resource.ResourceType resourceType);
    
    // Find resources by uploader
    List<Resource> findByUploadedByAndIsActiveTrueOrderByCreatedAtDesc(User uploadedBy);
    
    // Search resources by title or description
    @Query("SELECT r FROM Resource r WHERE r.course = :course AND r.isActive = true " +
           "AND (LOWER(r.title) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(r.description) LIKE LOWER(CONCAT('%', :searchTerm, '%')) " +
           "OR LOWER(r.tags) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "ORDER BY r.createdAt DESC")
    List<Resource> searchResourcesInCourse(@Param("course") Course course, @Param("searchTerm") String searchTerm);
    
    // Get resource statistics for a course
    @Query("SELECT COUNT(r) FROM Resource r WHERE r.course = :course AND r.isActive = true")
    long countByCourseAndIsActiveTrue(@Param("course") Course course);
    
    // Get resources with analytics (most viewed/downloaded)
    @Query("SELECT r FROM Resource r WHERE r.course = :course AND r.isActive = true " +
           "ORDER BY r.viewCount DESC")
    List<Resource> findMostViewedResourcesByCourse(@Param("course") Course course);
    
    @Query("SELECT r FROM Resource r WHERE r.course = :course AND r.isActive = true " +
           "ORDER BY r.downloadCount DESC")
    List<Resource> findMostDownloadedResourcesByCourse(@Param("course") Course course);
    
    // Find resources by multiple filters
    @Query("SELECT r FROM Resource r WHERE r.course = :course AND r.isActive = true " +
           "AND (:topic IS NULL OR r.topic = :topic) " +
           "AND (:week IS NULL OR r.week = :week) " +
           "AND (:resourceType IS NULL OR r.resourceType = :resourceType) " +
           "ORDER BY r.createdAt DESC")
    List<Resource> findResourcesByFilters(@Param("course") Course course, 
                                        @Param("topic") String topic,
                                        @Param("week") String week,
                                        @Param("resourceType") Resource.ResourceType resourceType);
    
    // Get distinct topics for a course
    @Query("SELECT DISTINCT r.topic FROM Resource r WHERE r.course = :course AND r.isActive = true AND r.topic IS NOT NULL ORDER BY r.topic")
    List<String> findDistinctTopicsByCourse(@Param("course") Course course);
    
    // Get distinct weeks for a course
    @Query("SELECT DISTINCT r.week FROM Resource r WHERE r.course = :course AND r.isActive = true AND r.week IS NOT NULL ORDER BY r.week")
    List<String> findDistinctWeeksByCourse(@Param("course") Course course);
    
    // Find resources that are scheduled to become visible
    @Query("SELECT r FROM Resource r WHERE r.isActive = true AND r.isVisible = true " +
           "AND r.visibleFrom IS NOT NULL AND r.visibleFrom <= :now " +
           "AND (r.visibleUntil IS NULL OR r.visibleUntil > :now)")
    List<Resource> findScheduledVisibleResources(@Param("now") LocalDateTime now);
}
