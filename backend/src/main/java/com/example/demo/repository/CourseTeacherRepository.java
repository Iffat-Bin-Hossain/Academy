package com.example.demo.repository;

import com.example.demo.model.Course;
import com.example.demo.model.CourseTeacher;
import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CourseTeacherRepository extends JpaRepository<CourseTeacher, Long> {
    
    // Find all active teachers for a course
    List<CourseTeacher> findByCourseAndActiveTrue(Course course);
    
    // Find all active courses for a teacher
    List<CourseTeacher> findByTeacherAndActiveTrue(User teacher);
    
    // Find specific course-teacher assignment
    Optional<CourseTeacher> findByCourseAndTeacherAndActiveTrue(Course course, User teacher);
    
    // Check if a teacher is already assigned to a course
    boolean existsByCourseAndTeacherAndActiveTrue(Course course, User teacher);
    
    // Find primary teacher for a course
    @Query("SELECT ct FROM CourseTeacher ct WHERE ct.course = :course AND ct.role = 'PRIMARY' AND ct.active = true")
    Optional<CourseTeacher> findPrimaryTeacher(@Param("course") Course course);
    
    // Count active teachers for a course
    long countByCourseAndActiveTrue(Course course);
    
    // Find teachers by course ID
    @Query("SELECT ct FROM CourseTeacher ct WHERE ct.course.id = :courseId AND ct.active = true")
    List<CourseTeacher> findByCourseIdAndActiveTrue(@Param("courseId") Long courseId);
    
    // Find courses by teacher ID
    @Query("SELECT ct FROM CourseTeacher ct WHERE ct.teacher.id = :teacherId AND ct.active = true")
    List<CourseTeacher> findByTeacherIdAndActiveTrue(@Param("teacherId") Long teacherId);
}
