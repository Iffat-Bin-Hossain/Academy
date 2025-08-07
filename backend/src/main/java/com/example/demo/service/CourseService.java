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

    // ============ BASIC CRUD OPERATIONS ============
    
    public Course createCourse(Course course) {
        // Check if course code already exists
        if (courseRepo.existsByCourseCode(course.getCourseCode())) {
            throw new RuntimeException("Course with same code exists already");
        }
        return courseRepo.save(course);
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
        
        // 1. Delete all enrollments for this course
        List<CourseEnrollment> enrollments = enrollmentRepo.findByCourse(course);
        enrollmentRepo.deleteAll(enrollments);
        
        // 2. Delete ALL assignments for this course (both active and inactive)
        // This prevents foreign key constraint violations
        List<Assignment> allAssignments = assignmentRepo.findByCourseOrderByCreatedAtDesc(course);
        assignmentRepo.deleteAll(allAssignments);
        
        // 3. Delete all course-teacher assignments
        List<CourseTeacher> courseTeachers = courseTeacherRepo.findByCourseAndActiveTrue(course);
        courseTeacherRepo.deleteAll(courseTeachers);
        
        // 4. Finally, delete the course itself
        courseRepo.delete(course);
        return "✅ Course deleted successfully with all related data";
    }

    // ============ ENROLLMENT MANAGEMENT ============

    // ADMIN assigns teacher
    public String assignTeacherToCourse(Long courseId, Long teacherId) {
        Course course = courseRepo.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        User teacher = userRepo.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

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
        
        return "✅ Teacher assigned to course";
    }

    // ADMIN removes teacher from course
    public String removeTeacherFromCourse(Long courseId) {
        Course course = courseRepo.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Clear the legacy assignedTeacher field
        course.setAssignedTeacher(null);
        courseRepo.save(course);
        
        // Also deactivate all CourseTeacher entries for this course
        List<CourseTeacher> existingAssignments = courseTeacherRepo.findByCourseAndActiveTrue(course);
        for (CourseTeacher ct : existingAssignments) {
            ct.setActive(false);
            courseTeacherRepo.save(ct);
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
            
            // 1. Delete all enrollments for this course
            List<CourseEnrollment> enrollments = enrollmentRepo.findByCourse(course);
            enrollmentRepo.deleteAll(enrollments);
            
            // 2. Delete ALL assignments for this course (both active and inactive)
            // We need to use a different method that gets ALL assignments, not just active ones
            List<Assignment> allAssignments = assignmentRepo.findByCourseOrderByCreatedAtDesc(course);
            assignmentRepo.deleteAll(allAssignments);
            
            // 3. Delete all course-teacher assignments
            List<CourseTeacher> courseTeachers = courseTeacherRepo.findByCourseAndActiveTrue(course);
            courseTeacherRepo.deleteAll(courseTeachers);
        }
        
        // 4. Finally, delete all courses
        courseRepo.deleteAll(allCourses);
        
        return "✅ All courses and related data cleared successfully. Total courses removed: " + allCourses.size();
    }
}
