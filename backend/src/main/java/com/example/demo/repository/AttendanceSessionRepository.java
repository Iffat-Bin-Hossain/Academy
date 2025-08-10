package com.example.demo.repository;

import com.example.demo.model.AttendanceSession;
import com.example.demo.model.Course;
import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceSessionRepository extends JpaRepository<AttendanceSession, Long> {

    List<AttendanceSession> findByCourseOrderBySessionDateDesc(Course course);

    List<AttendanceSession> findByCourseAndIsVisibleToStudentsTrueOrderBySessionDateDesc(Course course);

    Optional<AttendanceSession> findByCourseAndSessionDate(Course course, LocalDate sessionDate);

    @Query("SELECT DISTINCT a FROM AttendanceSession a " +
           "JOIN a.course c " +
           "WHERE c.assignedTeacher = :teacher " +
           "ORDER BY a.sessionDate DESC")
    List<AttendanceSession> findByTeacher(@Param("teacher") User teacher);

    @Query("SELECT COUNT(a) FROM AttendanceSession a WHERE a.course = :course")
    long countByCourse(@Param("course") Course course);

    boolean existsByCourseAndSessionDate(Course course, LocalDate sessionDate);
}
