package com.example.demo.plagiarism.model;

import com.example.demo.model.Assignment;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "plagiarism_baselines")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlagiarismBaseline {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignment_id", nullable = false)
    private Assignment assignment;

    @Column(name = "filename", nullable = false)
    private String filename;

    @Column(name = "language", length = 32)
    private String language;

    @Column(name = "code_content", columnDefinition = "TEXT", nullable = false)
    private String codeContent;

    @Column(name = "token_fingerprints_json", columnDefinition = "TEXT")
    private String tokenFingerprintsJson;

    @Column(name = "ast_hashes_json", columnDefinition = "TEXT")
    private String astHashesJson;

    @CreationTimestamp
    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploadedAt;
}
