package com.example.demo.controller;

import com.example.demo.model.*;
import com.example.demo.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;

    // ============ BASIC CRUD ENDPOINTS ============
    
    // CREATE a new course (Admin only)
    @PostMapping
    public Course createCourse(@RequestBody Course course) {
        return courseService.createCourse(course);
    }
    
    // GET all courses (Public endpoint for listing)
    @GetMapping
    public List<Course> getAllCourses() {
        return courseService.getAllCourses();
    }
    
    // GET course by ID
    @GetMapping("/{courseId}")
    public Course getCourse(@PathVariable Long courseId) {
        return courseService.getCourseById(courseId);
    }
    
    // UPDATE course (Admin only)
    @PutMapping("/{courseId}")
    public Course updateCourse(@PathVariable Long courseId, @RequestBody Course course) {
        return courseService.updateCourse(courseId, course);
    }
    
    // DELETE course (Admin only)
    @DeleteMapping("/{courseId}")
    public String deleteCourse(@PathVariable Long courseId) {
        return courseService.deleteCourse(courseId);
    }

    // ============ ENROLLMENT MANAGEMENT ============

    // ADMIN assigns teacher
    @PostMapping("/assign")
    public String assignTeacher(@RequestParam Long courseId, @RequestParam Long teacherId) {
        return courseService.assignTeacherToCourse(courseId, teacherId);
    }

    // STUDENT sends enrollment request
    @PostMapping("/enroll")
    public String enroll(@RequestParam Long courseId, @RequestParam Long studentId) {
        return courseService.requestEnrollment(courseId, studentId);
    }

    // TEACHER sees requests
    @GetMapping("/{courseId}/pending")
    public List<CourseEnrollment> getPending(@PathVariable Long courseId) {
        return courseService.getPendingEnrollments(courseId);
    }

    // TEACHER approves/rejects
    @PostMapping("/decide")
    public String decide(
            @RequestParam Long enrollmentId,
            @RequestParam boolean approve,
            @RequestParam Long teacherId
    ) {
        return courseService.decideEnrollment(enrollmentId, approve, teacherId);
    }

    // STUDENT: view enrolled
    @GetMapping("/student/{studentId}")
    public List<CourseEnrollment> getEnrolled(@PathVariable Long studentId) {
        return courseService.getMyCourses(studentId);
    }

    // TEACHER: view assigned
    @GetMapping("/teacher/{teacherId}")
    public List<Course> getAssigned(@PathVariable Long teacherId) {
        return courseService.getAssignedCourses(teacherId);
    }
}
