package com.example.demo.repository;

import com.example.demo.model.Role;
import com.example.demo.model.User;
import com.example.demo.model.UserStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    List<User> findByIsApprovedFalseOrderByCreatedAtDesc();
    List<User> findByStatusOrderByCreatedAtDesc(UserStatus status);
    List<User> findByStatus(UserStatus status);
    List<User> findByRole(Role role);
    
    @Query("SELECT ce.student FROM CourseEnrollment ce WHERE ce.course.id = :courseId AND ce.status = 'APPROVED'")
    List<User> findEnrolledStudentsByCourse(@Param("courseId") Long courseId);
}
