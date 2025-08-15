package com.example.demo.repository;

import com.example.demo.model.FacultyFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FacultyFeedbackRepository extends JpaRepository<FacultyFeedback, Long> {
    
    // Find feedback by student for a specific course
    Optional<FacultyFeedback> findByStudentIdAndCourseId(Long studentId, Long courseId);
    
    // Find all feedback for a specific teacher
    List<FacultyFeedback> findByTeacherIdOrderBySubmittedAtDesc(Long teacherId);
    
    // Find all feedback for a specific course
    List<FacultyFeedback> findByCourseIdOrderBySubmittedAtDesc(Long courseId);
    
    // Find all feedback for a teacher in a specific course
    List<FacultyFeedback> findByTeacherIdAndCourseIdOrderBySubmittedAtDesc(Long teacherId, Long courseId);
    
    // Find all feedback by a specific student
    List<FacultyFeedback> findByStudentIdOrderBySubmittedAtDesc(Long studentId);
    
    // Check if student has already submitted feedback for a teacher-course combination
    boolean existsByStudentIdAndTeacherIdAndCourseId(Long studentId, Long teacherId, Long courseId);
    
    // Get average ratings for a teacher
    @Query("SELECT AVG(f.teachingQuality) as avgTeaching, " +
           "AVG(f.courseContent) as avgContent, " +
           "AVG(f.responsiveness) as avgResponsiveness, " +
           "AVG(f.overallSatisfaction) as avgOverall, " +
           "COUNT(f) as totalFeedback " +
           "FROM FacultyFeedback f WHERE f.teacherId = :teacherId")
    Object[] getTeacherAverageRatings(@Param("teacherId") Long teacherId);
    
    // Get average ratings for a teacher in a specific course
    @Query("SELECT AVG(f.teachingQuality) as avgTeaching, " +
           "AVG(f.courseContent) as avgContent, " +
           "AVG(f.responsiveness) as avgResponsiveness, " +
           "AVG(f.overallSatisfaction) as avgOverall, " +
           "COUNT(f) as totalFeedback " +
           "FROM FacultyFeedback f WHERE f.teacherId = :teacherId AND f.courseId = :courseId")
    Object[] getTeacherCourseAverageRatings(@Param("teacherId") Long teacherId, @Param("courseId") Long courseId);
    
    // Get total feedback count for a teacher
    long countByTeacherId(Long teacherId);
    
    // Get feedback count for a specific course
    long countByCourseId(Long courseId);
    
    // Delete all feedback for a specific course (when course is deleted)
    void deleteByCourseId(Long courseId);
    
    // Delete all feedback for a specific teacher (when teacher is removed)
    void deleteByTeacherId(Long teacherId);
}
