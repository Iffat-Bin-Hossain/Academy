package com.example.demo.dto.response;

import com.example.demo.model.AttendanceRecord;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRecordResponse {
    private Long id;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private AttendanceRecord.AttendanceStatus status;
    private String displayStatus;
    private String statusColor;
    private Boolean teacherOverride;
    private String notes;
    private LocalDateTime updatedAt;
}
