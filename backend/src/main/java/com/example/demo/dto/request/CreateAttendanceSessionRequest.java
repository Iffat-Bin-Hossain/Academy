package com.example.demo.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateAttendanceSessionRequest {
    private Long courseId;
    private LocalDate sessionDate;
    private String sessionTitle;
    private String description;
    private Boolean isVisibleToStudents = true;
}
