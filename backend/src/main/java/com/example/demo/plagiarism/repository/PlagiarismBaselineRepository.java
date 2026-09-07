package com.example.demo.plagiarism.repository;

import com.example.demo.plagiarism.model.PlagiarismBaseline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlagiarismBaselineRepository extends JpaRepository<PlagiarismBaseline, Long> {
    List<PlagiarismBaseline> findByAssignment_Id(Long assignmentId);
}
