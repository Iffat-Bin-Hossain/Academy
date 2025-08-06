package com.example.demo.repository;

import com.example.demo.model.Assignment;
import com.example.demo.model.AssignmentFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentFileRepository extends JpaRepository<AssignmentFile, Long> {
    
    // Find all files for a specific assignment
    List<AssignmentFile> findByAssignmentOrderByUploadedAtDesc(Assignment assignment);
    
    // Find all files for a specific assignment by ID
    @Query("SELECT af FROM AssignmentFile af WHERE af.assignment.id = :assignmentId ORDER BY af.uploadedAt DESC")
    List<AssignmentFile> findByAssignmentIdOrderByUploadedAtDesc(@Param("assignmentId") Long assignmentId);
    
    // Count files for an assignment
    long countByAssignment(Assignment assignment);
}
