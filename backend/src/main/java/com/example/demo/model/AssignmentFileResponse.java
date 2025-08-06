package com.example.demo.model;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignmentFileResponse {
    private Long id;
    private Long assignmentId;
    private AssignmentFile.AttachmentType attachmentType;
    private String originalFilename;
    private String contentType;
    private Long fileSize;
    private String url;
    private String urlTitle;
    private String urlDescription;
    private LocalDateTime uploadedAt;
    private Long uploadedBy;
    private String downloadUrl;
}
