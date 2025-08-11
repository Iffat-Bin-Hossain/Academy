package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepo;
    private final CourseEnrollmentRepository enrollmentRepo;
    private final UserRepository userRepo;
    private final AssignmentRepository assignmentRepo;
    private final CourseTeacherRepository courseTeacherRepo;
    private final NotificationRepository notificationRepo;
    private final AnnouncementRepository announcementRepo;
    private final ResourceRepository resourceRepo;
    private final DiscussionThreadRepository discussionThreadRepo;
    private final DiscussionPostRepository discussionPostRepo;
    private final PostReactionRepository postReactionRepo;
    private final AssignmentFileRepository assignmentFileRepo;
    private final StudentSubmissionRepository studentSubmissionRepo;
    private final SubmissionFileRepository submissionFileRepo;
    private final AttendanceSessionRepository attendanceSessionRepo;
    private final AttendanceRecordRepository attendanceRecordRepo;
    private final NotificationService notificationService;

    // ============ BASIC CRUD OPERATIONS ============
    
    public Course createCourse(Course course) {
        // Check if course code already exists
        if (courseRepo.existsByCourseCode(course.getCourseCode())) {
            throw new RuntimeException("Course with same code exists already");
        }
        
        Course savedCourse = courseRepo.save(course);
        
        // Always notify all students about the new course
        // Pass the admin who created the course as the creator
        notificationService.createNewCourseNotification(savedCourse, savedCourse.getAssignedTeacher());
        
        return savedCourse;
    }
    
    public List<Course> getAllCourses() {
        return courseRepo.findAll();
    }
    
    public Course getCourseById(Long courseId) {
        return courseRepo.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
    }
    
    public Course updateCourse(Long courseId, Course updatedCourse) {
        Course existingCourse = getCourseById(courseId);
        
        // Check if the course code is being changed and if it conflicts with existing courses
        if (!existingCourse.getCourseCode().equals(updatedCourse.getCourseCode())) {
            if (courseRepo.existsByCourseCode(updatedCourse.getCourseCode())) {
                throw new RuntimeException("Course with same code exists already");
            }
        }
        
        existingCourse.setCourseCode(updatedCourse.getCourseCode());
        existingCourse.setTitle(updatedCourse.getTitle());
        existingCourse.setDescription(updatedCourse.getDescription());
        existingCourse.setAssignedTeacher(updatedCourse.getAssignedTeacher());
        return courseRepo.save(existingCourse);
    }
    
    public String deleteCourse(Long courseId) {
        Course course = getCourseById(courseId);
        
        // Delete all related entities to avoid foreign key constraint violations
        // Order is important to prevent FK constraint issues
        
        // 1. Delete all notifications related to this course
        List<Notification> courseNotifications = notificationRepo.findByRelatedCourse(course);
        notificationRepo.deleteAll(courseNotifications);
        
        // 2. Delete all discussion data for this course in proper order
        List<DiscussionThread> discussionThreads = discussionThreadRepo.findByCourse(course);
        for (DiscussionThread thread : discussionThreads) {
            // First, delete all post reactions for posts in this thread
            List<DiscussionPost> allPosts = discussionPostRepo.findByThreadAndIsDeletedFalseOrderByCreatedAtAsc(thread);
            for (DiscussionPost post : allPosts) {
                List<PostReaction> reactions = postReactionRepo.findByPost(post);
                postReactionRepo.deleteAll(reactions);
            }
            
            // Then, delete all discussion posts in this thread (including replies)
            discussionPostRepo.deleteAll(allPosts);
        }
        // Finally, delete all discussion threads
        discussionThreadRepo.deleteAll(discussionThreads);
        
        // 3. Delete all resources for this course (active and inactive)
        List<Resource> allCourseResources = resourceRepo.findByCourse(course);
        resourceRepo.deleteAll(allCourseResources);
        
        // 4. Delete all announcements for this course
        List<Announcement> announcements = announcementRepo.findByCourse(course);
        announcementRepo.deleteAll(announcements);
        
        // 5. Delete all attendance data for this course
        List<AttendanceSession> attendanceSessions = attendanceSessionRepo.findByCourseOrderBySessionDateDesc(course);
        for (AttendanceSession session : attendanceSessions) {
            // First delete all attendance records for this session
            List<AttendanceRecord> attendanceRecords = attendanceRecordRepo.findBySessionOrderByStudentNameAsc(session);
            attendanceRecordRepo.deleteAll(attendanceRecords);
        }
        // Then delete all attendance sessions
        attendanceSessionRepo.deleteAll(attendanceSessions);
        
        // 6. Delete all enrollments for this course
        List<CourseEnrollment> enrollments = enrollmentRepo.findByCourse(course);
        enrollmentRepo.deleteAll(enrollments);
        
        // 7. Delete assignment-related data in correct order
        List<Assignment> allAssignments = assignmentRepo.findByCourseOrderByCreatedAtDesc(course);
        for (Assignment assignment : allAssignments) {
            // First, delete all submission files for student submissions of this assignment
            List<StudentSubmission> submissions = studentSubmissionRepo.findByAssignmentOrderBySubmittedAtAsc(assignment);
            for (StudentSubmission submission : submissions) {
                List<SubmissionFile> submissionFiles = submissionFileRepo.findBySubmissionOrderByUploadedAtAsc(submission);
                submissionFileRepo.deleteAll(submissionFiles);
            }
            
            // Then, delete all student submissions for this assignment
            studentSubmissionRepo.deleteAll(submissions);
            
            // Next, delete all assignment files for this assignment
            List<AssignmentFile> assignmentFiles = assignmentFileRepo.findByAssignmentOrderByUploadedAtDesc(assignment);
            assignmentFileRepo.deleteAll(assignmentFiles);
        }
        
        // 8. Now safely delete all assignments
        assignmentRepo.deleteAll(allAssignments);
        
        // 9. Delete all course-teacher assignments (active and inactive)
        List<CourseTeacher> activeCourseTeachers = courseTeacherRepo.findByCourseAndActiveTrue(course);
        List<CourseTeacher> inactiveCourseTeachers = courseTeacherRepo.findByCourseAndActiveFalse(course);
        courseTeacherRepo.deleteAll(activeCourseTeachers);
        courseTeacherRepo.deleteAll(inactiveCourseTeachers);
        
        // 10. Finally, delete the course itself
        courseRepo.delete(course);
        
        return "✅ Course deleted successfully with all related data (notifications, discussion post reactions, discussion posts, discussion threads, resources, announcements, attendance records, attendance sessions, enrollments, assignment files, student submissions, submission files, assignments, and teacher assignments)";
    }

    // ============ ENROLLMENT MANAGEMENT ============

    // ADMIN assigns teacher
    public String assignTeacherToCourse(Long courseId, Long teacherId) {
        Course course = courseRepo.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        User teacher = userRepo.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        // Check if there's already a teacher assigned (for replacement notification)
        User previousTeacher = course.getAssignedTeacher();
        
        // Update the legacy assignedTeacher field
        course.setAssignedTeacher(teacher);
        courseRepo.save(course);
        
        // Also ensure there's an active CourseTeacher entry
        // First, deactivate any existing CourseTeacher entries for this course
        List<CourseTeacher> existingAssignments = courseTeacherRepo.findByCourseAndActiveTrue(course);
        for (CourseTeacher ct : existingAssignments) {
            ct.setActive(false);
            courseTeacherRepo.save(ct);
        }
        
        // Check if there's already an inactive entry for this teacher-course combination
        Optional<CourseTeacher> existingEntry = courseTeacherRepo.findByCourseAndTeacher(course, teacher);
        if (existingEntry.isPresent()) {
            // Reactivate the existing entry
            CourseTeacher ct = existingEntry.get();
            ct.setActive(true);
            ct.setRole("PRIMARY");
            courseTeacherRepo.save(ct);
        } else {
            // Create a new CourseTeacher entry
            CourseTeacher courseTeacher = CourseTeacher.builder()
                    .course(course)
                    .teacher(teacher)
                    .role("PRIMARY")
                    .active(true)
                    .build();
            courseTeacherRepo.save(courseTeacher);
        }
        
        // Send appropriate notification
        try {
            if (previousTeacher != null && !previousTeacher.getId().equals(teacherId)) {
                // This is a replacement scenario
                // Notify the new teacher that they are replacing someone
                notificationService.notifyTeacherCourseReplacement(
                    teacher.getId(), course, previousTeacher, null);
                
                // Notify the old teacher that they are being replaced
                notificationService.notifyTeacherBeingReplaced(
                    previousTeacher.getId(), course, teacher, null);
            } else {
                // This is a regular assignment
                notificationService.createTeacherCourseAssignmentNotification(teacher, course);
            }
        } catch (Exception e) {
            // Log error but don't fail the assignment
            System.err.println("Failed to send teacher assignment notification: " + e.getMessage());
        }
        
        return "✅ Teacher assigned to course";
    }

    // ADMIN removes teacher from course
    public String removeTeacherFromCourse(Long courseId) {
        Course course = courseRepo.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Get the current teacher for notification (before removing)
        User currentTeacher = course.getAssignedTeacher();
        
        // Clear the legacy assignedTeacher field
        course.setAssignedTeacher(null);
        courseRepo.save(course);
        
        // Also deactivate all CourseTeacher entries for this course
        List<CourseTeacher> existingAssignments = courseTeacherRepo.findByCourseAndActiveTrue(course);
        for (CourseTeacher ct : existingAssignments) {
            ct.setActive(false);
            courseTeacherRepo.save(ct);
        }
        
        // Send removal notification to the removed teacher
        if (currentTeacher != null) {
            try {
                notificationService.notifyTeacherCourseRemoval(
                    currentTeacher.getId(), course, null);
            } catch (Exception e) {
                // Log error but don't fail the removal
                System.err.println("Failed to send teacher removal notification: " + e.getMessage());
            }
        }
        
        return "✅ Teacher removed from course";
    }

    // STUDENT requests to enroll
    public String requestEnrollment(Long courseId, Long studentId) {
        Course course = courseRepo.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        User student = userRepo.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        if (enrollmentRepo.findByStudentAndCourse(student, course).isPresent()) {
            return "⚠️ Already requested or enrolled";
        }

        CourseEnrollment enrollment = CourseEnrollment.builder()
                .course(course)
                .student(student)
                .status(EnrollmentStatus.PENDING)
                .enrolledAt(LocalDateTime.now())
                .build();

        enrollmentRepo.save(enrollment);
        
        // Notify teacher about new enrollment request
        notificationService.createEnrollmentRequestNotification(course.getAssignedTeacher(), course, student);
        
        return "✅ Enrollment request sent";
    }

    // TEACHER views pending requests
    public List<CourseEnrollment> getPendingEnrollments(Long courseId) {
        Course course = courseRepo.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        return enrollmentRepo.findByCourseAndStatus(course, EnrollmentStatus.PENDING);
    }

    // TEACHER approves/rejects student
    public String decideEnrollment(Long enrollmentId, boolean approve, Long teacherId) {
        CourseEnrollment enrollment = enrollmentRepo.findById(enrollmentId)
                .orElseThrow(() -> new RuntimeException("Request not found"));

        User teacher = userRepo.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        if (!enrollment.getCourse().getAssignedTeacher().getId().equals(teacherId)) {
            return "❌ You are not the assigned teacher for this course";
        }

        enrollment.setStatus(approve ? EnrollmentStatus.APPROVED : EnrollmentStatus.REJECTED);
        enrollment.setActionBy(teacher);
        enrollment.setDecisionAt(LocalDateTime.now());
        enrollmentRepo.save(enrollment);

        // Notify student about enrollment decision
        notificationService.createEnrollmentDecisionNotification(enrollment.getStudent(), enrollment.getCourse(), approve);

        return approve ? "✅ Enrollment approved" : "❌ Enrollment rejected";
    }

    // STUDENT: view all enrollments (approved, pending, retaking)
    public List<CourseEnrollment> getMyCourses(Long studentId) {
        User student = userRepo.findById(studentId).orElseThrow();
        return enrollmentRepo.findByStudent(student);
    }

    // TEACHER: view assigned courses
    public List<Course> getAssignedCourses(Long teacherId) {
        User teacher = userRepo.findById(teacherId).orElseThrow();
        return courseRepo.findByAssignedTeacher(teacher);
    }

    // ADMIN: get all enrollments for a course
    public List<CourseEnrollment> getAllEnrollments(Long courseId) {
        Course course = courseRepo.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        return enrollmentRepo.findByCourse(course);
    }

    // STUDENT: retake course
    public String retakeCourse(Long courseId, Long studentId) {
        Course course = courseRepo.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        User student = userRepo.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Find existing enrollment
        CourseEnrollment existingEnrollment = enrollmentRepo.findByStudentAndCourse(student, course)
                .orElseThrow(() -> new RuntimeException("No existing enrollment found for this course"));

        // Only allow retake if student was previously approved
        if (existingEnrollment.getStatus() != EnrollmentStatus.APPROVED) {
            throw new RuntimeException("Can only retake courses that were previously approved");
        }

        // Update status to RETAKING
        existingEnrollment.setStatus(EnrollmentStatus.RETAKING);
        enrollmentRepo.save(existingEnrollment);

        return "Course retake request submitted successfully";
    }

    // ADMIN: Clear all courses and related data
    public String clearAllCourses() {
        List<Course> allCourses = courseRepo.findAll();
        
        for (Course course : allCourses) {
            // Delete all related entities for each course
            // Order is important to prevent FK constraint issues
            
            // 1. Delete all notifications related to this course
            List<Notification> courseNotifications = notificationRepo.findByRelatedCourse(course);
            notificationRepo.deleteAll(courseNotifications);
            
            // 2. Delete all discussion data for this course in proper order
            List<DiscussionThread> discussionThreads = discussionThreadRepo.findByCourse(course);
            for (DiscussionThread thread : discussionThreads) {
                // First, delete all post reactions for posts in this thread
                List<DiscussionPost> allPosts = discussionPostRepo.findByThreadAndIsDeletedFalseOrderByCreatedAtAsc(thread);
                for (DiscussionPost post : allPosts) {
                    List<PostReaction> reactions = postReactionRepo.findByPost(post);
                    postReactionRepo.deleteAll(reactions);
                }
                
                // Then, delete all discussion posts in this thread (including replies)
                discussionPostRepo.deleteAll(allPosts);
            }
            // Finally, delete all discussion threads
            discussionThreadRepo.deleteAll(discussionThreads);
            
            // 3. Delete all resources for this course (active and inactive)
            List<Resource> allCourseResources = resourceRepo.findByCourse(course);
            resourceRepo.deleteAll(allCourseResources);
            
            // 4. Delete all announcements for this course
            List<Announcement> announcements = announcementRepo.findByCourse(course);
            announcementRepo.deleteAll(announcements);
            
            // 5. Delete all attendance data for this course
            List<AttendanceSession> attendanceSessions = attendanceSessionRepo.findByCourseOrderBySessionDateDesc(course);
            for (AttendanceSession session : attendanceSessions) {
                // First delete all attendance records for this session
                List<AttendanceRecord> attendanceRecords = attendanceRecordRepo.findBySessionOrderByStudentNameAsc(session);
                attendanceRecordRepo.deleteAll(attendanceRecords);
            }
            // Then delete all attendance sessions
            attendanceSessionRepo.deleteAll(attendanceSessions);
            
            // 6. Delete all enrollments for this course
            List<CourseEnrollment> enrollments = enrollmentRepo.findByCourse(course);
            enrollmentRepo.deleteAll(enrollments);
            
            // 7. Delete assignment-related data in correct order
            List<Assignment> allAssignments = assignmentRepo.findByCourseOrderByCreatedAtDesc(course);
            for (Assignment assignment : allAssignments) {
                // First, delete all submission files for student submissions of this assignment
                List<StudentSubmission> submissions = studentSubmissionRepo.findByAssignmentOrderBySubmittedAtAsc(assignment);
                for (StudentSubmission submission : submissions) {
                    List<SubmissionFile> submissionFiles = submissionFileRepo.findBySubmissionOrderByUploadedAtAsc(submission);
                    submissionFileRepo.deleteAll(submissionFiles);
                }
                
                // Then, delete all student submissions for this assignment
                studentSubmissionRepo.deleteAll(submissions);
                
                // Next, delete all assignment files for this assignment
                List<AssignmentFile> assignmentFiles = assignmentFileRepo.findByAssignmentOrderByUploadedAtDesc(assignment);
                assignmentFileRepo.deleteAll(assignmentFiles);
            }
            
            // 8. Now safely delete all assignments
            assignmentRepo.deleteAll(allAssignments);
            
            // 9. Delete all course-teacher assignments (active and inactive)
            List<CourseTeacher> activeCourseTeachers = courseTeacherRepo.findByCourseAndActiveTrue(course);
            List<CourseTeacher> inactiveCourseTeachers = courseTeacherRepo.findByCourseAndActiveFalse(course);
            courseTeacherRepo.deleteAll(activeCourseTeachers);
            courseTeacherRepo.deleteAll(inactiveCourseTeachers);
        }
        
        // 10. Finally, delete all courses
        courseRepo.deleteAll(allCourses);
        
        return "✅ All courses and related data cleared successfully. Total courses removed: " + allCourses.size() + 
               " (including notifications, discussion post reactions, discussion posts, discussion threads, resources, announcements, attendance records, attendance sessions, enrollments, assignment files, student submissions, submission files, assignments, and teacher assignments)";
    }
}
