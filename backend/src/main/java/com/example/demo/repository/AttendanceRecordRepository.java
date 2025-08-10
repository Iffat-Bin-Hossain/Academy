package com.example.demo.repository;

import com.example.demo.model.AttendanceRecord;
import com.example.demo.model.AttendanceSession;
import com.example.demo.model.Course;
import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRecordRepository extends JpaRepository<AttendanceRecord, Long> {

    List<AttendanceRecord> findBySessionOrderByStudentNameAsc(AttendanceSession session);

    List<AttendanceRecord> findByStudentAndSessionCourseOrderBySessionSessionDateDesc(
        User student, Course course);

    Optional<AttendanceRecord> findBySessionAndStudent(AttendanceSession session, User student);

    @Query("SELECT ar FROM AttendanceRecord ar " +
           "WHERE ar.session.course = :course AND ar.student = :student " +
           "ORDER BY ar.session.sessionDate DESC")
    List<AttendanceRecord> findByStudentAndCourse(@Param("student") User student, 
                                                  @Param("course") Course course);

    @Query("SELECT COUNT(ar) FROM AttendanceRecord ar " +
           "WHERE ar.session.course = :course AND ar.student = :student AND ar.status = 'PRESENT'")
    long countPresentByStudentAndCourse(@Param("student") User student, 
                                        @Param("course") Course course);

    @Query("SELECT COUNT(ar) FROM AttendanceRecord ar " +
           "WHERE ar.session.course = :course AND ar.student = :student")
    long countTotalByStudentAndCourse(@Param("student") User student, 
                                      @Param("course") Course course);

    @Query("SELECT ar.student, COUNT(ar) as total, " +
           "SUM(CASE WHEN ar.status = 'PRESENT' THEN 1 ELSE 0 END) as present " +
           "FROM AttendanceRecord ar " +
           "WHERE ar.session.course = :course " +
           "GROUP BY ar.student")
    List<Object[]> getAttendanceSummaryForCourse(@Param("course") Course course);

    void deleteBySession(AttendanceSession session);
}
