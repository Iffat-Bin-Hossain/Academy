package com.example.demo.plagiarism.repository;

import com.example.demo.plagiarism.model.PlagiarismCluster;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlagiarismClusterRepository extends JpaRepository<PlagiarismCluster, Long> {
    List<PlagiarismCluster> findByRun_IdOrderByRiskLevelDesc(String runId);
}
