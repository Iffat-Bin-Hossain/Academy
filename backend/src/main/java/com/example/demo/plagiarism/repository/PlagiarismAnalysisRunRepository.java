package com.example.demo.plagiarism.repository;

import com.example.demo.plagiarism.model.PlagiarismAnalysisRun;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlagiarismAnalysisRunRepository extends JpaRepository<PlagiarismAnalysisRun, String> {
    List<PlagiarismAnalysisRun> findByAssignment_IdOrderByStartedAtDesc(Long assignmentId);
    Optional<PlagiarismAnalysisRun> findFirstByAssignment_IdOrderByStartedAtDesc(Long assignmentId);
}
