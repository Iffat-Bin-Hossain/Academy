package com.example.demo.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceSettingsRequest {
    private Long sessionId;
    private Boolean isLocked;
    private Boolean isVisibleToStudents;
}
