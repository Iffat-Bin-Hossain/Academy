package com.example.demo.repository;

import com.example.demo.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AssessmentGridRepository extends JpaRepository<AssessmentGrid, Long> {

    Optional<AssessmentGrid> findByAssignmentAndStudent(Assignment assignment, User student);

    List<AssessmentGrid> findByAssignmentOrderByStudentNameAsc(Assignment assignment);
    
    List<AssessmentGrid> findByAssignment(Assignment assignment);

    @Query("SELECT ag FROM AssessmentGrid ag WHERE ag.assignment.course.id = :courseId ORDER BY ag.assignment.deadline DESC, ag.student.name ASC")
    List<AssessmentGrid> findByCourseIdOrderByAssignmentAndStudent(@Param("courseId") Long courseId);

    @Query("SELECT ag FROM AssessmentGrid ag WHERE ag.assignment.id = :assignmentId ORDER BY ag.student.name ASC")
    List<AssessmentGrid> findByAssignmentIdOrderByStudentName(@Param("assignmentId") Long assignmentId);

    @Query("SELECT COUNT(ag) FROM AssessmentGrid ag WHERE ag.assignment.id = :assignmentId AND ag.isProcessed = true")
    long countProcessedByAssignment(@Param("assignmentId") Long assignmentId);

    @Query("SELECT COUNT(ag) FROM AssessmentGrid ag WHERE ag.assignment.id = :assignmentId AND ag.finalMark IS NOT NULL")
    long countGradedByAssignment(@Param("assignmentId") Long assignmentId);

    @Query("SELECT ag FROM AssessmentGrid ag WHERE ag.assignment.course.id = :courseId AND ag.assignment.createdBy.id = :teacherId")
    List<AssessmentGrid> findByCourseAndTeacher(@Param("courseId") Long courseId, @Param("teacherId") Long teacherId);

    List<AssessmentGrid> findByAssignmentIn(List<Assignment> assignments);

    List<AssessmentGrid> findByCourseId(Long courseId);
    
    List<AssessmentGrid> findByCourseIdAndStudentId(Long courseId, Long studentId);

    List<AssessmentGrid> findByAssignmentId(Long assignmentId);

    Optional<AssessmentGrid> findByCourseIdAndAssignmentIdAndStudentId(Long courseId, Long assignmentId, Long studentId);

    @Query("SELECT ag FROM AssessmentGrid ag WHERE ag.copyPenaltyApplied = true AND ag.assignment.id = :assignmentId")
    List<AssessmentGrid> findCopyPenalizedByAssignment(@Param("assignmentId") Long assignmentId);

    boolean existsByAssignmentAndStudent(Assignment assignment, User student);

    void deleteByAssignment(Assignment assignment);

    void deleteByAssignmentAndStudent(Assignment assignment, User student);
}
