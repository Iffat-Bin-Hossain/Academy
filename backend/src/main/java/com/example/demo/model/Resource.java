package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "resources")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resource {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ResourceType resourceType;

    @Column
    private String topic;

    @Column
    private String week;

    @Column
    private String tags;

    // For file resources
    @Column
    private String originalFilename;

    @Column
    private String storedFilename;

    @Column
    private String contentType;

    @Column
    private Long fileSize;

    // For link resources
    @Column
    private String url;

    // For note resources
    @Column(columnDefinition = "TEXT")
    private String noteContent;

    // Visibility settings
    @Column
    private LocalDateTime visibleFrom;

    @Column
    private LocalDateTime visibleUntil;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isVisible = true;

    // Download analytics
    @Column
    @Builder.Default
    private Long downloadCount = 0L;

    @Column
    @Builder.Default
    private Long viewCount = 0L;

    // Relationships
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;

    // Link to discussion threads (optional)
    @OneToMany(mappedBy = "resource", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<DiscussionThread> discussionThreads = new ArrayList<>();

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    public enum ResourceType {
        FILE,    // PDF, PPT, DOC, etc.
        LINK,    // External URLs
        NOTE     // Text-based notes
    }

    // Utility methods
    public boolean isVisibleNow() {
        LocalDateTime now = LocalDateTime.now();
        
        if (!isVisible || !isActive) {
            return false;
        }
        
        if (visibleFrom != null && now.isBefore(visibleFrom)) {
            return false;
        }
        
        if (visibleUntil != null && now.isAfter(visibleUntil)) {
            return false;
        }
        
        return true;
    }

    public void incrementViewCount() {
        this.viewCount = (this.viewCount == null ? 0 : this.viewCount) + 1;
    }

    public void incrementDownloadCount() {
        this.downloadCount = (this.downloadCount == null ? 0 : this.downloadCount) + 1;
    }
}
