package com.example.demo.dto.request;

import com.example.demo.model.AttendanceRecord;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceUpdateItem {
    private Long studentId;
    private AttendanceRecord.AttendanceStatus status;
    private String notes;
    private Boolean teacherOverride = false;
}
