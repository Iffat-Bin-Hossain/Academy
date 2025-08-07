package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final CourseTeacherRepository courseTeacherRepository;
    private final AnnouncementService announcementService;
    private final NotificationService notificationService;

    @Value("${app.upload.dir:uploads/resources}")
    private String uploadDir;

    /**
     * Create a new resource with file upload
     */
    public ResourceResponse createResourceWithFile(ResourceCreateRequest request, MultipartFile file, Long teacherId) throws IOException {
        log.info("Creating resource '{}' with file for course {} by teacher {}", 
                request.getTitle(), request.getCourseId(), teacherId);

        // Validate teacher and course
        User teacher = validateTeacherAndCourse(teacherId, request.getCourseId());
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Handle file upload
        String storedFilename = null;
        String originalFilename = null;
        String contentType = null;
        Long fileSize = null;

        if (file != null && !file.isEmpty()) {
            // Validate file
            validateFile(file);
            
            // Create upload directory if it doesn't exist
            Path uploadPath = Paths.get(uploadDir);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String fileExtension = getFileExtension(file.getOriginalFilename());
            storedFilename = UUID.randomUUID().toString() + fileExtension;
            Path filePath = uploadPath.resolve(storedFilename);

            // Save file
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            
            originalFilename = file.getOriginalFilename();
            contentType = file.getContentType();
            fileSize = file.getSize();
            
            log.info("File '{}' saved as '{}'", originalFilename, storedFilename);
        }

        // Create resource
        Resource resource = Resource.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .resourceType(Resource.ResourceType.FILE)
                .topic(request.getTopic())
                .week(request.getWeek())
                .tags(request.getTags())
                .originalFilename(originalFilename)
                .storedFilename(storedFilename)
                .contentType(contentType)
                .fileSize(fileSize)
                .visibleFrom(request.getVisibleFrom())
                .visibleUntil(request.getVisibleUntil())
                .isVisible(request.getIsVisible() != null ? request.getIsVisible() : true)
                .course(course)
                .uploadedBy(teacher)
                .build();

        Resource savedResource = resourceRepository.save(resource);
        log.info("Resource '{}' created successfully with ID: {}", savedResource.getTitle(), savedResource.getId());

        // Create announcement for the new resource
        announcementService.createResourceAnnouncement(
                request.getCourseId(), teacherId, savedResource.getTitle(), savedResource.getId(), "FILE");

        // Notify all enrolled students about the new resource
        notificationService.createNewResourceNotification(course, savedResource, teacher);

        return mapToResponse(savedResource, teacherId);
    }

    /**
     * Create a new link resource
     */
    public ResourceResponse createLinkResource(ResourceCreateRequest request, Long teacherId) {
        log.info("Creating link resource '{}' for course {} by teacher {}", 
                request.getTitle(), request.getCourseId(), teacherId);

        // Validate teacher and course
        User teacher = validateTeacherAndCourse(teacherId, request.getCourseId());
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Validate URL
        if (request.getUrl() == null || request.getUrl().trim().isEmpty()) {
            throw new RuntimeException("URL is required for link resources");
        }

        // Create resource
        Resource resource = Resource.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .resourceType(Resource.ResourceType.LINK)
                .topic(request.getTopic())
                .week(request.getWeek())
                .tags(request.getTags())
                .url(request.getUrl().trim())
                .visibleFrom(request.getVisibleFrom())
                .visibleUntil(request.getVisibleUntil())
                .isVisible(request.getIsVisible() != null ? request.getIsVisible() : true)
                .course(course)
                .uploadedBy(teacher)
                .build();

        Resource savedResource = resourceRepository.save(resource);
        log.info("Link resource '{}' created successfully with ID: {}", savedResource.getTitle(), savedResource.getId());

        // Create announcement for the new resource
        announcementService.createResourceAnnouncement(
                request.getCourseId(), teacherId, savedResource.getTitle(), savedResource.getId(), "LINK");

        // Notify all enrolled students about the new resource
        notificationService.createNewResourceNotification(course, savedResource, teacher);

        return mapToResponse(savedResource, teacherId);
    }

    /**
     * Create a new note resource
     */
    public ResourceResponse createNoteResource(ResourceCreateRequest request, Long teacherId) {
        log.info("Creating note resource '{}' for course {} by teacher {}", 
                request.getTitle(), request.getCourseId(), teacherId);

        // Validate teacher and course
        User teacher = validateTeacherAndCourse(teacherId, request.getCourseId());
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Validate note content
        if (request.getNoteContent() == null || request.getNoteContent().trim().isEmpty()) {
            throw new RuntimeException("Note content is required for note resources");
        }

        // Create resource
        Resource resource = Resource.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .resourceType(Resource.ResourceType.NOTE)
                .topic(request.getTopic())
                .week(request.getWeek())
                .tags(request.getTags())
                .noteContent(request.getNoteContent().trim())
                .visibleFrom(request.getVisibleFrom())
                .visibleUntil(request.getVisibleUntil())
                .isVisible(request.getIsVisible() != null ? request.getIsVisible() : true)
                .course(course)
                .uploadedBy(teacher)
                .build();

        Resource savedResource = resourceRepository.save(resource);
        log.info("Note resource '{}' created successfully with ID: {}", savedResource.getTitle(), savedResource.getId());

        // Create announcement for the new resource
        announcementService.createResourceAnnouncement(
                request.getCourseId(), teacherId, savedResource.getTitle(), savedResource.getId(), "NOTE");

        // Notify all enrolled students about the new resource
        log.info("About to call notificationService.createNewResourceNotification for resource: {}", savedResource.getTitle());
        notificationService.createNewResourceNotification(course, savedResource, teacher);
        log.info("Completed notification service call for resource: {}", savedResource.getTitle());

        return mapToResponse(savedResource, teacherId);
    }

    /**
     * Get all resources for a course (with visibility filtering for students)
     */
    public List<ResourceResponse> getResourcesForCourse(Long courseId, Long userId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Resource> resources;
        
        if (user.getRole().equals(Role.TEACHER) && isTeacherAssignedToCourse(user, course)) {
            // Teachers see all resources in their assigned courses
            resources = resourceRepository.findByCourseAndIsActiveTrueOrderByCreatedAtDesc(course);
        } else {
            // Students see only visible resources
            resources = resourceRepository.findVisibleResourcesByCourse(course, LocalDateTime.now());
        }

        return resources.stream()
                .map(resource -> mapToResponse(resource, userId))
                .collect(Collectors.toList());
    }

    /**
     * Get resources with filters
     */
    public List<ResourceResponse> getResourcesWithFilters(Long courseId, String topic, String week, 
                                                        Resource.ResourceType resourceType, Long userId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        List<Resource> resources = resourceRepository.findResourcesByFilters(course, topic, week, resourceType);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Filter by visibility for students
        if (user.getRole().equals(Role.STUDENT)) {
            resources = resources.stream()
                    .filter(Resource::isVisibleNow)
                    .collect(Collectors.toList());
        }

        return resources.stream()
                .map(resource -> mapToResponse(resource, userId))
                .collect(Collectors.toList());
    }

    /**
     * Update a resource
     */
    public ResourceResponse updateResource(Long resourceId, ResourceUpdateRequest request, Long teacherId) {
        log.info("Updating resource {} by teacher {}", resourceId, teacherId);

        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Resource not found"));

        // Validate teacher permissions
        User teacher = validateTeacherAndCourse(teacherId, resource.getCourse().getId());
        
        // Check if teacher can edit this resource (either creator or assigned to course)
        if (!resource.getUploadedBy().getId().equals(teacherId) && 
            !isTeacherAssignedToCourse(teacher, resource.getCourse())) {
            throw new RuntimeException("You don't have permission to edit this resource");
        }

        // Update fields
        if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
            resource.setTitle(request.getTitle().trim());
        }
        if (request.getDescription() != null) {
            resource.setDescription(request.getDescription());
        }
        if (request.getTopic() != null) {
            resource.setTopic(request.getTopic());
        }
        if (request.getWeek() != null) {
            resource.setWeek(request.getWeek());
        }
        if (request.getTags() != null) {
            resource.setTags(request.getTags());
        }
        if (request.getUrl() != null && resource.getResourceType() == Resource.ResourceType.LINK) {
            resource.setUrl(request.getUrl().trim());
        }
        if (request.getNoteContent() != null && resource.getResourceType() == Resource.ResourceType.NOTE) {
            resource.setNoteContent(request.getNoteContent().trim());
        }
        if (request.getVisibleFrom() != null) {
            resource.setVisibleFrom(request.getVisibleFrom());
        }
        if (request.getVisibleUntil() != null) {
            resource.setVisibleUntil(request.getVisibleUntil());
        }
        if (request.getIsVisible() != null) {
            resource.setIsVisible(request.getIsVisible());
        }
        if (request.getIsActive() != null) {
            resource.setIsActive(request.getIsActive());
        }

        Resource updatedResource = resourceRepository.save(resource);
        log.info("Resource '{}' updated successfully", updatedResource.getTitle());

        return mapToResponse(updatedResource, teacherId);
    }

    /**
     * Delete a resource (soft delete)
     */
    public String deleteResource(Long resourceId, Long teacherId) {
        log.info("Deleting resource {} by teacher {}", resourceId, teacherId);

        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Resource not found"));

        // Validate teacher permissions
        User teacher = validateTeacherAndCourse(teacherId, resource.getCourse().getId());
        
        // Check if teacher can delete this resource (either creator or assigned to course)
        if (!resource.getUploadedBy().getId().equals(teacherId) && 
            !isTeacherAssignedToCourse(teacher, resource.getCourse())) {
            throw new RuntimeException("You don't have permission to delete this resource");
        }

        // Soft delete
        resource.setIsActive(false);
        resourceRepository.save(resource);

        log.info("Resource '{}' deleted successfully", resource.getTitle());
        return "Resource deleted successfully";
    }

    /**
     * Get a specific resource and increment view count
     */
    public ResourceResponse getResource(Long resourceId, Long userId) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Resource not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check visibility for students
        if (user.getRole().equals(Role.STUDENT) && !resource.isVisibleNow()) {
            throw new RuntimeException("Resource is not available");
        }

        // Increment view count
        resource.incrementViewCount();
        resourceRepository.save(resource);

        return mapToResponse(resource, userId);
    }

    /**
     * Download a resource file and increment download count
     */
    public Path downloadResource(Long resourceId, Long userId) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new RuntimeException("Resource not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if it's a file resource
        if (resource.getResourceType() != Resource.ResourceType.FILE) {
            throw new RuntimeException("Resource is not a downloadable file");
        }

        // Check visibility for students
        if (user.getRole().equals(Role.STUDENT) && !resource.isVisibleNow()) {
            throw new RuntimeException("Resource is not available for download");
        }

        // Check if file exists
        Path filePath = Paths.get(uploadDir).resolve(resource.getStoredFilename());
        if (!Files.exists(filePath)) {
            throw new RuntimeException("File not found on server");
        }

        // Increment download count
        resource.incrementDownloadCount();
        resourceRepository.save(resource);

        log.info("Resource '{}' downloaded by user {}", resource.getTitle(), userId);
        return filePath;
    }

    /**
     * Get topics for a course
     */
    public List<String> getTopicsForCourse(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        return resourceRepository.findDistinctTopicsByCourse(course);
    }

    /**
     * Get weeks for a course
     */
    public List<String> getWeeksForCourse(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        return resourceRepository.findDistinctWeeksByCourse(course);
    }

    /**
     * Search resources in a course
     */
    public List<ResourceResponse> searchResourcesInCourse(Long courseId, String searchTerm, Long userId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Resource> resources = resourceRepository.searchResourcesInCourse(course, searchTerm);
        
        // Filter by visibility for students
        if (user.getRole().equals(Role.STUDENT)) {
            resources = resources.stream()
                    .filter(Resource::isVisibleNow)
                    .collect(Collectors.toList());
        }

        return resources.stream()
                .map(resource -> mapToResponse(resource, userId))
                .collect(Collectors.toList());
    }

    // Helper methods
    private User validateTeacherAndCourse(Long teacherId, Long courseId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        if (!teacher.getRole().equals(Role.TEACHER)) {
            throw new RuntimeException("Only teachers can manage resources");
        }

        if (!teacher.isApproved()) {
            throw new RuntimeException("Teacher account is not approved");
        }

        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        if (!isTeacherAssignedToCourse(teacher, course)) {
            throw new RuntimeException("Teacher is not assigned to this course");
        }

        return teacher;
    }

    private boolean isTeacherAssignedToCourse(User teacher, Course course) {
        // Refresh course entity to get latest data from database
        Course refreshedCourse = courseRepository.findById(course.getId())
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        // Check CourseTeacher table first
        boolean isInCourseTeacher = courseTeacherRepository.existsByCourseAndTeacherAndActiveTrue(refreshedCourse, teacher);
        
        // Check assignedTeacher field
        boolean isAssignedTeacher = refreshedCourse.getAssignedTeacher() != null && 
                                   refreshedCourse.getAssignedTeacher().getId().equals(teacher.getId());
        
        // Debug logging
        log.debug("Teacher assignment check for Teacher ID: {}, Course ID: {}", teacher.getId(), refreshedCourse.getId());
        log.debug("CourseTeacher table check: {}", isInCourseTeacher);
        log.debug("AssignedTeacher field check: {} (assignedTeacherId: {})", 
                 isAssignedTeacher, refreshedCourse.getAssignedTeacher() != null ? refreshedCourse.getAssignedTeacher().getId() : "null");
        
        boolean result = isInCourseTeacher || isAssignedTeacher;
        log.debug("Final assignment result: {}", result);
        
        return result;
    }

    /**
     * Debug method to check teacher assignment status
     */
    public Map<String, Object> debugTeacherAssignment(Long teacherId, Long courseId) {
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Refresh course entity
        Course refreshedCourse = courseRepository.findById(courseId).orElse(course);

        boolean isInCourseTeacher = courseTeacherRepository.existsByCourseAndTeacherAndActiveTrue(refreshedCourse, teacher);
        boolean isAssignedTeacher = refreshedCourse.getAssignedTeacher() != null && 
                                   refreshedCourse.getAssignedTeacher().getId().equals(teacher.getId());
        boolean finalResult = isInCourseTeacher || isAssignedTeacher;

        Map<String, Object> debugInfo = new HashMap<>();
        debugInfo.put("teacherId", teacherId);
        debugInfo.put("teacherName", teacher.getName());
        debugInfo.put("teacherRole", teacher.getRole());
        debugInfo.put("teacherApproved", teacher.isApproved());
        debugInfo.put("courseId", courseId);
        debugInfo.put("courseTitle", course.getTitle());
        debugInfo.put("assignedTeacherId", refreshedCourse.getAssignedTeacher() != null ? refreshedCourse.getAssignedTeacher().getId() : null);
        debugInfo.put("assignedTeacherName", refreshedCourse.getAssignedTeacher() != null ? refreshedCourse.getAssignedTeacher().getName() : null);
        debugInfo.put("isInCourseTeacher", isInCourseTeacher);
        debugInfo.put("isAssignedTeacher", isAssignedTeacher);
        debugInfo.put("finalAssignmentResult", finalResult);

        log.info("Teacher Assignment Debug: {}", debugInfo);
        return debugInfo;
    }

    private void validateFile(MultipartFile file) {
        // Check file size (50MB limit)
        if (file.getSize() > 50 * 1024 * 1024) {
            throw new RuntimeException("File size exceeds 50MB limit");
        }

        // Check file type
        String filename = file.getOriginalFilename();
        if (filename == null || filename.trim().isEmpty()) {
            throw new RuntimeException("Invalid filename");
        }

        String extension = getFileExtension(filename).toLowerCase();
        if (!isAllowedFileType(extension)) {
            throw new RuntimeException("File type not allowed. Supported types: PDF, DOC, DOCX, PPT, PPTX, TXT, ZIP, JPG, PNG, MP4, etc.");
        }
    }

    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }

    private boolean isAllowedFileType(String extension) {
        String[] allowedTypes = {
            ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".txt", ".zip", ".rar",
            ".jpg", ".jpeg", ".png", ".gif", ".mp4", ".avi", ".mov", ".mp3",
            ".wav", ".csv", ".xls", ".xlsx", ".java", ".cpp", ".py", ".js",
            ".html", ".css", ".json", ".xml"
        };
        
        for (String type : allowedTypes) {
            if (type.equals(extension)) {
                return true;
            }
        }
        return false;
    }

    private ResourceResponse mapToResponse(Resource resource, Long currentUserId) {
        User currentUser = userRepository.findById(currentUserId).orElse(null);
        
        boolean canEdit = false;
        boolean canDelete = false;
        boolean canCreateDiscussion = false;
        
        if (currentUser != null && currentUser.getRole().equals(Role.TEACHER)) {
            boolean isAssigned = isTeacherAssignedToCourse(currentUser, resource.getCourse());
            canEdit = resource.getUploadedBy().getId().equals(currentUserId) || isAssigned;
            canDelete = resource.getUploadedBy().getId().equals(currentUserId) || isAssigned;
            canCreateDiscussion = isAssigned;
        }

        return ResourceResponse.builder()
                .id(resource.getId())
                .title(resource.getTitle())
                .description(resource.getDescription())
                .resourceType(resource.getResourceType())
                .topic(resource.getTopic())
                .week(resource.getWeek())
                .tags(resource.getTags())
                .originalFilename(resource.getOriginalFilename())
                .contentType(resource.getContentType())
                .fileSize(resource.getFileSize())
                .downloadUrl(resource.getResourceType() == Resource.ResourceType.FILE ? 
                           "/api/resources/" + resource.getId() + "/download" : null)
                .url(resource.getUrl())
                .noteContent(resource.getNoteContent())
                .visibleFrom(resource.getVisibleFrom())
                .visibleUntil(resource.getVisibleUntil())
                .isVisible(resource.getIsVisible())
                .isActive(resource.getIsActive())
                .downloadCount(resource.getDownloadCount())
                .viewCount(resource.getViewCount())
                .courseId(resource.getCourse().getId())
                .courseTitle(resource.getCourse().getTitle())
                .courseCode(resource.getCourse().getCourseCode())
                .uploadedById(resource.getUploadedBy().getId())
                .uploadedByName(resource.getUploadedBy().getName())
                .uploadedBy(UserSummary.builder()
                        .id(resource.getUploadedBy().getId())
                        .firstName(resource.getUploadedBy().getName()) // Using name as firstName
                        .lastName("") // Empty since User model doesn't have lastName
                        .email(resource.getUploadedBy().getEmail())
                        .role(resource.getUploadedBy().getRole())
                        .build())
                .createdAt(resource.getCreatedAt())
                .updatedAt(resource.getUpdatedAt())
                .discussionThreadsCount(resource.getDiscussionThreads().size())
                .canEdit(canEdit)
                .canDelete(canDelete)
                .canCreateDiscussion(canCreateDiscussion)
                .build();
    }
}
