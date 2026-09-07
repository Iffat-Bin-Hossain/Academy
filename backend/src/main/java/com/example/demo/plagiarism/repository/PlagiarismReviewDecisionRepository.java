package com.example.demo.plagiarism.repository;

import com.example.demo.plagiarism.model.PlagiarismReviewDecision;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlagiarismReviewDecisionRepository extends JpaRepository<PlagiarismReviewDecision, Long> {
    Optional<PlagiarismReviewDecision> findByPair_Id(Long pairId);
}
