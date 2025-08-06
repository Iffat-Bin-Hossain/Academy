package com.example.demo.repository;

import com.example.demo.model.SubmissionFile;
import com.example.demo.model.StudentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SubmissionFileRepository extends JpaRepository<SubmissionFile, Long> {
    
    // Find all files for a submission
    List<SubmissionFile> findBySubmissionOrderByUploadedAtAsc(StudentSubmission submission);
    
    // Find files by submission ID
    List<SubmissionFile> findBySubmission_IdOrderByUploadedAtAsc(Long submissionId);
    
    // Delete all files for a submission
    void deleteBySubmission(StudentSubmission submission);
}
