package com.example.demo.plagiarism.repository;

import com.example.demo.plagiarism.model.PlagiarismEvidenceItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlagiarismEvidenceItemRepository extends JpaRepository<PlagiarismEvidenceItem, Long> {
    List<PlagiarismEvidenceItem> findByPair_IdOrderBySimilarityScoreDesc(Long pairId);
}
