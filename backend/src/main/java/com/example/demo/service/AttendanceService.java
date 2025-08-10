package com.example.demo.service;

import com.example.demo.dto.request.*;
import com.example.demo.dto.response.AttendanceRecordResponse;
import com.example.demo.dto.response.AttendanceSessionResponse;
import com.example.demo.model.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AttendanceService {

    private final AttendanceSessionRepository sessionRepository;
    private final AttendanceRecordRepository recordRepository;
    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;

    /**
     * Create a new attendance session for a course
     */
    public AttendanceSessionResponse createSession(CreateAttendanceSessionRequest request, Long teacherId) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new RuntimeException("Course not found"));

        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        // Verify teacher has permission to create sessions for this course
        if (!course.getAssignedTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("Not authorized to create attendance sessions for this course");
        }

        // Check if session already exists for this date
        if (sessionRepository.existsByCourseAndSessionDate(course, request.getSessionDate())) {
            throw new RuntimeException("Attendance session already exists for this date");
        }

        // Create the session
        AttendanceSession session = AttendanceSession.builder()
                .course(course)
                .sessionDate(request.getSessionDate())
                .sessionTitle(request.getSessionTitle())
                .description(request.getDescription())
                .isVisibleToStudents(request.getIsVisibleToStudents())
                .createdBy(teacher)
                .build();

        AttendanceSession savedSession = sessionRepository.save(session);

        // Create attendance records for all enrolled students (default: ABSENT)
        List<CourseEnrollment> enrollments = enrollmentRepository.findByCourseAndStatus(
                course, EnrollmentStatus.APPROVED);

        List<AttendanceRecord> records = enrollments.stream()
                .map(enrollment -> AttendanceRecord.builder()
                        .session(savedSession)
                        .student(enrollment.getStudent())
                        .status(AttendanceRecord.AttendanceStatus.ABSENT)
                        .markedByTeacherId(teacherId)
                        .build())
                .collect(Collectors.toList());

        recordRepository.saveAll(records);

        log.info("Created attendance session {} for course {} with {} student records", 
                 savedSession.getId(), course.getCourseCode(), records.size());

        return mapToResponse(savedSession);
    }

    /**
     * Get all attendance sessions for a course (teacher view)
     */
    public List<AttendanceSessionResponse> getCourseSessions(Long courseId, Long teacherId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Verify teacher has permission
        if (!course.getAssignedTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("Not authorized to view attendance for this course");
        }

        List<AttendanceSession> sessions = sessionRepository.findByCourseOrderBySessionDateDesc(course);
        return sessions.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    /**
     * Get attendance sessions visible to students
     */
    public List<AttendanceSessionResponse> getStudentSessions(Long courseId, Long studentId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Verify student is enrolled
        Optional<CourseEnrollment> enrollment = enrollmentRepository.findByStudentAndCourse(student, course);
        boolean isEnrolled = enrollment.isPresent() && enrollment.get().getStatus() == EnrollmentStatus.APPROVED;

        if (!isEnrolled) {
            throw new RuntimeException("Not enrolled in this course");
        }

        List<AttendanceSession> sessions = sessionRepository
                .findByCourseAndIsVisibleToStudentsTrueOrderBySessionDateDesc(course);

        return sessions.stream()
                .map(session -> mapToStudentResponse(session, studentId))
                .collect(Collectors.toList());
    }

    /**
     * Update attendance records for a session
     */
    public AttendanceSessionResponse updateAttendance(UpdateAttendanceRequest request, Long teacherId) {
        AttendanceSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new RuntimeException("Attendance session not found"));

        // Verify teacher has permission and session is not locked
        if (!session.canBeEditedBy(userRepository.findById(teacherId).orElse(null))) {
            throw new RuntimeException("Not authorized to edit this attendance session or session is locked");
        }

        // Update attendance records
        for (var item : request.getAttendanceRecords()) {
            AttendanceRecord record = recordRepository.findBySessionAndStudent(
                    session, userRepository.findById(item.getStudentId()).orElse(null))
                    .orElseThrow(() -> new RuntimeException("Attendance record not found for student"));

            record.setStatus(item.getStatus());
            record.setNotes(item.getNotes());
            record.setTeacherOverride(item.getTeacherOverride());
            record.setMarkedByTeacherId(teacherId);

            recordRepository.save(record);
        }

        log.info("Updated attendance for session {} by teacher {}", session.getId(), teacherId);
        
        return mapToResponse(session);
    }

    /**
     * Bulk mark attendance for multiple students
     */
    public AttendanceSessionResponse bulkMarkAttendance(BulkAttendanceRequest request, Long teacherId) {
        AttendanceSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new RuntimeException("Attendance session not found"));

        // Verify teacher has permission and session is not locked
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));

        if (!session.canBeEditedBy(teacher)) {
            throw new RuntimeException("Not authorized to edit this attendance session or session is locked");
        }

        // Bulk update attendance records
        for (Long studentId : request.getStudentIds()) {
            User student = userRepository.findById(studentId)
                    .orElseThrow(() -> new RuntimeException("Student not found"));

            AttendanceRecord record = recordRepository.findBySessionAndStudent(session, student)
                    .orElseThrow(() -> new RuntimeException("Attendance record not found for student"));

            record.setStatus(request.getStatus());
            record.setNotes(request.getNotes());
            record.setMarkedByTeacherId(teacherId);
            
            recordRepository.save(record);
        }

        log.info("Bulk marked {} students as {} for session {}", 
                 request.getStudentIds().size(), request.getStatus(), session.getId());

        return mapToResponse(session);
    }

    /**
     * Update session settings (lock/unlock, visibility)
     */
    public AttendanceSessionResponse updateSessionSettings(AttendanceSettingsRequest request, Long teacherId) {
        AttendanceSession session = sessionRepository.findById(request.getSessionId())
                .orElseThrow(() -> new RuntimeException("Attendance session not found"));

        // Verify teacher has permission
        if (!session.getCourse().getAssignedTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("Not authorized to modify this attendance session");
        }

        session.setIsLocked(request.getIsLocked());
        session.setIsVisibleToStudents(request.getIsVisibleToStudents());
        
        AttendanceSession updatedSession = sessionRepository.save(session);

        log.info("Updated settings for session {}: locked={}, visible={}", 
                 session.getId(), request.getIsLocked(), request.getIsVisibleToStudents());

        return mapToResponse(updatedSession);
    }

    /**
     * Delete an attendance session
     */
    public void deleteSession(Long sessionId, Long teacherId) {
        AttendanceSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new RuntimeException("Attendance session not found"));

        // Verify teacher has permission
        if (!session.getCourse().getAssignedTeacher().getId().equals(teacherId)) {
            throw new RuntimeException("Not authorized to delete this attendance session");
        }

        recordRepository.deleteBySession(session);
        sessionRepository.delete(session);

        log.info("Deleted attendance session {} by teacher {}", sessionId, teacherId);
    }

    /**
     * Get attendance summary for a student in a course
     */
    public AttendanceSessionResponse getStudentAttendanceSummary(Long courseId, Long studentId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));

        // Verify student is enrolled
        Optional<CourseEnrollment> enrollment = enrollmentRepository.findByStudentAndCourse(student, course);
        boolean isEnrolled = enrollment.isPresent() && enrollment.get().getStatus() == EnrollmentStatus.APPROVED;

        if (!isEnrolled) {
            throw new RuntimeException("Not enrolled in this course");
        }

        long totalSessions = recordRepository.countTotalByStudentAndCourse(student, course);
        long presentSessions = recordRepository.countPresentByStudentAndCourse(student, course);
        
        double attendancePercentage = totalSessions > 0 ? 
                (double) presentSessions / totalSessions * 100 : 0.0;

        return AttendanceSessionResponse.builder()
                .courseId(courseId)
                .courseCode(course.getCourseCode())
                .courseTitle(course.getTitle())
                .totalEnrolledStudents(1)
                .presentCount((int) presentSessions)
                .absentCount((int) (totalSessions - presentSessions))
                .attendancePercentage(attendancePercentage)
                .build();
    }

    // Helper methods

    private AttendanceSessionResponse mapToResponse(AttendanceSession session) {
        List<AttendanceRecord> records = recordRepository.findBySessionOrderByStudentNameAsc(session);
        
        int presentCount = (int) records.stream()
                .filter(r -> r.getStatus() == AttendanceRecord.AttendanceStatus.PRESENT)
                .count();
        
        int totalStudents = records.size();
        double attendancePercentage = totalStudents > 0 ? 
                (double) presentCount / totalStudents * 100 : 0.0;

        return AttendanceSessionResponse.builder()
                .id(session.getId())
                .courseId(session.getCourse().getId())
                .courseCode(session.getCourse().getCourseCode())
                .courseTitle(session.getCourse().getTitle())
                .sessionDate(session.getSessionDate())
                .sessionTitle(session.getSessionTitle())
                .description(session.getDescription())
                .isLocked(session.getIsLocked())
                .isVisibleToStudents(session.getIsVisibleToStudents())
                .createdByName(session.getCreatedBy().getName())
                .createdById(session.getCreatedBy().getId())
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .attendanceRecords(mapRecordsToResponse(records))
                .totalEnrolledStudents(totalStudents)
                .presentCount(presentCount)
                .absentCount(totalStudents - presentCount)
                .attendancePercentage(attendancePercentage)
                .build();
    }

    private AttendanceSessionResponse mapToStudentResponse(AttendanceSession session, Long studentId) {
        // For student view, only return their own record
        User student = userRepository.findById(studentId).orElse(null);
        AttendanceRecord studentRecord = recordRepository.findBySessionAndStudent(session, student)
                .orElse(null);

        return AttendanceSessionResponse.builder()
                .id(session.getId())
                .courseId(session.getCourse().getId())
                .courseCode(session.getCourse().getCourseCode())
                .courseTitle(session.getCourse().getTitle())
                .sessionDate(session.getSessionDate())
                .sessionTitle(session.getSessionTitle())
                .description(session.getDescription())
                .isLocked(session.getIsLocked())
                .isVisibleToStudents(session.getIsVisibleToStudents())
                .createdAt(session.getCreatedAt())
                .attendanceRecords(studentRecord != null ? 
                        List.of(mapRecordToResponse(studentRecord)) : List.of())
                .build();
    }

    private List<AttendanceRecordResponse> mapRecordsToResponse(List<AttendanceRecord> records) {
        return records.stream()
                .map(this::mapRecordToResponse)
                .collect(Collectors.toList());
    }

    private AttendanceRecordResponse mapRecordToResponse(AttendanceRecord record) {
        return AttendanceRecordResponse.builder()
                .id(record.getId())
                .studentId(record.getStudent().getId())
                .studentName(record.getStudent().getName())
                .studentEmail(record.getStudent().getEmail())
                .status(record.getStatus())
                .displayStatus(record.getDisplayStatus())
                .statusColor(record.getStatusColor())
                .teacherOverride(record.getTeacherOverride())
                .notes(record.getNotes())
                .updatedAt(record.getUpdatedAt())
                .build();
    }
}
