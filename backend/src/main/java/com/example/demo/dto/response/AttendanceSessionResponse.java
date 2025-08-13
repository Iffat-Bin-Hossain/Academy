package com.example.demo.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceSessionResponse {
    private Long id;
    private Long courseId;
    private String courseCode;
    private String courseTitle;
    private LocalDate sessionDate;
    private String sessionTitle;
    private String description;
    private Boolean isLocked;
    private Boolean isVisibleToStudents;
    private String createdByName;
    private Long createdById;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<AttendanceRecordResponse> attendanceRecords;
    private Integer totalEnrolledStudents;
    private Integer totalSessions;
    private Integer presentCount;
    private Integer absentCount;
    private Double attendancePercentage;
}
