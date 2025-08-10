package com.example.demo.controller;

import com.example.demo.dto.request.*;
import com.example.demo.dto.response.AttendanceSessionResponse;
import com.example.demo.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:8081"})
public class AttendanceController {

    private final AttendanceService attendanceService;

    /**
     * Create new attendance session
     * POST /api/attendance/sessions
     */
    @PostMapping("/sessions")
    public ResponseEntity<?> createSession(
            @RequestBody CreateAttendanceSessionRequest request,
            @RequestParam Long teacherId) {
        try {
            AttendanceSessionResponse session = attendanceService.createSession(request, teacherId);
            return ResponseEntity.ok(Map.of(
                "message", "Attendance session created successfully",
                "session", session
            ));
        } catch (RuntimeException e) {
            log.error("Error creating attendance session: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get attendance sessions for a course (teacher view)
     * GET /api/attendance/course/{courseId}/teacher
     */
    @GetMapping("/course/{courseId}/teacher")
    public ResponseEntity<?> getTeacherCourseSessions(
            @PathVariable Long courseId,
            @RequestParam Long teacherId) {
        try {
            List<AttendanceSessionResponse> sessions = attendanceService.getCourseSessions(courseId, teacherId);
            return ResponseEntity.ok(sessions);
        } catch (RuntimeException e) {
            log.error("Error fetching teacher attendance sessions: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get attendance sessions for a course (student view)
     * GET /api/attendance/course/{courseId}/student
     */
    @GetMapping("/course/{courseId}/student")
    public ResponseEntity<?> getStudentCourseSessions(
            @PathVariable Long courseId,
            @RequestParam Long studentId) {
        try {
            List<AttendanceSessionResponse> sessions = attendanceService.getStudentSessions(courseId, studentId);
            return ResponseEntity.ok(sessions);
        } catch (RuntimeException e) {
            log.error("Error fetching student attendance sessions: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update attendance records for a session
     * PUT /api/attendance/records
     */
    @PutMapping("/records")
    public ResponseEntity<?> updateAttendance(
            @RequestBody UpdateAttendanceRequest request,
            @RequestParam Long teacherId) {
        try {
            AttendanceSessionResponse session = attendanceService.updateAttendance(request, teacherId);
            return ResponseEntity.ok(Map.of(
                "message", "Attendance updated successfully",
                "session", session
            ));
        } catch (RuntimeException e) {
            log.error("Error updating attendance: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Bulk mark attendance
     * PUT /api/attendance/bulk
     */
    @PutMapping("/bulk")
    public ResponseEntity<?> bulkMarkAttendance(
            @RequestBody BulkAttendanceRequest request,
            @RequestParam Long teacherId) {
        try {
            AttendanceSessionResponse session = attendanceService.bulkMarkAttendance(request, teacherId);
            return ResponseEntity.ok(Map.of(
                "message", "Bulk attendance marked successfully",
                "session", session
            ));
        } catch (RuntimeException e) {
            log.error("Error bulk marking attendance: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Update session settings (lock/unlock, visibility)
     * PUT /api/attendance/sessions/settings
     */
    @PutMapping("/sessions/settings")
    public ResponseEntity<?> updateSessionSettings(
            @RequestBody AttendanceSettingsRequest request,
            @RequestParam Long teacherId) {
        try {
            AttendanceSessionResponse session = attendanceService.updateSessionSettings(request, teacherId);
            return ResponseEntity.ok(Map.of(
                "message", "Session settings updated successfully",
                "session", session
            ));
        } catch (RuntimeException e) {
            log.error("Error updating session settings: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Delete attendance session
     * DELETE /api/attendance/sessions/{sessionId}
     */
    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<?> deleteSession(
            @PathVariable Long sessionId,
            @RequestParam Long teacherId) {
        try {
            attendanceService.deleteSession(sessionId, teacherId);
            return ResponseEntity.ok(Map.of("message", "Attendance session deleted successfully"));
        } catch (RuntimeException e) {
            log.error("Error deleting attendance session: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get attendance summary for a student
     * GET /api/attendance/student/{studentId}/course/{courseId}/summary
     */
    @GetMapping("/student/{studentId}/course/{courseId}/summary")
    public ResponseEntity<?> getStudentAttendanceSummary(
            @PathVariable Long studentId,
            @PathVariable Long courseId) {
        try {
            AttendanceSessionResponse summary = attendanceService.getStudentAttendanceSummary(courseId, studentId);
            return ResponseEntity.ok(summary);
        } catch (RuntimeException e) {
            log.error("Error fetching student attendance summary: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
