package com.example.demo.dto.request;

import com.example.demo.model.AttendanceRecord;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BulkAttendanceRequest {
    private Long sessionId;
    private AttendanceRecord.AttendanceStatus status;
    private List<Long> studentIds;
    private String notes;
}
