package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FacultyFeedbackService {

    private final FacultyFeedbackRepository feedbackRepository;
    private final UserRepository userRepository;
    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final NotificationService notificationService;

    /**
     * Submit new faculty feedback
     */
    @Transactional
    public FacultyFeedbackResponse submitFeedback(FacultyFeedbackRequest request) {
        log.info("Submitting faculty feedback from student {} for teacher {} in course {}", 
                request.getStudentId(), request.getTeacherId(), request.getCourseId());

        // Validate student exists and is active
        User student = userRepository.findById(request.getStudentId())
                .orElseThrow(() -> new RuntimeException("Student not found"));
        
        if (!student.isApproved() || student.getStatus() != UserStatus.ACTIVE) {
            throw new RuntimeException("Student account is not active");
        }

        // Validate teacher exists and is active
        User teacher = userRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        if (!teacher.isApproved() || teacher.getStatus() != UserStatus.ACTIVE || teacher.getRole() != Role.TEACHER) {
            throw new RuntimeException("Invalid teacher");
        }

        // Validate course exists
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));

                // Validate student is enrolled in the course
        Optional<CourseEnrollment> enrollment = enrollmentRepository
                .findByStudentAndCourse(student, course);
        
        if (enrollment.isEmpty() || enrollment.get().getStatus() != EnrollmentStatus.APPROVED) {
            throw new RuntimeException("Student is not enrolled in this course");
        }

        // Validate teacher is assigned to this course
        if (course.getAssignedTeacher() == null || !course.getAssignedTeacher().getId().equals(request.getTeacherId())) {
            throw new RuntimeException("Teacher is not assigned to this course");
        }

        // Check if feedback already exists (update if exists, create if new)
        Optional<FacultyFeedback> existingFeedback = feedbackRepository
                .findByStudentIdAndCourseId(request.getStudentId(), request.getCourseId());

        FacultyFeedback feedback;
        if (existingFeedback.isPresent()) {
            // Update existing feedback
            feedback = existingFeedback.get();
            feedback.setTeachingQuality(request.getTeachingQuality());
            feedback.setCourseContent(request.getCourseContent());
            feedback.setResponsiveness(request.getResponsiveness());
            feedback.setOverallSatisfaction(request.getOverallSatisfaction());
            feedback.setComments(request.getComments());
            feedback.setIsAnonymous(request.getIsAnonymous());
            feedback.setUpdatedAt(LocalDateTime.now());
            log.info("Updating existing feedback with ID: {}", feedback.getId());
        } else {
            // Create new feedback
            feedback = new FacultyFeedback();
            feedback.setStudentId(request.getStudentId());
            feedback.setTeacherId(request.getTeacherId());
            feedback.setCourseId(request.getCourseId());
            feedback.setTeachingQuality(request.getTeachingQuality());
            feedback.setCourseContent(request.getCourseContent());
            feedback.setResponsiveness(request.getResponsiveness());
            feedback.setOverallSatisfaction(request.getOverallSatisfaction());
            feedback.setComments(request.getComments());
            feedback.setIsAnonymous(request.getIsAnonymous() != null ? request.getIsAnonymous() : true);
            log.info("Creating new feedback");
        }

        // Save feedback
        feedback = feedbackRepository.save(feedback);

        // Send notification to teacher about new feedback
        try {
            String notificationTitle = "New Student Feedback Received";
            String notificationMessage;
            String notificationLink = "/teacher/feedback";
            
            if (existingFeedback.isPresent()) {
                // Updated feedback
                notificationMessage = String.format(
                    "A student has updated their feedback for your course '%s'. %s",
                    course.getTitle(),
                    feedback.getIsAnonymous() ? "The feedback is anonymous." : 
                    String.format("Feedback submitted by %s.", student.getName())
                );
            } else {
                // New feedback
                notificationMessage = String.format(
                    "You received new feedback for your course '%s'. %s",
                    course.getTitle(),
                    feedback.getIsAnonymous() ? "The feedback is anonymous." : 
                    String.format("Feedback submitted by %s.", student.getName())
                );
            }
            
            notificationService.createNotification(
                teacher.getId(),
                Notification.NotificationType.FACULTY_FEEDBACK,
                notificationTitle,
                notificationMessage,
                notificationLink,
                course,      // relatedCourse
                null,        // relatedAssignment
                student,     // relatedUser (the student who gave feedback)
                null         // relatedThreadId
            );
            
            log.info("Notification sent to teacher {} about feedback submission", teacher.getId());
        } catch (Exception e) {
            log.error("Failed to send notification to teacher {}: {}", teacher.getId(), e.getMessage());
            // Don't fail the main operation if notification fails
        }

        // Load relationships for response
        feedback.setStudent(student);
        feedback.setTeacher(teacher);
        feedback.setCourse(course);

        log.info("Faculty feedback saved successfully with ID: {}", feedback.getId());
        return new FacultyFeedbackResponse(feedback);
    }

    /**
     * Get feedback submitted by a specific student for a specific course
     */
    public FacultyFeedbackResponse getStudentFeedbackForCourse(Long studentId, Long courseId) {
        log.info("Fetching feedback for student {} in course {}", studentId, courseId);

        Optional<FacultyFeedback> feedback = feedbackRepository.findByStudentIdAndCourseId(studentId, courseId);
        
        if (feedback.isEmpty()) {
            throw new RuntimeException("No feedback found for this student in this course");
        }

        FacultyFeedback feedbackEntity = feedback.get();
        
        // Load relationships
        feedbackEntity.setStudent(userRepository.findById(feedbackEntity.getStudentId()).orElse(null));
        feedbackEntity.setTeacher(userRepository.findById(feedbackEntity.getTeacherId()).orElse(null));
        feedbackEntity.setCourse(courseRepository.findById(feedbackEntity.getCourseId()).orElse(null));

        return new FacultyFeedbackResponse(feedbackEntity);
    }

    /**
     * Get all feedback for a specific teacher (teacher view)
     */
    public List<FacultyFeedbackResponse> getTeacherFeedback(Long teacherId) {
        log.info("Fetching all feedback for teacher {}", teacherId);

        // Validate teacher exists
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        if (teacher.getRole() != Role.TEACHER) {
            throw new RuntimeException("User is not a teacher");
        }

        List<FacultyFeedback> feedbackList = feedbackRepository.findByTeacherIdOrderBySubmittedAtDesc(teacherId);

        return feedbackList.stream().map(feedback -> {
            // Load relationships
            feedback.setStudent(userRepository.findById(feedback.getStudentId()).orElse(null));
            feedback.setTeacher(teacher);
            feedback.setCourse(courseRepository.findById(feedback.getCourseId()).orElse(null));
            
            // Return teacher-specific view (anonymized if needed)
            return FacultyFeedbackResponse.forTeacher(feedback);
        }).collect(Collectors.toList());
    }

    /**
     * Get feedback for a specific teacher in a specific course
     */
    public List<FacultyFeedbackResponse> getTeacherCourseFeedback(Long teacherId, Long courseId) {
        log.info("Fetching feedback for teacher {} in course {}", teacherId, courseId);

        // Validate teacher and course
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        if (teacher.getRole() != Role.TEACHER) {
            throw new RuntimeException("User is not a teacher");
        }

        // Validate teacher is assigned to this course
        if (course.getAssignedTeacher() == null || !course.getAssignedTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("Teacher is not assigned to this course");
        }

        List<FacultyFeedback> feedbackList = feedbackRepository.findByTeacherIdAndCourseIdOrderBySubmittedAtDesc(teacherId, courseId);

        return feedbackList.stream().map(feedback -> {
            // Load relationships
            feedback.setStudent(userRepository.findById(feedback.getStudentId()).orElse(null));
            feedback.setTeacher(teacher);
            feedback.setCourse(course);
            
            return FacultyFeedbackResponse.forTeacher(feedback);
        }).collect(Collectors.toList());
    }

    /**
     * Get all feedback submitted by a specific student
     */
    public List<FacultyFeedbackResponse> getStudentFeedback(Long studentId) {
        log.info("Fetching all feedback submitted by student {}", studentId);

        // Validate student exists
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        List<FacultyFeedback> feedbackList = feedbackRepository.findByStudentIdOrderBySubmittedAtDesc(studentId);

        return feedbackList.stream().map(feedback -> {
            // Load relationships
            feedback.setStudent(student);
            feedback.setTeacher(userRepository.findById(feedback.getTeacherId()).orElse(null));
            feedback.setCourse(courseRepository.findById(feedback.getCourseId()).orElse(null));
            
            return new FacultyFeedbackResponse(feedback);
        }).collect(Collectors.toList());
    }

    /**
     * Get teacher statistics including average ratings
     */
    public TeacherFeedbackStats getTeacherStats(Long teacherId) {
        log.info("Fetching statistics for teacher {}", teacherId);

        // Validate teacher exists
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        if (teacher.getRole() != Role.TEACHER) {
            throw new RuntimeException("User is not a teacher");
        }

        Object[] results = feedbackRepository.getTeacherAverageRatings(teacherId);
        
        if (results != null && results.length == 5) {
            Double avgTeaching = (Double) results[0];
            Double avgContent = (Double) results[1];
            Double avgResponsiveness = (Double) results[2];
            Double avgOverall = (Double) results[3];
            Long totalFeedback = (Long) results[4];

            return new TeacherFeedbackStats(
                teacher.getId(),
                teacher.getName(),
                avgTeaching != null ? avgTeaching : 0.0,
                avgContent != null ? avgContent : 0.0,
                avgResponsiveness != null ? avgResponsiveness : 0.0,
                avgOverall != null ? avgOverall : 0.0,
                totalFeedback != null ? totalFeedback : 0L
            );
        }

        return new TeacherFeedbackStats(teacher.getId(), teacher.getName(), 0.0, 0.0, 0.0, 0.0, 0L);
    }

    /**
     * Delete feedback (admin only or for cleanup)
     */
    @Transactional
    public void deleteFeedback(Long feedbackId) {
        log.info("Deleting feedback with ID: {}", feedbackId);
        
        if (!feedbackRepository.existsById(feedbackId)) {
            throw new RuntimeException("Feedback not found");
        }
        
        feedbackRepository.deleteById(feedbackId);
        log.info("Feedback deleted successfully");
    }

    /**
     * Statistics response class
     */
    public static class TeacherFeedbackStats {
        public final Long teacherId;
        public final String teacherName;
        public final Double averageTeachingQuality;
        public final Double averageCourseContent;
        public final Double averageResponsiveness;
        public final Double averageOverallSatisfaction;
        public final Long totalFeedbackCount;
        public final Double overallAverage;

        public TeacherFeedbackStats(Long teacherId, String teacherName, 
                                  Double avgTeaching, Double avgContent, 
                                  Double avgResponsiveness, Double avgOverall, 
                                  Long totalCount) {
            this.teacherId = teacherId;
            this.teacherName = teacherName;
            this.averageTeachingQuality = avgTeaching;
            this.averageCourseContent = avgContent;
            this.averageResponsiveness = avgResponsiveness;
            this.averageOverallSatisfaction = avgOverall;
            this.totalFeedbackCount = totalCount;
            
            // Calculate overall average
            if (avgTeaching != null && avgContent != null && avgResponsiveness != null && avgOverall != null) {
                this.overallAverage = (avgTeaching + avgContent + avgResponsiveness + avgOverall) / 4.0;
            } else {
                this.overallAverage = 0.0;
            }
        }
    }
}
