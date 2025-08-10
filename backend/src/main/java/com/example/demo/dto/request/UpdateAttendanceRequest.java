package com.example.demo.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateAttendanceRequest {
    private Long sessionId;
    private List<AttendanceUpdateItem> attendanceRecords;
}
