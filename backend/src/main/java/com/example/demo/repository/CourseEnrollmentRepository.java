package com.example.demo.repository;

import com.example.demo.model.*;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CourseEnrollmentRepository extends JpaRepository<CourseEnrollment, Long> {
    List<CourseEnrollment> findByStudent(User student);
    List<CourseEnrollment> findByStudentAndStatus(User student, EnrollmentStatus status);
    List<CourseEnrollment> findByCourseAndStatus(Course course, EnrollmentStatus status);
    List<CourseEnrollment> findByCourseAndStatusIn(Course course, List<EnrollmentStatus> statuses);
    List<CourseEnrollment> findByCourse(Course course);
    Optional<CourseEnrollment> findByStudentAndCourse(User student, Course course);
}
