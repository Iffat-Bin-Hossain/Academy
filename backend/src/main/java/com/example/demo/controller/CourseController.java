package com.example.demo.controller;

import com.example.demo.model.*;
import com.example.demo.service.CourseService;
import com.example.demo.service.AssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {

    private final CourseService courseService;
    private final AssignmentService assignmentService;

    // ============ BASIC CRUD ENDPOINTS ============
    
    // CREATE a new course (Admin only)
    @PostMapping
    public ResponseEntity<?> createCourse(@RequestBody Course course) {
        try {
            Course createdCourse = courseService.createCourse(course);
            return ResponseEntity.ok(createdCourse);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
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
    public ResponseEntity<?> updateCourse(@PathVariable Long courseId, @RequestBody Course course) {
        try {
            Course updatedCourse = courseService.updateCourse(courseId, course);
            return ResponseEntity.ok(updatedCourse);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
    
    // DELETE course (Admin only)
    @DeleteMapping("/{courseId}")
    public String deleteCourse(@PathVariable Long courseId) {
        return courseService.deleteCourse(courseId);
    }

    // ADMIN: Clear all courses and related data
    @DeleteMapping("/clear-all")
    public ResponseEntity<?> clearAllCourses() {
        try {
            String result = courseService.clearAllCourses();
            return ResponseEntity.ok(Map.of("message", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to clear courses: " + e.getMessage()));
        }
    }

    // ============ ENROLLMENT MANAGEMENT ============

    // ADMIN assigns teacher
    @PostMapping("/assign")
    public String assignTeacher(@RequestParam Long courseId, @RequestParam Long teacherId) {
        return courseService.assignTeacherToCourse(courseId, teacherId);
    }

    // ADMIN removes teacher from course
    @PostMapping("/remove-teacher")
    public String removeTeacher(@RequestParam Long courseId) {
        return courseService.removeTeacherFromCourse(courseId);
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

    // TEACHER bulk approves/rejects
    @PostMapping("/decide-bulk")
    public ResponseEntity<?> decideBulk(
            @RequestParam List<Long> enrollmentIds,
            @RequestParam boolean approve,
            @RequestParam Long teacherId
    ) {
        try {
            String result = courseService.decideEnrollmentsBulk(enrollmentIds, approve, teacherId);
            return ResponseEntity.ok(Map.of("message", result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
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

    // ADMIN: get all enrollments for a course
    @GetMapping("/{courseId}/enrollments")
    public List<CourseEnrollment> getCourseEnrollments(@PathVariable Long courseId) {
        return courseService.getAllEnrollments(courseId);
    }

    // STUDENT: retake course
    @PostMapping("/retake")
    public ResponseEntity<?> retakeCourse(@RequestParam Long courseId, @RequestParam Long studentId) {
        try {
            String result = courseService.retakeCourse(courseId, studentId);
            return ResponseEntity.ok(Map.of("message", result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    // ============ ASSIGNMENT MANAGEMENT ============

    /**
     * Create a new assignment for a specific course
     * POST /api/courses/{courseId}/assignments
     */
    @PostMapping("/{courseId}/assignments")
    public ResponseEntity<?> createCourseAssignment(
            @PathVariable Long courseId,
            @RequestBody AssignmentCreateRequest request,
            @RequestParam Long teacherId) {
        try {
            // Set the courseId from the path parameter
            request.setCourseId(courseId);
            AssignmentResponse assignment = assignmentService.createAssignment(request, teacherId);
            return ResponseEntity.ok(assignment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all assignments for a course
     * GET /api/courses/{courseId}/assignments
     */
    @GetMapping("/{courseId}/assignments")
    public ResponseEntity<?> getCourseAssignments(@PathVariable Long courseId) {
        try {
            List<AssignmentResponse> assignments = assignmentService.getAssignmentsForCourse(courseId);
            return ResponseEntity.ok(assignments);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update an assignment within a course context
     * PUT /api/courses/{courseId}/assignments/{assignmentId}
     */
    @PutMapping("/{courseId}/assignments/{assignmentId}")
    public ResponseEntity<?> updateCourseAssignment(
            @PathVariable Long courseId,
            @PathVariable Long assignmentId,
            @RequestBody AssignmentUpdateRequest request,
            @RequestParam Long teacherId) {
        try {
            AssignmentResponse assignment = assignmentService.updateAssignment(assignmentId, request, teacherId);
            return ResponseEntity.ok(assignment);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete an assignment within a course context
     * DELETE /api/courses/{courseId}/assignments/{assignmentId}
     */
    @DeleteMapping("/{courseId}/assignments/{assignmentId}")
    public ResponseEntity<?> deleteCourseAssignment(
            @PathVariable Long courseId,
            @PathVariable Long assignmentId,
            @RequestParam Long teacherId) {
        try {
            String result = assignmentService.deleteAssignment(assignmentId, teacherId);
            return ResponseEntity.ok(Map.of("message", result));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

}