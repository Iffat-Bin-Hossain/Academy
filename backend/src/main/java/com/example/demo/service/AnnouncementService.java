package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.AnnouncementRepository;
import com.example.demo.repository.CourseRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;

    /**
     * Get all announcements for a course
     */
    public List<AnnouncementResponse> getAnnouncementsForCourse(Long courseId) {
        List<Announcement> announcements = announcementRepository.findByCourseIdOrderByCreatedAtDesc(courseId);
        return announcements.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Create a general announcement
     */
    @Transactional
    public AnnouncementResponse createGeneralAnnouncement(Long courseId, Long teacherId, String title, String content) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        Announcement announcement = Announcement.builder()
                .title(title)
                .content(content)
                .type(Announcement.AnnouncementType.GENERAL)
                .course(course)
                .createdBy(teacher)
                .build();

        Announcement saved = announcementRepository.save(announcement);
        log.info("General announcement '{}' created for course {} by teacher {}", title, courseId, teacherId);
        
        return mapToResponse(saved);
    }

    /**
     * Auto-create announcement when a new assignment is posted
     */
    @Transactional
    public void createAssignmentAnnouncement(Long courseId, Long teacherId, String assignmentTitle, Long assignmentId) {
        try {
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new RuntimeException("Course not found"));
            
            User teacher = userRepository.findById(teacherId)
                    .orElseThrow(() -> new RuntimeException("Teacher not found"));

            String title = "📝 New Assignment Posted: " + assignmentTitle;
            String content = "A new assignment \"" + assignmentTitle + "\" has been posted. Please check the assignments section for details and submission requirements.";

            Announcement announcement = Announcement.builder()
                    .title(title)
                    .content(content)
                    .type(Announcement.AnnouncementType.ASSIGNMENT_POSTED)
                    .course(course)
                    .createdBy(teacher)
                    .referenceId(assignmentId)
                    .referenceType("ASSIGNMENT")
                    .build();

            announcementRepository.save(announcement);
            log.info("Auto-created assignment announcement for '{}' in course {} by teacher {}", assignmentTitle, courseId, teacherId);
        } catch (Exception e) {
            log.error("Failed to create assignment announcement: {}", e.getMessage());
            // Don't throw exception to avoid breaking assignment creation
        }
    }

    /**
     * Auto-create announcement when a new resource is added
     */
    @Transactional
    public void createResourceAnnouncement(Long courseId, Long teacherId, String resourceTitle, Long resourceId, String resourceType) {
        try {
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new RuntimeException("Course not found"));
            
            User teacher = userRepository.findById(teacherId)
                    .orElseThrow(() -> new RuntimeException("Teacher not found"));

            String emoji = getResourceEmoji(resourceType);
            String title = emoji + " New Resource Added: " + resourceTitle;
            String content = "A new " + resourceType.toLowerCase() + " resource \"" + resourceTitle + "\" has been added to the course. Check the resources section to access it.";

            Announcement announcement = Announcement.builder()
                    .title(title)
                    .content(content)
                    .type(Announcement.AnnouncementType.RESOURCE_ADDED)
                    .course(course)
                    .createdBy(teacher)
                    .referenceId(resourceId)
                    .referenceType("RESOURCE")
                    .build();

            announcementRepository.save(announcement);
            log.info("Auto-created resource announcement for '{}' in course {} by teacher {}", resourceTitle, courseId, teacherId);
        } catch (Exception e) {
            log.error("Failed to create resource announcement: {}", e.getMessage());
            // Don't throw exception to avoid breaking resource creation
        }
    }

    /**
     * Auto-create announcement when a new discussion thread is created
     */
    @Transactional
    public void createDiscussionThreadAnnouncement(Long courseId, Long teacherId, String threadTitle, Long threadId) {
        try {
            Course course = courseRepository.findById(courseId)
                    .orElseThrow(() -> new RuntimeException("Course not found"));
            
            User teacher = userRepository.findById(teacherId)
                    .orElseThrow(() -> new RuntimeException("Teacher not found"));

            String title = "💬 New Discussion Thread: " + threadTitle;
            String content = "A new discussion thread \"" + threadTitle + "\" has been started. Join the conversation in the discussions section.";

            Announcement announcement = Announcement.builder()
                    .title(title)
                    .content(content)
                    .type(Announcement.AnnouncementType.GENERAL)
                    .course(course)
                    .createdBy(teacher)
                    .referenceId(threadId)
                    .referenceType("DISCUSSION")
                    .build();

            announcementRepository.save(announcement);
            log.info("Auto-created discussion thread announcement for '{}' in course {} by teacher {}", threadTitle, courseId, teacherId);
        } catch (Exception e) {
            log.error("Failed to create discussion thread announcement: {}", e.getMessage());
            // Don't throw exception to avoid breaking thread creation
        }
    }

    private String getResourceEmoji(String resourceType) {
        switch (resourceType.toUpperCase()) {
            case "FILE":
                return "📁";
            case "LINK":
                return "🔗";
            case "NOTE":
                return "📝";
            default:
                return "📘";
        }
    }

    private AnnouncementResponse mapToResponse(Announcement announcement) {
        String authorName = "";
        try {
            authorName = announcement.getCreatedBy() != null ? announcement.getCreatedBy().getName() : "Unknown";
            log.debug("Mapping announcement {} with author: {}", announcement.getId(), authorName);
        } catch (Exception e) {
            log.warn("Error getting author name for announcement {}: {}", announcement.getId(), e.getMessage());
            authorName = "Unknown";
        }
        
        return AnnouncementResponse.builder()
                .id(announcement.getId())
                .title(announcement.getTitle())
                .content(announcement.getContent())
                .type(announcement.getType())
                .authorName(authorName)
                .createdAt(announcement.getCreatedAt())
                .referenceId(announcement.getReferenceId())
                .referenceType(announcement.getReferenceType())
                .courseId(announcement.getCourse().getId())
                .build();
    }
}
