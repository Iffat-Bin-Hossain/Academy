package com.example.demo.service;

import com.example.demo.model.Course;
import com.example.demo.model.CourseTeacher;
import com.example.demo.model.User;
import com.example.demo.repository.CourseRepository;
import com.example.demo.repository.CourseTeacherRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class CourseTeacherService {
    
    private final CourseTeacherRepository courseTeacherRepository;
    private final CourseRepository courseRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    
    /**
     * Add a teacher to a course
     */
    public String addTeacherToCourse(Long courseId, Long teacherId, String role) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));
        
        User teacher = userRepository.findById(teacherId)
            .orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        if (!teacher.getRole().equals("TEACHER")) {
            throw new RuntimeException("User is not a teacher");
        }
        
        if (!teacher.isApproved()) {
            throw new RuntimeException("Teacher is not approved");
        }
        
        // Check if teacher is already assigned to this course
        if (courseTeacherRepository.existsByCourseAndTeacherAndActiveTrue(course, teacher)) {
            throw new RuntimeException("Teacher is already assigned to this course");
        }
        
        // If this is the first teacher or role is PRIMARY, make it primary
        boolean isPrimary = role.equals("PRIMARY") || 
                          courseTeacherRepository.countByCourseAndActiveTrue(course) == 0;
        
        String teacherRole = isPrimary ? "PRIMARY" : (role != null ? role : "TEACHER");
        
        User previousPrimaryTeacher = null;
        
        // If setting as PRIMARY, demote existing primary teacher
        if (isPrimary) {
            Optional<CourseTeacher> existingPrimary = courseTeacherRepository.findPrimaryTeacher(course);
            if (existingPrimary.isPresent()) {
                CourseTeacher existing = existingPrimary.get();
                previousPrimaryTeacher = existing.getTeacher();
                existing.setRole("TEACHER");
                courseTeacherRepository.save(existing);
                
                log.info("Demoting existing primary teacher {} from course {}", 
                    previousPrimaryTeacher.getName(), course.getTitle());
            }
        }
        
        CourseTeacher courseTeacher = CourseTeacher.builder()
            .course(course)
            .teacher(teacher)
            .role(teacherRole)
            .active(true)
            .build();
        
        courseTeacherRepository.save(courseTeacher);
        
        // Update backward compatibility field if this is primary teacher
        if (isPrimary) {
            course.setAssignedTeacher(teacher);
            courseRepository.save(course);
        }
        
        // Send notifications
        try {
            if (previousPrimaryTeacher != null) {
                // This is a replacement scenario
                // Notify the new teacher that they are replacing someone
                notificationService.notifyTeacherCourseReplacement(
                    teacher.getId(), course, previousPrimaryTeacher, null);
                
                // Notify the old teacher that they are being replaced
                notificationService.notifyTeacherBeingReplaced(
                    previousPrimaryTeacher.getId(), course, teacher, null);
            } else {
                // This is a regular assignment
                notificationService.createTeacherCourseAssignmentNotification(
                    teacher, course);
            }
        } catch (Exception e) {
            log.warn("Failed to send teacher assignment notification: {}", e.getMessage());
        }
        
        return "Teacher " + teacher.getName() + " assigned to course " + course.getTitle() + 
               " as " + teacherRole;
    }
    
    /**
     * Remove a teacher from a course
     */
    public String removeTeacherFromCourse(Long courseId, Long teacherId) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));
        
        User teacher = userRepository.findById(teacherId)
            .orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        Optional<CourseTeacher> courseTeacher = 
            courseTeacherRepository.findByCourseAndTeacherAndActiveTrue(course, teacher);
        
        if (courseTeacher.isEmpty()) {
            throw new RuntimeException("Teacher is not assigned to this course");
        }
        
        CourseTeacher ct = courseTeacher.get();
        boolean wasPrimary = ct.getRole().equals("PRIMARY");
        
        // Deactivate the assignment
        ct.setActive(false);
        courseTeacherRepository.save(ct);
        
        // If removed teacher was primary, assign new primary or clear backward compatibility field
        if (wasPrimary) {
            List<CourseTeacher> remainingTeachers = courseTeacherRepository.findByCourseAndActiveTrue(course);
            if (!remainingTeachers.isEmpty()) {
                // Promote first remaining teacher to primary
                CourseTeacher newPrimary = remainingTeachers.get(0);
                newPrimary.setRole("PRIMARY");
                courseTeacherRepository.save(newPrimary);
                course.setAssignedTeacher(newPrimary.getTeacher());
            } else {
                course.setAssignedTeacher(null);
            }
            courseRepository.save(course);
        }
        
        // Send removal notification to the removed teacher
        try {
            notificationService.notifyTeacherCourseRemoval(
                teacher.getId(), course, null);
            log.info("Sent course removal notification to teacher {} for course {}", 
                teacher.getName(), course.getTitle());
        } catch (Exception e) {
            log.warn("Failed to send teacher removal notification: {}", e.getMessage());
        }
        
        return "Teacher " + teacher.getName() + " removed from course " + course.getTitle();
    }
    
    /**
     * Get all teachers for a course
     */
    public List<CourseTeacher> getCourseTeachers(Long courseId) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));
        
        return courseTeacherRepository.findByCourseAndActiveTrue(course);
    }
    
    /**
     * Get all courses for a teacher
     */
    public List<CourseTeacher> getTeacherCourses(Long teacherId) {
        User teacher = userRepository.findById(teacherId)
            .orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        return courseTeacherRepository.findByTeacherAndActiveTrue(teacher);
    }
    
    /**
     * Update teacher role in a course
     */
    public String updateTeacherRole(Long courseId, Long teacherId, String newRole) {
        Course course = courseRepository.findById(courseId)
            .orElseThrow(() -> new RuntimeException("Course not found"));
        
        User teacher = userRepository.findById(teacherId)
            .orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        Optional<CourseTeacher> courseTeacher = 
            courseTeacherRepository.findByCourseAndTeacherAndActiveTrue(course, teacher);
        
        if (courseTeacher.isEmpty()) {
            throw new RuntimeException("Teacher is not assigned to this course");
        }
        
        CourseTeacher ct = courseTeacher.get();
        String oldRole = ct.getRole();
        
        User previousPrimaryTeacher = null;
        
        // If promoting to PRIMARY, demote existing primary
        if (newRole.equals("PRIMARY") && !oldRole.equals("PRIMARY")) {
            Optional<CourseTeacher> existingPrimary = courseTeacherRepository.findPrimaryTeacher(course);
            if (existingPrimary.isPresent()) {
                CourseTeacher existing = existingPrimary.get();
                previousPrimaryTeacher = existing.getTeacher();
                existing.setRole("TEACHER");
                courseTeacherRepository.save(existing);
                
                log.info("Demoting existing primary teacher {} from course {}", 
                    previousPrimaryTeacher.getName(), course.getTitle());
            }
            
            // Update backward compatibility
            course.setAssignedTeacher(teacher);
            courseRepository.save(course);
        }
        
        ct.setRole(newRole);
        courseTeacherRepository.save(ct);
        
        // Send notifications for role change
        try {
            if (newRole.equals("PRIMARY") && previousPrimaryTeacher != null) {
                // This is a replacement scenario - new primary teacher replaces old one
                notificationService.notifyTeacherCourseReplacement(
                    teacher.getId(), course, previousPrimaryTeacher, null);
                
                // Notify the old primary teacher that they are being replaced
                notificationService.notifyTeacherBeingReplaced(
                    previousPrimaryTeacher.getId(), course, teacher, null);
            }
        } catch (Exception e) {
            log.warn("Failed to send teacher role change notification: {}", e.getMessage());
        }
        
        return "Teacher " + teacher.getName() + " role updated from " + oldRole + " to " + newRole;
    }
}
