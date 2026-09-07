package com.example.demo.plagiarism.repository;

import com.example.demo.plagiarism.model.PlagiarismSimilarityPair;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlagiarismSimilarityPairRepository extends JpaRepository<PlagiarismSimilarityPair, Long> {
    List<PlagiarismSimilarityPair> findByRun_IdOrderBySuspicionScoreDesc(String runId);
    List<PlagiarismSimilarityPair> findByRun_IdAndSuspicionScoreGreaterThanEqualOrderBySuspicionScoreDesc(String runId, double threshold);
    List<PlagiarismSimilarityPair> findByRun_IdAndClusterId(String runId, Integer clusterId);
}
