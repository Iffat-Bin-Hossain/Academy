package com.example.demo.repository;

import com.example.demo.model.Assignment;
import com.example.demo.model.Course;
import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    
    // Find all assignments for a specific course
    List<Assignment> findByCourseOrderByCreatedAtDesc(Course course);
    
    // Find all active assignments for a specific course
    List<Assignment> findByCourseAndIsActiveTrueOrderByCreatedAtDesc(Course course);
    
    // Find all assignments created by a specific teacher
    List<Assignment> findByCreatedByOrderByCreatedAtDesc(User teacher);
    
    // Find all active assignments created by a specific teacher
    List<Assignment> findByCreatedByAndIsActiveTrueOrderByCreatedAtDesc(User teacher);
    
    // Find assignments for a course created by a specific teacher
    List<Assignment> findByCourseAndCreatedByOrderByCreatedAtDesc(Course course, User teacher);
    
    // Find overdue assignments
    @Query("SELECT a FROM Assignment a WHERE a.deadline < :currentTime AND a.isActive = true")
    List<Assignment> findOverdueAssignments(@Param("currentTime") LocalDateTime currentTime);
    
    // Find assignments with upcoming deadlines (within next 24 hours)
    @Query("SELECT a FROM Assignment a WHERE a.deadline BETWEEN :currentTime AND :futureTime AND a.isActive = true")
    List<Assignment> findUpcomingDeadlines(@Param("currentTime") LocalDateTime currentTime, 
                                          @Param("futureTime") LocalDateTime futureTime);
    
    // Find overdue assignments by teacher
    @Query("SELECT a FROM Assignment a WHERE a.deadline < :currentTime AND a.isActive = true AND a.createdBy.id = :teacherId")
    List<Assignment> findOverdueAssignmentsByTeacher(@Param("currentTime") LocalDateTime currentTime, 
                                                    @Param("teacherId") Long teacherId);
    
    // Find upcoming assignments by teacher (within next 24 hours)
    @Query("SELECT a FROM Assignment a WHERE a.deadline BETWEEN :currentTime AND :futureTime AND a.isActive = true AND a.createdBy.id = :teacherId")
    List<Assignment> findUpcomingDeadlinesByTeacher(@Param("currentTime") LocalDateTime currentTime, 
                                                   @Param("futureTime") LocalDateTime futureTime,
                                                   @Param("teacherId") Long teacherId);
    
    // Count active assignments for a course
    long countByCourseAndIsActiveTrue(Course course);
    
    // Count active assignments created by a teacher
    long countByCreatedByAndIsActiveTrue(User teacher);
    
    // Find assignments by course ID
    @Query("SELECT a FROM Assignment a WHERE a.course.id = :courseId ORDER BY a.createdAt DESC")
    List<Assignment> findByCourseId(@Param("courseId") Long courseId);
    
    // Find active assignments by course ID
    @Query("SELECT a FROM Assignment a WHERE a.course.id = :courseId AND a.isActive = true ORDER BY a.createdAt DESC")
    List<Assignment> findActiveByCourseId(@Param("courseId") Long courseId);
    
    // Check if assignment exists and teacher has permission to modify it
    @Query("SELECT a FROM Assignment a WHERE a.id = :assignmentId AND a.createdBy.id = :teacherId")
    Optional<Assignment> findByIdAndCreatedById(@Param("assignmentId") Long assignmentId, 
                                               @Param("teacherId") Long teacherId);

    // Find active assignments for course by courseId and created by teacherId, ordered by deadline
    @Query("SELECT a FROM Assignment a WHERE a.course.id = :courseId AND a.createdBy.id = :teacherId AND a.isActive = true ORDER BY a.deadline ASC")
    List<Assignment> findByCourseIdAndCreatedByIdOrderByDeadlineAsc(@Param("courseId") Long courseId, 
                                                                   @Param("teacherId") Long teacherId);
}
