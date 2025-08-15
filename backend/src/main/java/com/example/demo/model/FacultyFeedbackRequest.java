package com.example.demo.model;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FacultyFeedbackRequest {
    
    @NotNull(message = "Student ID is required")
    private Long studentId;
    
    @NotNull(message = "Teacher ID is required")
    private Long teacherId;
    
    @NotNull(message = "Course ID is required")
    private Long courseId;
    
    @NotNull(message = "Teaching quality rating is required")
    @Min(value = 1, message = "Teaching quality rating must be between 1 and 5")
    @Max(value = 5, message = "Teaching quality rating must be between 1 and 5")
    private Integer teachingQuality;
    
    @NotNull(message = "Course content rating is required")
    @Min(value = 1, message = "Course content rating must be between 1 and 5")
    @Max(value = 5, message = "Course content rating must be between 1 and 5")
    private Integer courseContent;
    
    @NotNull(message = "Responsiveness rating is required")
    @Min(value = 1, message = "Responsiveness rating must be between 1 and 5")
    @Max(value = 5, message = "Responsiveness rating must be between 1 and 5")
    private Integer responsiveness;
    
    @NotNull(message = "Overall satisfaction rating is required")
    @Min(value = 1, message = "Overall satisfaction rating must be between 1 and 5")
    @Max(value = 5, message = "Overall satisfaction rating must be between 1 and 5")
    private Integer overallSatisfaction;
    
    @Size(max = 2000, message = "Comments cannot exceed 2000 characters")
    private String comments;
    
    private Boolean isAnonymous = true;
}
