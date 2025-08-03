package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CourseService {

    private final CourseRepository courseRepo;
    private final CourseEnrollmentRepository enrollmentRepo;
    private final UserRepository userRepo;

    // ============ BASIC CRUD OPERATIONS ============
    
    public Course createCourse(Course course) {
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
        existingCourse.setCourseCode(updatedCourse.getCourseCode());
        existingCourse.setTitle(updatedCourse.getTitle());
        existingCourse.setDescription(updatedCourse.getDescription());
        existingCourse.setAssignedTeacher(updatedCourse.getAssignedTeacher());
        return courseRepo.save(existingCourse);
    }
    
    public String deleteCourse(Long courseId) {
        Course course = getCourseById(courseId);
        
        // First, delete all enrollments for this course to avoid foreign key constraint violations
        List<CourseEnrollment> enrollments = enrollmentRepo.findByCourse(course);
        enrollmentRepo.deleteAll(enrollments);
        
        // Now delete the course
        courseRepo.delete(course);
        return "✅ Course deleted successfully";
    }

    // ============ ENROLLMENT MANAGEMENT ============

    // ADMIN assigns teacher
    public String assignTeacherToCourse(Long courseId, Long teacherId) {
        Course course = courseRepo.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));
        User teacher = userRepo.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        course.setAssignedTeacher(teacher);
        courseRepo.save(course);
        return "✅ Teacher assigned to course";
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
        enrollmentRepo.save(enrollment);

        return approve ? "✅ Enrollment approved" : "❌ Enrollment rejected";
    }

    // STUDENT: view approved courses
    public List<CourseEnrollment> getMyCourses(Long studentId) {
        User student = userRepo.findById(studentId).orElseThrow();
        return enrollmentRepo.findByStudentAndStatus(student, EnrollmentStatus.APPROVED);
    }

    // TEACHER: view assigned courses
    public List<Course> getAssignedCourses(Long teacherId) {
        User teacher = userRepo.findById(teacherId).orElseThrow();
        return courseRepo.findByAssignedTeacher(teacher);
    }
}
