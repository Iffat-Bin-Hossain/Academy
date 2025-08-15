package com.example.demo.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FacultyFeedbackResponse {
    
    private Long id;
    private Long studentId;
    private String studentName; // Only included if not anonymous
    private Long teacherId;
    private String teacherName;
    private Long courseId;
    private String courseTitle;
    private String courseCode;
    private Integer teachingQuality;
    private Integer courseContent;
    private Integer responsiveness;
    private Integer overallSatisfaction;
    private String comments;
    private Boolean isAnonymous;
    private LocalDateTime submittedAt;
    private LocalDateTime updatedAt;
    private Double averageRating;
    
    // Constructor from entity
    public FacultyFeedbackResponse(FacultyFeedback feedback) {
        this.id = feedback.getId();
        this.studentId = feedback.getStudentId();
        this.teacherId = feedback.getTeacherId();
        this.courseId = feedback.getCourseId();
        this.teachingQuality = feedback.getTeachingQuality();
        this.courseContent = feedback.getCourseContent();
        this.responsiveness = feedback.getResponsiveness();
        this.overallSatisfaction = feedback.getOverallSatisfaction();
        this.comments = feedback.getComments();
        this.isAnonymous = feedback.getIsAnonymous();
        this.submittedAt = feedback.getSubmittedAt();
        this.updatedAt = feedback.getUpdatedAt();
        this.averageRating = feedback.getAverageRating();
        
        // Set names only if available and appropriate
        if (feedback.getStudent() != null && !feedback.getIsAnonymous()) {
            this.studentName = feedback.getStudent().getName();
        }
        if (feedback.getTeacher() != null) {
            this.teacherName = feedback.getTeacher().getName();
        }
        if (feedback.getCourse() != null) {
            this.courseTitle = feedback.getCourse().getTitle();
            this.courseCode = feedback.getCourse().getCourseCode();
        }
    }
    
    // Constructor with minimal info for anonymous feedback (teacher view)
    public static FacultyFeedbackResponse forTeacher(FacultyFeedback feedback) {
        FacultyFeedbackResponse response = new FacultyFeedbackResponse(feedback);
        if (feedback.getIsAnonymous()) {
            response.setStudentName("Anonymous Student");
        }
        return response;
    }
}
