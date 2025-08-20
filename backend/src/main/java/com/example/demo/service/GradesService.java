package com.example.demo.service;

import com.example.demo.model.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class GradesService {

    private final AssessmentGridRepository assessmentGridRepository;
    private final AssignmentRepository assignmentRepository;
    private final CourseRepository courseRepository;
    private final CourseEnrollmentRepository enrollmentRepository;
    private final UserRepository userRepository;
    private final CourseTeacherRepository courseTeacherRepository;
    private final AttendanceService attendanceService;
    private final StudentSubmissionRepository submissionRepository;

    /**
     * Get student grades for a specific course
     */
    public Map<String, Object> getStudentGradesForCourse(Long studentId, Long courseId) {
        // Validate student
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        
        if (!student.getRole().equals(Role.STUDENT)) {
            throw new RuntimeException("User is not a student");
        }

        // Validate course
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        // Check if student is enrolled
        CourseEnrollment enrollment = enrollmentRepository.findByCourseAndStudent(course, student)
                .orElseThrow(() -> new RuntimeException("Student is not enrolled in this course"));

        if (!enrollment.getStatus().equals(EnrollmentStatus.APPROVED)) {
            throw new RuntimeException("Student enrollment is not approved");
        }

        // Get all assignments for the course
        List<Assignment> assignments = assignmentRepository.findByCourseAndIsActiveTrueOrderByCreatedAtDesc(course);
        
        // Get assessment grids for the student in this course
        List<AssessmentGrid> assessments = assessmentGridRepository.findByCourseIdAndStudentId(courseId, studentId);
        
        // Get submissions for the student in this course
        List<StudentSubmission> submissions = submissionRepository.findByStudent_IdOrderBySubmittedAtDesc(studentId);
        
        // Create assignment-assessment map
        Map<Long, AssessmentGrid> assessmentMap = assessments.stream()
                .collect(Collectors.toMap(
                    assessment -> assessment.getAssignment().getId(),
                    assessment -> assessment
                ));
        
        // Create assignment-submission map
        Map<Long, StudentSubmission> submissionMap = submissions.stream()
                .filter(submission -> submission.getAssignment().getCourse().getId().equals(courseId))
                .collect(Collectors.toMap(
                    submission -> submission.getAssignment().getId(),
                    submission -> submission
                ));

        List<Map<String, Object>> gradeDetails = new ArrayList<>();
        double totalMarks = 0;
        double totalPossible = 0;
        int gradedAssignments = 0;
        int totalAssignments = 0;

        for (Assignment assignment : assignments) {
            Map<String, Object> gradeInfo = new HashMap<>();
            gradeInfo.put("assignmentId", assignment.getId());
            gradeInfo.put("assignmentTitle", assignment.getTitle());
            gradeInfo.put("assignmentType", assignment.getAssignmentType().toString());
            gradeInfo.put("maxMarks", assignment.getMaxMarks());
            gradeInfo.put("deadline", assignment.getDeadline());
            gradeInfo.put("gradesVisible", assignment.getGradesVisible() != null ? assignment.getGradesVisible() : false);

            totalAssignments++;
            totalPossible += assignment.getMaxMarks();

            AssessmentGrid assessment = assessmentMap.get(assignment.getId());
            StudentSubmission submission = submissionMap.get(assignment.getId());
            
            // First check if student has submitted
            if (submission != null) {
                // Student has submitted - check if graded
                if (assessment != null && assignment.getGradesVisible() != null && assignment.getGradesVisible()) {
                    // Graded and visible
                    gradeInfo.put("hasGrade", true);
                    gradeInfo.put("teacherMark", assessment.getTeacherMark());
                    gradeInfo.put("finalMark", assessment.getFinalMark());
                    gradeInfo.put("gradingNotes", assessment.getGradingNotes());
                    gradeInfo.put("isLateSubmission", assessment.getLatePenaltyApplied());
                    gradeInfo.put("copyPenaltyApplied", assessment.getCopyPenaltyApplied());
                    gradeInfo.put("gradedAt", assessment.getUpdatedAt());
                    gradeInfo.put("submittedAt", submission.getSubmittedAt());
                    gradeInfo.put("isLate", submission.getIsLate());
                    
                    if (assessment.getFinalMark() != null) {
                        totalMarks += assessment.getFinalMark();
                        gradedAssignments++;
                    }
                } else {
                    // Submitted but not graded yet or grades not visible
                    gradeInfo.put("hasGrade", false);
                    gradeInfo.put("gradesPending", true);
                    gradeInfo.put("submittedAt", submission.getSubmittedAt());
                    gradeInfo.put("isLate", submission.getIsLate());
                }
            } else {
                // No submission at all
                gradeInfo.put("hasGrade", false);
                gradeInfo.put("notSubmitted", true);
            }

            gradeDetails.add(gradeInfo);
        }

        // Get attendance summary and calculate attendance marks
        Map<String, Object> attendanceSummary = getAttendanceSummary(studentId, courseId);
        double attendanceMarks = (Double) attendanceSummary.get("attendanceMarks");
        double maxAttendanceMarks = (Double) attendanceSummary.get("maxAttendanceMarks");

        // Calculate overall performance including attendance
        double totalMarksWithAttendance = totalMarks + attendanceMarks;
        double totalPossibleWithAttendance = totalPossible + maxAttendanceMarks;
        double overallPercentage = totalPossibleWithAttendance > 0 ? 
            (totalMarksWithAttendance / totalPossibleWithAttendance) * 100 : 0;
        String letterGrade = calculateLetterGrade(overallPercentage);

        Map<String, Object> result = new HashMap<>();
        result.put("courseId", courseId);
        result.put("courseTitle", course.getTitle());
        result.put("courseCode", course.getCourseCode());
        result.put("enrollmentStatus", enrollment.getStatus().toString());
        result.put("assignments", gradeDetails);
        result.put("attendance", attendanceSummary);
        result.put("summary", Map.of(
            "totalMarks", totalMarks,
            "totalPossible", totalPossible,
            "attendanceMarks", attendanceMarks,
            "maxAttendanceMarks", maxAttendanceMarks,
            "totalMarksWithAttendance", totalMarksWithAttendance,
            "totalPossibleWithAttendance", totalPossibleWithAttendance,
            "overallPercentage", Math.round(overallPercentage * 100.0) / 100.0,
            "letterGrade", letterGrade,
            "gradedAssignments", gradedAssignments,
            "totalAssignments", totalAssignments
        ));

        return result;
    }

    /**
     * Get all grades for a student across all enrolled courses
     */
    public Map<String, Object> getAllStudentGrades(Long studentId) {
        // Validate student
        User student = userRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        
        if (!student.getRole().equals(Role.STUDENT)) {
            throw new RuntimeException("User is not a student");
        }

        // Get all approved enrollments for the student
        List<CourseEnrollment> enrollments = enrollmentRepository.findByStudentAndStatus(student, EnrollmentStatus.APPROVED);
        
        List<Map<String, Object>> courseGrades = new ArrayList<>();
        double overallGPA = 0;
        int coursesWithGrades = 0;

        for (CourseEnrollment enrollment : enrollments) {
            try {
                Map<String, Object> courseGrade = getStudentGradesForCourse(studentId, enrollment.getCourse().getId());
                @SuppressWarnings("unchecked")
                Map<String, Object> summary = (Map<String, Object>) courseGrade.get("summary");
                
                if ((Integer) summary.get("gradedAssignments") > 0) {
                    coursesWithGrades++;
                    
                    // Use the new overall percentage that includes attendance
                    Object percentageObj = summary.get("overallPercentage");
                    double percentage = 0.0;
                    
                    if (percentageObj instanceof Integer) {
                        percentage = ((Integer) percentageObj).doubleValue();
                    } else if (percentageObj instanceof Double) {
                        percentage = (Double) percentageObj;
                    }
                    
                    overallGPA += convertPercentageToGPA(percentage);
                }
                
                courseGrades.add(courseGrade);
            } catch (Exception e) {
                log.warn("Error fetching grades for course {}: {}", enrollment.getCourse().getId(), e.getMessage());
            }
        }

        // Calculate overall GPA
        overallGPA = coursesWithGrades > 0 ? overallGPA / coursesWithGrades : 0;

        Map<String, Object> result = new HashMap<>();
        result.put("studentId", studentId);
        result.put("studentName", student.getName());
        result.put("courseGrades", courseGrades);
        result.put("overallSummary", Map.of(
            "overallGPA", Math.round(overallGPA * 100.0) / 100.0,
            "coursesEnrolled", enrollments.size(),
            "coursesWithGrades", coursesWithGrades
        ));

        return result;
    }

    /**
     * Get comprehensive performance analytics for a student
     */
    public Map<String, Object> getStudentPerformanceAnalytics(Long studentId) {
        // Get all grades first
        Map<String, Object> allGrades = getAllStudentGrades(studentId);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> courseGrades = (List<Map<String, Object>>) allGrades.get("courseGrades");

        // Performance trends
        List<Map<String, Object>> performanceTrends = new ArrayList<>();
        List<Map<String, Object>> assignmentTypePerformance = new ArrayList<>();
        
        // Assignment type performance tracking
        Map<String, List<Double>> typePerformanceMap = new HashMap<>();
        Map<String, Integer> typeCountMap = new HashMap<>();
        
        // Grade distribution - Updated for new grading system
        Map<String, Integer> gradeDistribution = new HashMap<>();
        gradeDistribution.put("A+", 0);
        gradeDistribution.put("A", 0);
        gradeDistribution.put("A-", 0);
        gradeDistribution.put("B+", 0);
        gradeDistribution.put("B", 0);
        gradeDistribution.put("B-", 0);
        gradeDistribution.put("C", 0);
        gradeDistribution.put("D", 0);
        gradeDistribution.put("F", 0);

        // Process each course
        for (Map<String, Object> courseGrade : courseGrades) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> assignments = (List<Map<String, Object>>) courseGrade.get("assignments");
            @SuppressWarnings("unchecked")
            Map<String, Object> summary = (Map<String, Object>) courseGrade.get("summary");
            
            // Add course performance to trends
            if ((Integer) summary.get("gradedAssignments") > 0) {
                // Get attendance information
                @SuppressWarnings("unchecked")
                Map<String, Object> attendance = (Map<String, Object>) courseGrade.get("attendance");
                
                performanceTrends.add(Map.of(
                    "courseCode", courseGrade.get("courseCode"),
                    "courseTitle", courseGrade.get("courseTitle"),
                    "percentage", summary.get("overallPercentage"),
                    "letterGrade", summary.get("letterGrade"),
                    "attendancePercentage", attendance.get("attendancePercentage"),
                    "attendanceMarks", attendance.get("attendanceMarks"),
                    "maxAttendanceMarks", attendance.get("maxAttendanceMarks"),
                    "totalMarksWithAttendance", summary.get("totalMarksWithAttendance"),
                    "totalPossibleWithAttendance", summary.get("totalPossibleWithAttendance")
                ));
                
                // Add to grade distribution - ensure the grade exists in the map
                String letterGrade = (String) summary.get("letterGrade");
                if (gradeDistribution.containsKey(letterGrade)) {
                    gradeDistribution.put(letterGrade, gradeDistribution.get(letterGrade) + 1);
                }
            }

            // Process assignments for type performance
            for (Map<String, Object> assignment : assignments) {
                if ((Boolean) assignment.getOrDefault("hasGrade", false) && 
                    (Boolean) assignment.getOrDefault("gradesVisible", false)) {
                    
                    String assignmentType = (String) assignment.get("assignmentType");
                    
                    // Handle both Integer and Double types for finalMark and maxMarks
                    Object finalMarkObj = assignment.get("finalMark");
                    Object maxMarksObj = assignment.get("maxMarks");
                    
                    Double finalMark = null;
                    Double maxMarks = null;
                    
                    // Convert finalMark to Double
                    if (finalMarkObj instanceof Integer) {
                        finalMark = ((Integer) finalMarkObj).doubleValue();
                    } else if (finalMarkObj instanceof Double) {
                        finalMark = (Double) finalMarkObj;
                    }
                    
                    // Convert maxMarks to Double
                    if (maxMarksObj instanceof Integer) {
                        maxMarks = ((Integer) maxMarksObj).doubleValue();
                    } else if (maxMarksObj instanceof Double) {
                        maxMarks = (Double) maxMarksObj;
                    }
                    
                    if (finalMark != null && maxMarks != null && maxMarks > 0) {
                        double percentage = (finalMark / maxMarks) * 100;
                        
                        typePerformanceMap.computeIfAbsent(assignmentType, k -> new ArrayList<>()).add(percentage);
                        typeCountMap.put(assignmentType, typeCountMap.getOrDefault(assignmentType, 0) + 1);
                    }
                }
            }
        }

        // Add attendance as a separate type performance
        List<Double> attendancePerformances = new ArrayList<>();
        for (Map<String, Object> courseGrade : courseGrades) {
            @SuppressWarnings("unchecked")
            Map<String, Object> attendance = (Map<String, Object>) courseGrade.get("attendance");
            if (attendance != null) {
                Double attendancePercentage = (Double) attendance.get("attendancePercentage");
                if (attendancePercentage != null) {
                    attendancePerformances.add(attendancePercentage);
                }
            }
        }
        
        if (!attendancePerformances.isEmpty()) {
            typePerformanceMap.put("Attendance", attendancePerformances);
            typeCountMap.put("Attendance", attendancePerformances.size());
        }

        // Calculate assignment type averages
        for (Map.Entry<String, List<Double>> entry : typePerformanceMap.entrySet()) {
            String type = entry.getKey();
            List<Double> scores = entry.getValue();
            double average = scores.stream().mapToDouble(Double::doubleValue).average().orElse(0);
            
            assignmentTypePerformance.add(Map.of(
                "assignmentType", type,
                "averagePercentage", Math.round(average * 100.0) / 100.0,
                "count", typeCountMap.get(type),
                "scores", scores
            ));
        }

        // Calculate strengths and weaknesses
        List<String> strengths = new ArrayList<>();
        List<String> improvements = new ArrayList<>();
        
        for (Map<String, Object> typePerf : assignmentTypePerformance) {
            double avg = (Double) typePerf.get("averagePercentage");
            String type = (String) typePerf.get("assignmentType");
            
            if (avg >= 85) {
                strengths.add(type + " (Avg: " + String.format("%.1f", avg) + "%)");
            } else if (avg < 70) {
                improvements.add(type + " (Avg: " + String.format("%.1f", avg) + "%)");
            }
        }

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("performanceTrends", performanceTrends);
        analytics.put("assignmentTypePerformance", assignmentTypePerformance);
        analytics.put("gradeDistribution", gradeDistribution);
        analytics.put("insights", Map.of(
            "strengths", strengths,
            "areasForImprovement", improvements,
            "totalCoursesAnalyzed", courseGrades.size(),
            "totalAssignmentsGraded", typePerformanceMap.values().stream().mapToInt(List::size).sum()
        ));

        // Combine with basic grade information
        Map<String, Object> result = new HashMap<>(allGrades);
        result.put("analytics", analytics);
        
        return result;
    }

    /**
     * Toggle grade visibility for an assignment (teacher only)
     */
    public String toggleAssignmentGradeVisibility(Long assignmentId, Long teacherId, boolean visible) {
        // Validate teacher
        User teacher = userRepository.findById(teacherId)
                .orElseThrow(() -> new RuntimeException("Teacher not found"));
        
        if (!teacher.getRole().equals(Role.TEACHER)) {
            throw new RuntimeException("Only teachers can control grade visibility");
        }

        // Get assignment
        Assignment assignment = assignmentRepository.findById(assignmentId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        // Check if teacher is assigned to the course
        Course course = assignment.getCourse();
        boolean isAssigned = courseTeacherRepository.existsByCourseAndTeacherAndActiveTrue(course, teacher) ||
                           (course.getAssignedTeacher() != null && course.getAssignedTeacher().getId().equals(teacherId));

        if (!isAssigned) {
            throw new RuntimeException("You are not assigned to this course");
        }

        // Update visibility
        assignment.setGradesVisible(visible);
        assignmentRepository.save(assignment);

        return "Grade visibility " + (visible ? "enabled" : "disabled") + " for assignment: " + assignment.getTitle();
    }

    /**
     * Get grade visibility status for all assignments in a course
     */
    public Map<String, Object> getCourseGradeVisibility(Long courseId) {
        Course course = courseRepository.findById(courseId)
                .orElseThrow(() -> new RuntimeException("Course not found"));

        List<Assignment> assignments = assignmentRepository.findByCourseAndIsActiveTrueOrderByCreatedAtDesc(course);
        
        List<Map<String, Object>> visibilityInfo = assignments.stream()
                .map(assignment -> {
                    Map<String, Object> assignmentInfo = new HashMap<>();
                    assignmentInfo.put("assignmentId", assignment.getId());
                    assignmentInfo.put("assignmentTitle", assignment.getTitle());
                    assignmentInfo.put("gradesVisible", assignment.getGradesVisible() != null ? assignment.getGradesVisible() : false);
                    assignmentInfo.put("hasGrades", hasGradedAssessments(assignment));
                    return assignmentInfo;
                })
                .collect(Collectors.toList());

        return Map.of(
            "courseId", courseId,
            "courseTitle", course.getTitle(),
            "assignments", visibilityInfo
        );
    }

    // Helper methods

    private boolean hasGradedAssessments(Assignment assignment) {
        return assessmentGridRepository.countGradedByAssignment(assignment.getId()) > 0;
    }

    private String calculateLetterGrade(double percentage) {
        if (percentage >= 80) return "A+";
        if (percentage >= 75) return "A";
        if (percentage >= 70) return "A-";
        if (percentage >=65) return "B+";
        if (percentage >= 60) return "B";
        if (percentage >= 55) return "B-";
        if (percentage >= 50) return "C";
        if (percentage >= 45) return "D";
        if (percentage >= 40) return "E";
        return "F";
    }

    private double convertPercentageToGPA(double percentage) {
        if (percentage >= 80) return 4.00;  // A+
        if (percentage >= 75) return 3.75;  // A
        if (percentage >= 70) return 3.50;  // A-
        if (percentage >= 65) return 3.25;  // B+
        if (percentage >= 60) return 3.00;  // B
        if (percentage >= 55) return 2.75;  // B-
        if (percentage >= 50) return 2.50;  // C
        if (percentage >= 45) return 2.25;  // D
        if (percentage >= 40) return 2.00; //E
        return 0.00;  // F
    }

    /**
     * Calculate attendance marks based on attendance percentage
     * Total attendance mark = 30
     * - >=75%: Full 30 marks
     * - 50-74%: 20 marks (10 marks deducted)
     * - 25-49%: 10 marks (20 marks deducted)  
     * - <25%: 0 marks
     */
    private double calculateAttendanceMarks(double attendancePercentage) {
        if (attendancePercentage >= 75.0) {
            return 30.0; // Full marks
        } else if (attendancePercentage >= 50.0) {
            return 20.0; // 10 marks deducted
        } else if (attendancePercentage >= 25.0) {
            return 10.0; // 20 marks deducted
        } else {
            return 0.0; // No marks for <25% attendance
        }
    }

    /**
     * Get attendance summary for a student in a course
     */
    private Map<String, Object> getAttendanceSummary(Long studentId, Long courseId) {
        try {
            var attendanceSummary = attendanceService.getStudentAttendanceSummary(courseId, studentId);
            double attendancePercentage = attendanceSummary.getAttendancePercentage();
            double attendanceMarks = calculateAttendanceMarks(attendancePercentage);
            
            return Map.of(
                "attendancePercentage", Math.round(attendancePercentage * 100.0) / 100.0,
                "attendanceMarks", attendanceMarks,
                "maxAttendanceMarks", 30.0,
                "totalSessions", attendanceSummary.getTotalSessions(),
                "presentCount", attendanceSummary.getPresentCount(),
                "absentCount", attendanceSummary.getAbsentCount()
            );
        } catch (Exception e) {
            log.warn("Failed to get attendance summary for student {} in course {}: {}", 
                     studentId, courseId, e.getMessage());
            return Map.of(
                "attendancePercentage", 0.0,
                "attendanceMarks", 0.0,
                "maxAttendanceMarks", 30.0,
                "totalSessions", 0,
                "presentCount", 0,
                "absentCount", 0
            );
        }
    }
}
