package com.example.demo.service;

import com.example.demo.model.Assignment;
import com.example.demo.model.AssignmentFile;
import com.example.demo.model.AssignmentFileResponse;
import com.example.demo.repository.AssignmentFileRepository;
import com.example.demo.repository.AssignmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AssignmentFileService {

    private final AssignmentFileRepository assignmentFileRepository;
    private final AssignmentRepository assignmentRepository;

    @Value("${app.upload.dir:#{systemProperties['java.io.tmpdir']}/academy/uploads}")
    private String uploadDir;

    private static final long MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    private static final List<String> ALLOWED_EXTENSIONS = List.of(
            ".pdf", ".doc", ".docx", ".txt", ".zip", ".rar", 
            ".jpg", ".jpeg", ".png", ".gif", ".bmp",
            ".java", ".py", ".js", ".html", ".css", ".cpp", ".c", ".cs"
    );

    /**
     * Upload files for an assignment
     */
    public List<AssignmentFileResponse> uploadFiles(Long assignmentId, List<MultipartFile> files, Long teacherId) 
            throws IOException {
        
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        // Verify teacher permissions (assignment creator or course teacher)
        if (!assignment.getCreatedBy().getId().equals(teacherId) && 
            !assignment.getCourse().getAssignedTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("Not authorized to upload files to this assignment");
        }

        // Create upload directory if it doesn't exist
        Path uploadPath = Paths.get(uploadDir, "assignments", assignmentId.toString());
        Files.createDirectories(uploadPath);

        List<AssignmentFile> savedFiles = files.stream()
                .map(file -> {
                    try {
                        return saveFile(file, assignment, uploadPath, teacherId);
                    } catch (IOException e) {
                        log.error("Failed to save file: {}", file.getOriginalFilename(), e);
                        throw new RuntimeException("Failed to save file: " + file.getOriginalFilename(), e);
                    }
                })
                .collect(Collectors.toList());

        return savedFiles.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Add URL attachment to an assignment
     */
    public AssignmentFileResponse addUrlAttachment(Long assignmentId, String url, String title, String description, Long teacherId) {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        // Verify teacher permissions
        if (!assignment.getCreatedBy().getId().equals(teacherId) && 
            !assignment.getCourse().getAssignedTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("Not authorized to add attachments to this assignment");
        }

        // Validate URL
        if (url == null || url.trim().isEmpty()) {
            throw new RuntimeException("URL cannot be empty");
        }

        try {
            new URL(url); // Validate URL format
        } catch (MalformedURLException e) {
            throw new RuntimeException("Invalid URL format");
        }

        // Create URL attachment
        AssignmentFile urlAttachment = AssignmentFile.builder()
                .assignment(assignment)
                .attachmentType(AssignmentFile.AttachmentType.URL)
                .url(url)
                .urlTitle(title != null && !title.trim().isEmpty() ? title : "Link")
                .urlDescription(description)
                .uploadedBy(teacherId)
                .build();

        AssignmentFile saved = assignmentFileRepository.save(urlAttachment);
        return mapToResponse(saved);
    }

    /**
     * Update attachment files during assignment editing
     */
    public List<AssignmentFileResponse> updateAssignmentFiles(Long assignmentId, List<MultipartFile> newFiles, 
                                                              List<String> urlsToAdd, List<String> urlTitles, 
                                                              List<String> urlDescriptions, List<Long> filesToDelete, 
                                                              Long teacherId) throws IOException {
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        // Verify teacher permissions
        if (!assignment.getCreatedBy().getId().equals(teacherId) && 
            !assignment.getCourse().getAssignedTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("Not authorized to modify files for this assignment");
        }

        // Delete specified files
        if (filesToDelete != null && !filesToDelete.isEmpty()) {
            for (Long fileId : filesToDelete) {
                try {
                    deleteFile(fileId, teacherId);
                } catch (Exception e) {
                    log.warn("Failed to delete file with ID {}: {}", fileId, e.getMessage());
                }
            }
        }

        // Add new file uploads
        List<AssignmentFileResponse> allFiles = getAssignmentFiles(assignmentId);
        if (newFiles != null && !newFiles.isEmpty()) {
            List<AssignmentFileResponse> newUploadedFiles = uploadFiles(assignmentId, newFiles, teacherId);
            allFiles.addAll(newUploadedFiles);
        }

        // Add new URL attachments
        if (urlsToAdd != null && !urlsToAdd.isEmpty()) {
            for (int i = 0; i < urlsToAdd.size(); i++) {
                String url = urlsToAdd.get(i);
                if (url != null && !url.trim().isEmpty()) {
                    String title = (urlTitles != null && i < urlTitles.size()) ? urlTitles.get(i) : null;
                    String description = (urlDescriptions != null && i < urlDescriptions.size()) ? urlDescriptions.get(i) : null;
                    AssignmentFileResponse urlAttachment = addUrlAttachment(assignmentId, url, title, description, teacherId);
                    allFiles.add(urlAttachment);
                }
            }
        }

        return getAssignmentFiles(assignmentId); // Return fresh list
    }

    /**
     * Get all files for an assignment
     */
    public List<AssignmentFileResponse> getAssignmentFiles(Long assignmentId) {
        List<AssignmentFile> files = assignmentFileRepository.findByAssignmentIdOrderByUploadedAtDesc(assignmentId);
        return files.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Download a file (only works for file attachments, not URLs)
     */
    public Resource downloadFile(Long fileId) throws MalformedURLException {
        AssignmentFile assignmentFile = assignmentFileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        if (assignmentFile.getAttachmentType() == AssignmentFile.AttachmentType.URL) {
            throw new RuntimeException("Cannot download URL attachment. Use the URL directly.");
        }

        Path filePath = Paths.get(assignmentFile.getFilePath());
        Resource resource = new UrlResource(filePath.toUri());

        if (resource.exists() && resource.isReadable()) {
            return resource;
        } else {
            throw new RuntimeException("File not found or not readable: " + assignmentFile.getOriginalFilename());
        }
    }

    /**
     * Delete a file or URL attachment
     */
    public void deleteFile(Long fileId, Long teacherId) throws IOException {
        AssignmentFile assignmentFile = assignmentFileRepository.findById(fileId)
                .orElseThrow(() -> new RuntimeException("File not found"));

        Assignment assignment = assignmentFile.getAssignment();

        // Verify teacher permissions
        if (!assignment.getCreatedBy().getId().equals(teacherId) && 
            !assignment.getCourse().getAssignedTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("Not authorized to delete this file");
        }

        // Delete physical file only if it's a file attachment
        if (assignmentFile.getAttachmentType() == AssignmentFile.AttachmentType.FILE && 
            assignmentFile.getFilePath() != null) {
            Path filePath = Paths.get(assignmentFile.getFilePath());
            Files.deleteIfExists(filePath);
        }

        // Delete database record
        assignmentFileRepository.delete(assignmentFile);
        log.info("Attachment deleted: {}", 
                assignmentFile.getAttachmentType() == AssignmentFile.AttachmentType.FILE ? 
                assignmentFile.getOriginalFilename() : assignmentFile.getUrlTitle());
    }

    private AssignmentFile saveFile(MultipartFile file, Assignment assignment, Path uploadPath, Long teacherId) 
            throws IOException {
        
        // Validate file
        validateFile(file);

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFilename);
        String storedFilename = UUID.randomUUID().toString() + fileExtension;
        Path filePath = uploadPath.resolve(storedFilename);

        // Save file to disk
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Save file info to database
        AssignmentFile assignmentFile = AssignmentFile.builder()
                .assignment(assignment)
                .attachmentType(AssignmentFile.AttachmentType.FILE)
                .originalFilename(originalFilename)
                .storedFilename(storedFilename)
                .filePath(filePath.toString())
                .fileSize(file.getSize())
                .contentType(file.getContentType())
                .uploadedBy(teacherId)
                .build();

        return assignmentFileRepository.save(assignmentFile);
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new RuntimeException("File size exceeds maximum allowed size (50MB)");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || filename.trim().isEmpty()) {
            throw new RuntimeException("Invalid filename");
        }

        String extension = getFileExtension(filename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new RuntimeException("File type not allowed. Allowed types: " + 
                    String.join(", ", ALLOWED_EXTENSIONS));
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf("."));
    }

    private AssignmentFileResponse mapToResponse(AssignmentFile file) {
        AssignmentFileResponse.AssignmentFileResponseBuilder builder = AssignmentFileResponse.builder()
                .id(file.getId())
                .assignmentId(file.getAssignment().getId())
                .attachmentType(file.getAttachmentType())
                .uploadedAt(file.getUploadedAt())
                .uploadedBy(file.getUploadedBy());

        if (file.getAttachmentType() == AssignmentFile.AttachmentType.FILE) {
            builder.originalFilename(file.getOriginalFilename())
                   .contentType(file.getContentType())
                   .fileSize(file.getFileSize())
                   .downloadUrl("/api/assignments/files/" + file.getId() + "/download");
        } else if (file.getAttachmentType() == AssignmentFile.AttachmentType.URL) {
            builder.url(file.getUrl())
                   .urlTitle(file.getUrlTitle())
                   .urlDescription(file.getUrlDescription());
        }

        return builder.build();
    }
}
