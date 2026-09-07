package com.example.demo.plagiarism.model;

import com.example.demo.model.StudentSubmission;
import com.example.demo.model.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "plagiarism_submission_manifests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlagiarismSubmissionManifest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "run_id", nullable = false)
    private PlagiarismAnalysisRun run;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "submission_id", nullable = false)
    private StudentSubmission submission;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "archive_hash", length = 64)
    private String archiveHash;

    @Column(name = "total_files")
    private int totalFiles;

    @Column(name = "total_lines")
    private int totalLines;

    @Column(name = "total_tokens")
    private int totalTokens;

    @Column(name = "primary_language", length = 32)
    private String primaryLanguage;

    @Column(name = "files_manifest_json", columnDefinition = "TEXT")
    private String filesManifestJson;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
