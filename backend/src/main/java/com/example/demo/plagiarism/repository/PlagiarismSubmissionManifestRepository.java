package com.example.demo.plagiarism.repository;

import com.example.demo.plagiarism.model.PlagiarismSubmissionManifest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlagiarismSubmissionManifestRepository extends JpaRepository<PlagiarismSubmissionManifest, Long> {
    List<PlagiarismSubmissionManifest> findByRun_Id(String runId);
}
