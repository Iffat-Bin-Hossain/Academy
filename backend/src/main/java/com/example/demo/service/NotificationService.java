package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /**
     * Create a notification for a user
     */
    public NotificationResponse createNotification(
            Long recipientId,
            Notification.NotificationType type,
            String title,
            String message,
            String redirectUrl,
            Course relatedCourse,
            Assignment relatedAssignment,
            User relatedUser,
            Long relatedThreadId) {
        
        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new RuntimeException("Recipient not found"));

        Notification notification = Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(title)
                .message(message)
                .redirectUrl(redirectUrl)
                .relatedCourse(relatedCourse)
                .relatedAssignment(relatedAssignment)
                .relatedUser(relatedUser)
                .relatedThreadId(relatedThreadId)
                .isRead(false)
                .build();

        Notification saved = notificationRepository.save(notification);
        log.info("Created notification of type {} for user {}: {}", type, recipient.getName(), title);
        
        return mapToResponse(saved);
    }

    /**
     * Get all notifications for a user
     */
    public List<NotificationResponse> getNotificationsForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Notification> notifications = notificationRepository.findByRecipientOrderByCreatedAtDesc(user);
        return notifications.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get unread notifications for a user
     */
    public List<NotificationResponse> getUnreadNotifications(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Notification> notifications = notificationRepository.findByRecipientAndIsReadFalseOrderByCreatedAtDesc(user);
        return notifications.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get unread notification count for a user
     */
    public long getUnreadCount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return notificationRepository.countByRecipientAndIsReadFalse(user);
    }

    /**
     * Mark notification as read
     */
    public void markAsRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getRecipient().getId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        if (!notification.getIsRead()) {
            notification.setIsRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
            log.info("Marked notification {} as read for user {}", notificationId, userId);
        }
    }

    /**
     * Mark all notifications as read for a user
     */
    public void markAllAsRead(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<Notification> unreadNotifications = notificationRepository.findByRecipientAndIsReadFalseOrderByCreatedAtDesc(user);
        LocalDateTime now = LocalDateTime.now();
        
        for (Notification notification : unreadNotifications) {
            notification.setIsRead(true);
            notification.setReadAt(now);
        }
        
        notificationRepository.saveAll(unreadNotifications);
        log.info("Marked {} notifications as read for user {}", unreadNotifications.size(), user.getName());
    }

    // Specific notification creation methods for different scenarios

    /**
     * Teacher assigned to course
     */
    public void notifyTeacherCourseAssignment(Long teacherId, Course course) {
        createNotification(
                teacherId,
                Notification.NotificationType.TEACHER_COURSE_ASSIGNMENT,
                "New Course Assignment",
                String.format("You have been assigned to teach the course: %s (%s)", course.getTitle(), course.getCourseCode()),
                "/teacher/" + course.getCourseCode(),
                course,
                null,
                null,
                null
        );
    }

    /**
     * Student enrollment request
     */
    public void notifyStudentEnrollmentRequest(Long teacherId, User student, Course course) {
        createNotification(
                teacherId,
                Notification.NotificationType.STUDENT_ENROLLMENT_REQUEST,
                "New Enrollment Request",
                String.format("%s has requested enrollment in your course: %s", student.getName(), course.getTitle()),
                "/teacher/" + course.getCourseCode(),
                course,
                null,
                student,
                null
        );
    }

    /**
     * Assignment submission by student
     */
    public void notifyAssignmentSubmission(Long teacherId, User student, Assignment assignment) {
        createNotification(
                teacherId,
                Notification.NotificationType.ASSIGNMENT_SUBMISSION,
                "New Assignment Submission",
                String.format("%s has submitted assignment: %s", student.getName(), assignment.getTitle()),
                "/teacher/" + assignment.getCourse().getCourseCode(),
                assignment.getCourse(),
                assignment,
                student,
                null
        );
    }

    /**
     * Discussion post by student
     */
    public void notifyDiscussionPost(Long teacherId, User student, Course course, String threadTitle, Long threadId) {
        createNotification(
                teacherId,
                Notification.NotificationType.DISCUSSION_POST,
                "New Discussion Post",
                String.format("%s posted in discussion: %s", student.getName(), threadTitle),
                "/teacher/" + course.getCourseCode(),
                course,
                null,
                student,
                threadId
        );
    }

    /**
     * Enrollment approved
     */
    public void notifyEnrollmentApproved(Long studentId, Course course) {
        createNotification(
                studentId,
                Notification.NotificationType.ENROLLMENT_APPROVED,
                "Enrollment Approved",
                String.format("Your enrollment request for %s has been approved!", course.getTitle()),
                "/student/" + course.getCourseCode(),
                course,
                null,
                null,
                null
        );
    }

    /**
     * Enrollment rejected
     */
    public void notifyEnrollmentRejected(Long studentId, Course course, String reason) {
        String message = String.format("Your enrollment request for %s has been rejected.", course.getTitle());
        if (reason != null && !reason.trim().isEmpty()) {
            message += " Reason: " + reason;
        }
        
        createNotification(
                studentId,
                Notification.NotificationType.ENROLLMENT_REJECTED,
                "Enrollment Rejected",
                message,
                "/student",
                course,
                null,
                null,
                null
        );
    }

    /**
     * New assignment posted
     */
    public void notifyNewAssignment(Long studentId, Assignment assignment) {
        createNotification(
                studentId,
                Notification.NotificationType.NEW_ASSIGNMENT,
                "New Assignment Posted",
                String.format("New assignment available in %s: %s", assignment.getCourse().getTitle(), assignment.getTitle()),
                "/student/" + assignment.getCourse().getCourseCode(),
                assignment.getCourse(),
                assignment,
                null,
                null
        );
    }

    /**
     * New resource uploaded
     */
    public void notifyNewResource(Long studentId, Course course, String resourceTitle) {
        createNotification(
                studentId,
                Notification.NotificationType.NEW_RESOURCE,
                "New Resource Available",
                String.format("New resource uploaded in %s: %s", course.getTitle(), resourceTitle),
                "/student/" + course.getCourseCode(),
                course,
                null,
                null,
                null
        );
    }

    /**
     * Discussion reply by teacher
     */
    public void notifyDiscussionReply(Long studentId, User teacher, Course course, String threadTitle, Long threadId) {
        createNotification(
                studentId,
                Notification.NotificationType.DISCUSSION_REPLY,
                "Teacher Reply in Discussion",
                String.format("%s replied to discussion: %s", teacher.getName(), threadTitle),
                "/student/" + course.getCourseCode(),
                course,
                null,
                teacher,
                threadId
        );
    }

    /**
     * Assignment graded
     */
    public void notifyAssignmentGraded(Long studentId, Assignment assignment, int marks, int maxMarks) {
        createNotification(
                studentId,
                Notification.NotificationType.ASSIGNMENT_GRADED,
                "Assignment Graded",
                String.format("Your assignment '%s' has been graded: %d/%d", assignment.getTitle(), marks, maxMarks),
                "/student/" + assignment.getCourse().getCourseCode(),
                assignment.getCourse(),
                assignment,
                null,
                null
        );
    }

    /**
     * Map Notification entity to NotificationResponse
     */
    private NotificationResponse mapToResponse(Notification notification) {
        NotificationResponse.NotificationResponseBuilder builder = NotificationResponse.builder()
                .id(notification.getId())
                .type(notification.getType().toString())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .redirectUrl(notification.getRedirectUrl())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .readAt(notification.getReadAt())
                .relatedThreadId(notification.getRelatedThreadId());

        // Add related course info
        if (notification.getRelatedCourse() != null) {
            Course course = notification.getRelatedCourse();
            builder.relatedCourse(NotificationResponse.RelatedCourse.builder()
                    .id(course.getId())
                    .title(course.getTitle())
                    .courseCode(course.getCourseCode())
                    .build());
        }

        // Add related assignment info
        if (notification.getRelatedAssignment() != null) {
            Assignment assignment = notification.getRelatedAssignment();
            builder.relatedAssignment(NotificationResponse.RelatedAssignment.builder()
                    .id(assignment.getId())
                    .title(assignment.getTitle())
                    .deadline(assignment.getDeadline())
                    .build());
        }

        // Add related user info
        if (notification.getRelatedUser() != null) {
            User user = notification.getRelatedUser();
            builder.relatedUser(NotificationResponse.RelatedUser.builder()
                    .id(user.getId())
                    .name(user.getName())
                    .email(user.getEmail())
                    .role(user.getRole().toString())
                    .build());
        }

        return builder.build();
    }
    
    // Enrollment request notification for teachers
    public void createEnrollmentRequestNotification(User teacher, Course course, User student) {
        // Only send notification if teacher is ACTIVE
        if (teacher.getStatus() != UserStatus.ACTIVE) {
            log.info("Skipping enrollment request notification for teacher {} - not ACTIVE (status: {})", teacher.getEmail(), teacher.getStatus());
            return;
        }
        
        String redirectUrl = String.format("/teacher/%s", course.getCourseCode());
        
        Notification notification = Notification.builder()
                .recipient(teacher)
                .type(Notification.NotificationType.STUDENT_ENROLLMENT_REQUEST)
                .title("New Enrollment Request")
                .message(String.format("%s has requested to enroll in %s", 
                    student.getName(), course.getTitle()))
                .redirectUrl(redirectUrl)
                .relatedCourse(course)
                .relatedUser(student)
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build();
                
        notificationRepository.save(notification);
    }
    
    // Enrollment decision notification for students
    public void createEnrollmentDecisionNotification(User student, Course course, boolean approved) {
        // Only send notification if student is ACTIVE
        if (student.getStatus() != UserStatus.ACTIVE) {
            log.info("Skipping enrollment decision notification for student {} - not ACTIVE (status: {})", student.getEmail(), student.getStatus());
            return;
        }
        
        String title = approved ? "Enrollment Approved" : "Enrollment Rejected";
        String message = approved ? 
            String.format("Your enrollment in %s has been approved", course.getTitle()) :
            String.format("Your enrollment in %s has been rejected", course.getTitle());
        String redirectUrl = "/student";
            
        Notification notification = Notification.builder()
                .recipient(student)
                .type(approved ? Notification.NotificationType.ENROLLMENT_APPROVED : Notification.NotificationType.ENROLLMENT_REJECTED)
                .title(title)
                .message(message)
                .redirectUrl(redirectUrl)
                .relatedCourse(course)
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build();
                
        notificationRepository.save(notification);
    }
    
    // New assignment notification for students
    public void createNewAssignmentNotification(Course course, Assignment assignment, User teacher) {
        // Get all enrolled students in the course
        List<User> enrolledStudents = userRepository.findEnrolledStudentsByCourse(course.getId());
        
        for (User student : enrolledStudents) {
            String redirectUrl = String.format("/student/%s", course.getCourseCode());
            
            Notification notification = Notification.builder()
                    .recipient(student)
                    .type(Notification.NotificationType.NEW_ASSIGNMENT)
                    .title("New Assignment Posted")
                    .message(String.format("New assignment '%s' has been posted in %s", 
                        assignment.getTitle(), course.getTitle()))
                    .redirectUrl(redirectUrl)
                    .relatedCourse(course)
                    .relatedAssignment(assignment)
                    .relatedUser(teacher)
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build();
                    
            notificationRepository.save(notification);
        }
    }

    // New resource notification for students
    public void createNewResourceNotification(Course course, Resource resource, User teacher) {
        log.info("Creating resource notifications for course {} (ID: {}) with resource '{}'", 
                course.getCourseCode(), course.getId(), resource.getTitle());
        
        // Get all enrolled students in the course
        List<User> enrolledStudents = userRepository.findEnrolledStudentsByCourse(course.getId());
        log.info("Found {} enrolled students in course {}", enrolledStudents.size(), course.getCourseCode());
        
        for (User student : enrolledStudents) {
            String redirectUrl = String.format("/student/%s", course.getCourseCode());
            
            // Determine resource type emoji and description
            String resourceTypeText = getResourceTypeDescription(resource.getResourceType());
            String resourceEmoji = getResourceTypeEmoji(resource.getResourceType());
            
            log.info("Creating notification for student {} about resource '{}'", student.getName(), resource.getTitle());
            
            Notification notification = Notification.builder()
                    .recipient(student)
                    .type(Notification.NotificationType.NEW_RESOURCE)
                    .title(resourceEmoji + " New Resource Available")
                    .message(String.format("New %s '%s' has been uploaded in %s", 
                        resourceTypeText, resource.getTitle(), course.getTitle()))
                    .redirectUrl(redirectUrl)
                    .relatedCourse(course)
                    .relatedResource(resource)
                    .relatedUser(teacher)
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build();
                    
            notificationRepository.save(notification);
            log.info("Notification created successfully for student {}", student.getName());
        }
        
        log.info("Completed creating {} resource notifications for course {}", 
                enrolledStudents.size(), course.getCourseCode());
    }

    // Helper methods for resource notifications
    private String getResourceTypeDescription(Resource.ResourceType type) {
        switch (type) {
            case FILE: return "file resource";
            case LINK: return "link resource";
            case NOTE: return "note resource";
            default: return "resource";
        }
    }

    private String getResourceTypeEmoji(Resource.ResourceType type) {
        switch (type) {
            case FILE: return "📎";
            case LINK: return "🔗";
            case NOTE: return "📝";
            default: return "📚";
        }
    }

    // New discussion thread notification for students
    public void createNewDiscussionThreadNotification(Course course, DiscussionThread thread, User teacher) {
        log.info("Creating discussion thread notifications for course {} (ID: {}) with thread '{}'", 
                course.getCourseCode(), course.getId(), thread.getTitle());
        
        // Get all enrolled students in the course
        List<User> enrolledStudents = userRepository.findEnrolledStudentsByCourse(course.getId());
        log.info("Found {} enrolled students in course {}", enrolledStudents.size(), course.getCourseCode());
        
        for (User student : enrolledStudents) {
            String redirectUrl = String.format("/student/%s", course.getCourseCode());
            
            log.info("Creating notification for student {} about discussion thread '{}'", student.getName(), thread.getTitle());
            
            Notification notification = Notification.builder()
                    .recipient(student)
                    .type(Notification.NotificationType.NEW_DISCUSSION_THREAD)
                    .title("💬 New Discussion Thread Created")
                    .message(String.format("New discussion thread '%s' has been created in %s by %s", 
                        thread.getTitle(), course.getTitle(), teacher.getName()))
                    .redirectUrl(redirectUrl)
                    .relatedCourse(course)
                    .relatedUser(teacher)
                    .relatedThreadId(thread.getId())
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build();
                    
            notificationRepository.save(notification);
        }
    }
    
    // Assignment submission notification for teachers
    public void createAssignmentSubmissionNotification(Assignment assignment, User student) {
        User teacher = assignment.getCourse().getAssignedTeacher();
        
        if (teacher != null) {
            // Only send notification if teacher is ACTIVE
            if (teacher.getStatus() != UserStatus.ACTIVE) {
                log.info("Skipping assignment submission notification for teacher {} - not ACTIVE (status: {})", teacher.getEmail(), teacher.getStatus());
                return;
            }
            
            String redirectUrl = String.format("/teacher/%s", assignment.getCourse().getCourseCode());
            
            Notification notification = Notification.builder()
                    .recipient(teacher)
                    .type(Notification.NotificationType.ASSIGNMENT_SUBMISSION)
                    .title("New Assignment Submission")
                    .message(String.format("%s has submitted assignment '%s' in %s", 
                        student.getName(), assignment.getTitle(), assignment.getCourse().getTitle()))
                    .redirectUrl(redirectUrl)
                    .relatedCourse(assignment.getCourse())
                    .relatedAssignment(assignment)
                    .relatedUser(student)
                    .createdAt(LocalDateTime.now())
                    .isRead(false)
                    .build();
                    
            notificationRepository.save(notification);
        }
    }
    
    // Discussion post notification for course members
    public void notifyDiscussionPost(Long teacherId, Course course, DiscussionThread thread, User author) {
        try {
            User teacher = userRepository.findById(teacherId).orElse(null);
            if (teacher != null && !teacher.getId().equals(author.getId())) {
                // Only send notification if teacher is ACTIVE
                if (teacher.getStatus() != UserStatus.ACTIVE) {
                    log.info("Skipping discussion post notification for teacher {} - not ACTIVE (status: {})", teacher.getEmail(), teacher.getStatus());
                    return;
                }
                
                String redirectUrl = String.format("/teacher/%s", course.getCourseCode());
                
                Notification notification = Notification.builder()
                        .recipient(teacher)
                        .type(Notification.NotificationType.DISCUSSION_POST)
                        .title("New Discussion Post")
                        .message(String.format("%s posted in discussion '%s' in %s", 
                            author.getName(), thread.getTitle(), course.getTitle()))
                        .redirectUrl(redirectUrl)
                        .relatedCourse(course)
                        .relatedUser(author)
                        .relatedThreadId(thread.getId())
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build();
                        
                notificationRepository.save(notification);
            }
        } catch (Exception e) {
            log.error("Error creating discussion post notification", e);
        }
    }
    
    // Discussion reply notification for thread participants
    public void notifyDiscussionReply(DiscussionThread thread, DiscussionPost post, User replier) {
        try {
            // Notify the thread author if they're not the one replying
            if (!thread.getCreatedBy().getId().equals(replier.getId())) {
                // Only send notification if recipient is ACTIVE
                if (thread.getCreatedBy().getStatus() != UserStatus.ACTIVE) {
                    log.info("Skipping discussion reply notification for user {} - not ACTIVE (status: {})", 
                            thread.getCreatedBy().getEmail(), thread.getCreatedBy().getStatus());
                    return;
                }
                
                String role = thread.getCreatedBy().getRole().toString().toLowerCase();
                String redirectUrl = String.format("/%s/courses/%d/discussions/%d", 
                    role, thread.getCourse().getId(), thread.getId());
                
                Notification notification = Notification.builder()
                        .recipient(thread.getCreatedBy())
                        .type(Notification.NotificationType.DISCUSSION_REPLY)
                        .title("New Reply to Your Discussion")
                        .message(String.format("%s replied to your discussion '%s' in %s", 
                            replier.getName(), thread.getTitle(), thread.getCourse().getTitle()))
                        .redirectUrl(redirectUrl)
                        .relatedCourse(thread.getCourse())
                        .relatedUser(replier)
                        .relatedThreadId(thread.getId())
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build();
                        
                notificationRepository.save(notification);
            }
        } catch (Exception e) {
            log.error("Error creating discussion reply notification", e);
        }
    }

    public void createAccountApprovalNotification(User user, boolean approved) {
        try {
            String title = approved ? "Account Approved!" : "Account Application Update";
            String message = approved 
                ? "Congratulations! Your account has been approved and you can now access all features of the Academy platform."
                : "We regret to inform you that your account application was not approved at this time.";
            
            Notification notification = Notification.builder()
                    .recipient(user)
                    .type(approved ? Notification.NotificationType.ACCOUNT_APPROVED : Notification.NotificationType.ACCOUNT_REJECTED)
                    .title(title)
                    .message(message)
                    .redirectUrl(approved ? "/" : null) // Redirect to dashboard if approved
                    .isRead(false)
                    .build();
                    
            notificationRepository.save(notification);
            log.info("Created account {} notification for user: {}", approved ? "approval" : "rejection", user.getEmail());
        } catch (Exception e) {
            log.error("Error creating account approval notification for user: " + user.getEmail(), e);
        }
    }

    // New signup request notification for admin
    public void createNewSignupRequestNotification(User newUser) {
        try {
            // Find all admin users
            List<User> adminUsers = userRepository.findByRole(Role.ADMIN);
            log.info("Creating signup request notifications for {} admins about new user: {}", adminUsers.size(), newUser.getEmail());
            
            for (User admin : adminUsers) {
                Notification notification = Notification.builder()
                        .recipient(admin)
                        .type(Notification.NotificationType.NEW_SIGNUP_REQUEST)
                        .title("🔔 New Signup Request")
                        .message(String.format("New user %s (%s) has signed up and is waiting for approval. Role: %s", 
                            newUser.getName(), newUser.getEmail(), newUser.getRole().toString()))
                        .redirectUrl("/admin/users") // Redirect to user management page
                        .relatedUser(newUser)
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build();
                        
                notificationRepository.save(notification);
                log.info("Created signup request notification for admin: {}", admin.getEmail());
            }
        } catch (Exception e) {
            log.error("Error creating signup request notification for user: " + newUser.getEmail(), e);
        }
    }

    // New course created notification for all students
    public void createNewCourseNotification(Course course, User teacher) {
        try {
            // Find only ACTIVE student users (approved users only)
            List<User> activeStudents = userRepository.findByRoleAndStatus(Role.STUDENT, UserStatus.ACTIVE);
            log.info("Creating new course notifications for {} ACTIVE students about course: {}", activeStudents.size(), course.getTitle());
            
            // Create appropriate message based on whether teacher is assigned
            String creatorName = (teacher != null) ? teacher.getName() : "Academy Administration";
            String message = String.format("New course '%s' has been created by %s. You can now enroll in this course!", 
                course.getTitle(), creatorName);
            
            for (User student : activeStudents) {
                Notification notification = Notification.builder()
                        .recipient(student)
                        .type(Notification.NotificationType.NEW_COURSE_CREATED)
                        .title("📚 New Course Available")
                        .message(message)
                        .redirectUrl("/student") // Redirect to student dashboard
                        .relatedCourse(course)
                        .relatedUser(teacher) // This can be null, which is fine
                        .createdAt(LocalDateTime.now())
                        .isRead(false)
                        .build();
                        
                notificationRepository.save(notification);
            }
            log.info("Created {} new course notifications for course: {}", activeStudents.size(), course.getTitle());
        } catch (Exception e) {
            log.error("Error creating new course notifications for course: " + course.getTitle(), e);
        }
    }
    
    // Teacher course assignment notification
    public void createTeacherCourseAssignmentNotification(User teacher, Course course) {
        // Only send notification if teacher is ACTIVE
        if (teacher.getStatus() != UserStatus.ACTIVE) {
            log.info("Skipping notification for teacher {} - not ACTIVE (status: {})", teacher.getEmail(), teacher.getStatus());
            return;
        }
        
        String redirectUrl = String.format("/teacher/%s", course.getCourseCode());
        
        Notification notification = Notification.builder()
                .recipient(teacher)
                .type(Notification.NotificationType.TEACHER_COURSE_ASSIGNMENT)
                .title("New Course Assignment")
                .message(String.format("You have been assigned to teach the course: %s (%s)", 
                    course.getTitle(), course.getCourseCode()))
                .redirectUrl(redirectUrl)
                .relatedCourse(course)
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .build();
                
        notificationRepository.save(notification);
    }
}
