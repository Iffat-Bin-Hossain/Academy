package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class DiscussionService {

    private final DiscussionThreadRepository threadRepository;
    private final DiscussionPostRepository postRepository;
    private final PostReactionRepository reactionRepository;
    private final CourseRepository courseRepository;
    private final AssignmentRepository assignmentRepository;
    private final ResourceRepository resourceRepository;
    private final UserRepository userRepository;
    private final CourseTeacherRepository courseTeacherRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final NotificationService notificationService;

    /**
     * Create a new discussion thread (Teachers only)
     */
    public DiscussionThreadResponse createThread(DiscussionThreadCreateRequest request, Long teacherId) {
        log.info("Creating discussion thread '{}' for course {} by teacher {}", 
                request.getTitle(), request.getCourseId(), teacherId);

        // Validate teacher
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        if (!teacher.getRole().equals(Role.TEACHER)) {
            throw new RuntimeException("Only teachers can create discussion threads");
        }

        if (!teacher.isApproved()) {
            throw new RuntimeException("Teacher account is not approved");
        }

        // Validate course
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Check if teacher is assigned to this course
        boolean isAssigned = courseTeacherRepository.existsByCourseAndTeacherAndActiveTrue(course, teacher) ||
                           (course.getAssignedTeacher() != null && course.getAssignedTeacher().getId().equals(teacherId));

        if (!isAssigned) {
            throw new RuntimeException("Teacher is not assigned to this course");
        }

        // Validate assignment if provided
        Assignment assignment = null;
        if (request.getAssignmentId() != null) {
            assignment = assignmentRepository.findById(request.getAssignmentId())
                    .orElseThrow(() -> new RuntimeException("Assignment not found"));
            
            if (!assignment.getCourse().getId().equals(request.getCourseId())) {
                throw new RuntimeException("Assignment does not belong to the specified course");
            }
        }

        // Validate resource if provided
        Resource resource = null;
        if (request.getResourceId() != null) {
            resource = resourceRepository.findById(request.getResourceId())
                    .orElseThrow(() -> new RuntimeException("Resource not found"));
            
            if (!resource.getCourse().getId().equals(request.getCourseId())) {
                throw new RuntimeException("Resource does not belong to the specified course");
            }
        }

        // Create thread
        DiscussionThread thread = DiscussionThread.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .course(course)
                .createdBy(teacher)
                .assignment(assignment)
                .resource(resource)
                .resourceName(request.getResourceName())
                .isPinned(request.getIsPinned() != null ? request.getIsPinned() : false)
                .isActive(true)
                .build();

        DiscussionThread savedThread = threadRepository.save(thread);
        log.info("Discussion thread '{}' created successfully with ID: {}", savedThread.getTitle(), savedThread.getId());

        // Send notifications to enrolled students
        try {
            notificationService.createNewDiscussionThreadNotification(course, savedThread, teacher);
            log.info("Notifications sent for new discussion thread '{}'", savedThread.getTitle());
        } catch (Exception e) {
            log.warn("Failed to send notifications for new discussion thread '{}': {}", savedThread.getTitle(), e.getMessage());
        }

        return mapToThreadResponse(savedThread, null);
    }

    /**
     * Get all discussion threads for a course
     */
    public List<DiscussionThreadResponse> getThreadsForCourse(Long courseId, Long userId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user has access to this course
        validateCourseAccess(course, user);

        List<DiscussionThread> threads = threadRepository.findByCourseIdAndIsActiveTrueOrderByPinnedAndUpdated(courseId);
        
        return threads.stream()
                .map(thread -> mapToThreadResponse(thread, userId))
                .collect(Collectors.toList());
    }

    /**
     * Get a specific discussion thread with all posts
     */
    public DiscussionThreadResponse getThreadDetails(Long threadId, Long userId) {
        DiscussionThread thread = threadRepository.findById(threadId)
                .orElseThrow(() -> new RuntimeException("Discussion thread not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if user has access to this thread's course
        validateCourseAccess(thread.getCourse(), user);

        return mapToThreadResponse(thread, userId);
    }

    /**
     * Create a new post in a discussion thread
     */
    public DiscussionPostResponse createPost(DiscussionPostCreateRequest request, Long authorId) {
        log.info("Creating discussion post in thread {} by user {}", request.getThreadId(), authorId);

        // Validate user
        User author = userRepository.findById(authorId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!author.isApproved()) {
            throw new RuntimeException("User account is not approved");
        }

        // Validate thread
        DiscussionThread thread = threadRepository.findById(request.getThreadId())
                .orElseThrow(() -> new RuntimeException("Discussion thread not found"));

        if (!thread.getIsActive()) {
            throw new RuntimeException("Cannot post to an inactive thread");
        }

        // Check if user has access to this thread's course
        validateCourseAccess(thread.getCourse(), author);

        // Validate parent post if it's a reply
        DiscussionPost parentPost = null;
        if (request.getParentPostId() != null) {
            parentPost = postRepository.findById(request.getParentPostId())
                    .orElseThrow(() -> new RuntimeException("Parent post not found"));
            
            if (!parentPost.getThread().getId().equals(request.getThreadId())) {
                throw new RuntimeException("Parent post does not belong to the specified thread");
            }
        }

        // Create post
        DiscussionPost post = DiscussionPost.builder()
                .thread(thread)
                .parentPost(parentPost)
                .author(author)
                .content(request.getContent())
                .isEdited(false)
                .isDeleted(false)
                .build();

        DiscussionPost savedPost = postRepository.save(post);
        
        // Update thread's updated_at timestamp
        thread.setUpdatedAt(LocalDateTime.now());
        threadRepository.save(thread);

        // Send notifications for new posts
        try {
            if (author.getRole().equals(Role.STUDENT)) {
                // Notify teachers when student posts
                User courseTeacher = thread.getCourse().getAssignedTeacher();
                if (courseTeacher != null) {
                    notificationService.notifyDiscussionPost(
                        courseTeacher.getId(),
                        author,
                        thread.getCourse(),
                        thread.getTitle(),
                        thread.getId()
                    );
                }
            } else if (author.getRole().equals(Role.TEACHER) && parentPost != null) {
                // Notify student when teacher replies to their post
                User originalAuthor = parentPost.getAuthor();
                if (originalAuthor.getRole().equals(Role.STUDENT)) {
                    notificationService.notifyDiscussionReply(
                        originalAuthor.getId(),
                        author,
                        thread.getCourse(),
                        thread.getTitle(),
                        thread.getId()
                    );
                }
            }
        } catch (Exception e) {
            log.warn("Failed to send notification for discussion post: {}", e.getMessage());
        }

        log.info("Discussion post created successfully with ID: {}", savedPost.getId());

        return mapToPostResponse(savedPost, authorId);
    }

    /**
     * React to a post (like/unlike)
     */
    public Map<String, Object> toggleReaction(Long postId, PostReaction.ReactionType reactionType, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        DiscussionPost post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        // Check if user has access to this post's thread's course
        validateCourseAccess(post.getThread().getCourse(), user);

        Optional<PostReaction> existingReaction = reactionRepository.findByPostAndUser(post, user);
        
        if (existingReaction.isPresent()) {
            PostReaction reaction = existingReaction.get();
            if (reaction.getReactionType().equals(reactionType)) {
                // Remove reaction if same type
                reactionRepository.delete(reaction);
                log.info("Removed {} reaction from post {} by user {}", reactionType, postId, userId);
            } else {
                // Update reaction type
                reaction.setReactionType(reactionType);
                reactionRepository.save(reaction);
                log.info("Updated reaction on post {} by user {} to {}", postId, userId, reactionType);
            }
        } else {
            // Add new reaction
            PostReaction newReaction = PostReaction.builder()
                    .post(post)
                    .user(user)
                    .reactionType(reactionType)
                    .build();
            reactionRepository.save(newReaction);
            log.info("Added {} reaction to post {} by user {}", reactionType, postId, userId);
        }

        // Return updated reaction counts
        Map<String, Integer> reactionCounts = getReactionCounts(post);
        String userReaction = getUserReaction(post, user);

        Map<String, Object> response = new HashMap<>();
        response.put("reactionCounts", reactionCounts);
        response.put("userReaction", userReaction);
        
        return response;
    }

    /**
     * Search discussion threads in a course
     */
    public List<DiscussionThreadResponse> searchThreads(Long courseId, String searchTerm, Long userId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        validateCourseAccess(course, user);

        List<DiscussionThread> threads = threadRepository.searchThreadsInCourse(courseId, searchTerm);
        
        return threads.stream()
                .map(thread -> mapToThreadResponse(thread, userId))
                .collect(Collectors.toList());
    }

    /**
     * Validate if user has access to a course
     */
    private void validateCourseAccess(Course course, User user) {
        if (user.getRole().equals(Role.TEACHER)) {
            // Teachers: check if assigned to course
            boolean isAssigned = courseTeacherRepository.existsByCourseAndTeacherAndActiveTrue(course, user) ||
                               (course.getAssignedTeacher() != null && course.getAssignedTeacher().getId().equals(user.getId()));
            if (!isAssigned) {
                throw new RuntimeException("Teacher is not assigned to this course");
            }
        } else if (user.getRole().equals(Role.STUDENT)) {
            // Students: check if enrolled and approved or retaking
            Optional<CourseEnrollment> enrollment = enrollmentRepository.findByStudentAndCourse(user, course);
            if (enrollment.isEmpty() || 
                (!enrollment.get().getStatus().equals(EnrollmentStatus.APPROVED) && 
                 !enrollment.get().getStatus().equals(EnrollmentStatus.RETAKING))) {
                throw new RuntimeException("Student is not enrolled in this course");
            }
        } else if (!user.getRole().equals(Role.ADMIN)) {
            throw new RuntimeException("Access denied");
        }
    }

    /**
     * Map DiscussionThread to DiscussionThreadResponse
     */
    private DiscussionThreadResponse mapToThreadResponse(DiscussionThread thread, Long userId) {
        // Get post count
        int postCount = (int) postRepository.countByThreadAndIsDeletedFalse(thread);
        
        // Get last activity time
        List<DiscussionPost> latestPosts = postRepository.findLatestPostInThread(thread.getId());
        LocalDateTime lastActivityAt = latestPosts.isEmpty() ? thread.getCreatedAt() : latestPosts.get(0).getCreatedAt();

        // Get posts if userId is provided (for detailed view)
        List<DiscussionPostResponse> posts = null;
        if (userId != null) {
            List<DiscussionPost> threadPosts = postRepository.findByThreadAndParentPostIsNullAndIsDeletedFalseOrderByCreatedAtAsc(thread);
            posts = threadPosts.stream()
                    .map(post -> mapToPostResponse(post, userId))
                    .collect(Collectors.toList());
        }

        return DiscussionThreadResponse.builder()
                .id(thread.getId())
                .title(thread.getTitle())
                .description(thread.getDescription())
                .courseId(thread.getCourse().getId())
                .courseTitle(thread.getCourse().getTitle())
                .courseCode(thread.getCourse().getCourseCode())
                .createdById(thread.getCreatedBy().getId())
                .createdByName(thread.getCreatedBy().getName())
                .createdByRole(thread.getCreatedBy().getRole().toString())
                .assignmentId(thread.getAssignment() != null ? thread.getAssignment().getId() : null)
                .assignmentTitle(thread.getAssignment() != null ? thread.getAssignment().getTitle() : null)
                .resourceId(thread.getResource() != null ? thread.getResource().getId() : null)
                .resourceTitle(thread.getResource() != null ? thread.getResource().getTitle() : null)
                .resourceName(thread.getResourceName())
                .isActive(thread.getIsActive())
                .isPinned(thread.getIsPinned())
                .createdAt(thread.getCreatedAt())
                .updatedAt(thread.getUpdatedAt())
                .postCount(postCount)
                .lastActivityAt(lastActivityAt)
                .posts(posts)
                .build();
    }

    /**
     * Map DiscussionPost to DiscussionPostResponse
     */
    private DiscussionPostResponse mapToPostResponse(DiscussionPost post, Long userId) {
        // Get replies
        List<DiscussionPost> replyPosts = postRepository.findByParentPostAndIsDeletedFalseOrderByCreatedAtAsc(post);
        List<DiscussionPostResponse> replies = replyPosts.stream()
                .map(reply -> mapToPostResponse(reply, userId))
                .collect(Collectors.toList());

        // Get reaction counts
        Map<String, Integer> reactionCounts = getReactionCounts(post);
        
        // Get user's reaction
        User user = userId != null ? userRepository.findById(userId).orElse(null) : null;
        String userReaction = getUserReaction(post, user);

        return DiscussionPostResponse.builder()
                .id(post.getId())
                .threadId(post.getThread().getId())
                .parentPostId(post.getParentPost() != null ? post.getParentPost().getId() : null)
                .authorId(post.getAuthor().getId())
                .authorName(post.getAuthor().getName())
                .authorRole(post.getAuthor().getRole().toString())
                .content(post.getContent())
                .isEdited(post.getIsEdited())
                .isDeleted(post.getIsDeleted())
                .createdAt(post.getCreatedAt())
                .updatedAt(post.getUpdatedAt())
                .replies(replies)
                .reactionCounts(reactionCounts)
                .userReaction(userReaction)
                .build();
    }

    /**
     * Get reaction counts for a post
     */
    private Map<String, Integer> getReactionCounts(DiscussionPost post) {
        Map<String, Integer> counts = new HashMap<>();
        List<Object[]> results = reactionRepository.countReactionsByType(post.getId());
        
        for (Object[] result : results) {
            PostReaction.ReactionType type = (PostReaction.ReactionType) result[0];
            Long count = (Long) result[1];
            counts.put(type.toString(), count.intValue());
        }
        
        return counts;
    }

    /**
     * Get user's reaction to a post
     */
    private String getUserReaction(DiscussionPost post, User user) {
        if (user == null) return null;
        
        Optional<PostReaction> reaction = reactionRepository.findByPostAndUser(post, user);
        return reaction.map(r -> r.getReactionType().toString()).orElse(null);
    }
}
