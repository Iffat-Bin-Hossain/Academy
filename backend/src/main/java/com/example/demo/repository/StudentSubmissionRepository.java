package com.example.demo.repository;

import com.example.demo.model.StudentSubmission;
import com.example.demo.model.Assignment;
import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StudentSubmissionRepository extends JpaRepository<StudentSubmission, Long> {
    
    // Find submission by assignment and student
    Optional<StudentSubmission> findByAssignmentAndStudent(Assignment assignment, User student);
    
    // Find all submissions for an assignment
    List<StudentSubmission> findByAssignmentOrderBySubmittedAtAsc(Assignment assignment);
    
    // Find all submissions by a student
    List<StudentSubmission> findByStudentOrderBySubmittedAtDesc(User student);
    
    // Check if student has already submitted for an assignment
    boolean existsByAssignmentAndStudent(Assignment assignment, User student);
    
    // Find submissions by assignment ID
    List<StudentSubmission> findByAssignment_IdOrderBySubmittedAtAsc(Long assignmentId);
    
    // Find submissions by student ID
    List<StudentSubmission> findByStudent_IdOrderBySubmittedAtDesc(Long studentId);
    
    // Count submissions for an assignment
    @Query("SELECT COUNT(s) FROM StudentSubmission s WHERE s.assignment.id = :assignmentId")
    long countSubmissionsByAssignmentId(@Param("assignmentId") Long assignmentId);
    
    // Count late submissions for an assignment
    @Query("SELECT COUNT(s) FROM StudentSubmission s WHERE s.assignment.id = :assignmentId AND s.isLate = true")
    long countLateSubmissionsByAssignmentId(@Param("assignmentId") Long assignmentId);
}
