import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';

const StudentGrades = ({ courseId, user, onShowMessage }) => {
  const [grades, setGrades] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (courseId && user) {
      fetchGrades();
    }
  }, [courseId, user]);

  const fetchGrades = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/grades/student/${user.id}/course/${courseId}`);
      const data = response.data;

      // Calculate GPA based on overall percentage using 10-grade system
      const calculateGPA = (percentage) => {
        if (percentage >= 80) return 4.00;
        if (percentage >= 75) return 3.75;
        if (percentage >= 70) return 3.50;
        if (percentage >= 65) return 3.25;
        if (percentage >= 60) return 3.00;
        if (percentage >= 55) return 2.75;
        if (percentage >= 50) return 2.50;
        if (percentage >= 45) return 2.25;
        if (percentage >= 40) return 2.00;
        return 0.00;
      };

      // Transform the data to match component expectations
      const transformedGrades = {
        assignments: data.assignments || [],
        overallAverage: data.summary?.overallPercentage || 0,
        currentGPA: calculateGPA(data.summary?.overallPercentage || 0),
        completedAssignments: data.summary?.gradedAssignments || 0,
        totalAssignments: data.summary?.totalAssignments || 0,
        totalCredits: null, // Not provided by backend
        gradeDistribution: null, // Could be calculated from assignments if needed
        courseTitle: data.courseTitle,
        courseCode: data.courseCode,
        // New attendance fields
        attendance: data.attendance || {},
        attendanceMarks: data.summary?.attendanceMarks || 0,
        maxAttendanceMarks: data.summary?.maxAttendanceMarks || 30,
        totalMarksWithAttendance: data.summary?.totalMarksWithAttendance || 0,
        totalPossibleWithAttendance: data.summary?.totalPossibleWithAttendance || 0
      };

      setGrades(transformedGrades);
    } catch (error) {
      console.error('Error fetching grades:', error);
      setError(error.response?.data?.error || 'Failed to load grades');
      onShowMessage?.('Failed to load grades', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Grade utility functions based on your 10-grade system
  const getGradeInfo = (percentage) => {
    if (percentage >= 80) return { letter: 'A+', gpa: 4.00, color: '#059669', description: 'Outstanding' };
    if (percentage >= 75) return { letter: 'A', gpa: 3.75, color: '#16a34a', description: 'Excellent' };
    if (percentage >= 70) return { letter: 'A-', gpa: 3.50, color: '#22c55e', description: 'Very Good' };
    if (percentage >= 65) return { letter: 'B+', gpa: 3.25, color: '#84cc16', description: 'Good' };
    if (percentage >= 60) return { letter: 'B', gpa: 3.00, color: '#a3a3a3', description: 'Above Average' };
    if (percentage >= 55) return { letter: 'B-', gpa: 2.75, color: '#d97706', description: 'Average' };
    if (percentage >= 50) return { letter: 'C', gpa: 2.50, color: '#f59e0b', description: 'Below Average' };
    if (percentage >= 45) return { letter: 'D', gpa: 2.25, color: '#f97316', description: 'Poor' };
    if (percentage >= 40) return { letter: 'E', gpa: 2.00, color: '#ef4444', description: 'Very Poor' };
    return { letter: 'F', gpa: 0.00, color: '#ef4444', description: 'Fail' };
  };

  const getGradeStatusIcon = (assignment) => {
    // Check if assignment has a grade
    if (!assignment.hasGrade) {
      // If explicitly marked as not submitted (backend sets this when no submission exists)
      if (assignment.notSubmitted) {
        return { icon: '❌', text: 'Not Submitted', color: '#ef4444' };
      }
      // If marked as pending review (student submitted but teacher hasn't graded yet)
      if (assignment.gradesPending) {
        return { icon: '⏳', text: 'Pending Review', color: '#f59e0b' };
      }
      // Default: under review (fallback case)
      return { icon: '🔍', text: 'Under Review', color: '#3b82f6' };
    }

    // Assignment has a grade but might not be visible to students
    if (!assignment.gradesVisible) {
      return { icon: '🔒', text: 'Grade Hidden', color: '#64748b' };
    }

    // Assignment is graded and visible - show performance status
    const percentage = (assignment.finalMark / assignment.maxMarks) * 100;
    const gradeInfo = getGradeInfo(percentage);
    return { icon: '📊', text: gradeInfo.description, color: gradeInfo.color };
  };

  const formatGrade = (assignment) => {
    if (!assignment.hasGrade || !assignment.gradesVisible) return 'N/A';

    const percentage = (assignment.finalMark / assignment.maxMarks) * 100;
    const gradeInfo = getGradeInfo(percentage);

    return `${gradeInfo.letter} (${percentage.toFixed(1)}%) - GPA: ${gradeInfo.gpa}`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p style={{ color: '#64748b' }}>Loading grades...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px',
        margin: '1rem 0'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
        <h3 style={{ color: '#dc2626', marginBottom: '0.5rem' }}>Error Loading Grades</h3>
        <p style={{ color: '#7f1d1d', marginBottom: '1rem' }}>{error}</p>
        <button
          onClick={fetchGrades}
          style={{
            backgroundColor: '#dc2626',
            color: 'white',
            border: 'none',
            padding: '0.5rem 1rem',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!grades || !grades.assignments?.length) {
    return (
      <div style={{
        padding: '3rem',
        textAlign: 'center',
        backgroundColor: '#f8fafc',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        margin: '1rem 0'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📚</div>
        <h3 style={{ color: '#475569', marginBottom: '0.5rem' }}>No Grades Available</h3>
        <p style={{ color: '#64748b' }}>
          Grades for this course haven't been posted yet, or you haven't submitted any assignments.
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: '1rem' }}>
      {/* Course Summary */}
      <div style={{
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ margin: '0 0 1rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>📈</span>
          Grade Summary
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>Overall Grade</h4>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: getGradeInfo(grades.overallAverage).color }}>
              {grades.overallAverage ? `${grades.overallAverage.toFixed(1)}%` : 'N/A'}
            </div>
            {grades.overallAverage && (
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                {getGradeInfo(grades.overallAverage).letter} ({getGradeInfo(grades.overallAverage).description})
              </div>
            )}
            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
              (Includes assignments + attendance)
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #22c55e' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>📈 Attendance</h4>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: grades.attendance.attendancePercentage >= 75 ? '#059669' : grades.attendance.attendancePercentage >= 50 ? '#f59e0b' : '#ef4444' }}>
              {grades.attendance.attendancePercentage ? `${grades.attendance.attendancePercentage.toFixed(1)}%` : 'N/A'}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              {grades.attendanceMarks}/{grades.maxAttendanceMarks} marks
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>Current GPA</h4>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {grades.currentGPA ? grades.currentGPA.toFixed(2) : 'N/A'}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              {grades.totalCredits ? `${grades.totalCredits} credits` : 'No credits calculated'}
            </div>
          </div>

          <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#475569' }}>Assignments</h4>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
              {grades.completedAssignments}/{grades.totalAssignments}
            </div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              Completed assignments
            </div>
          </div>
        </div>
      </div>

      {/* Grading Scale Reference */}
      <div style={{
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>🎯</span>
          Grading Scale
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '0.5rem' }}>
          {[
            { grade: 'A+', range: '80%+', gpa: '4.00', color: '#059669' },
            { grade: 'A', range: '75-79%', gpa: '3.75', color: '#16a34a' },
            { grade: 'A-', range: '70-74%', gpa: '3.50', color: '#22c55e' },
            { grade: 'B+', range: '65-69%', gpa: '3.25', color: '#84cc16' },
            { grade: 'B', range: '60-64%', gpa: '3.00', color: '#a3a3a3' },
            { grade: 'B-', range: '55-59%', gpa: '2.75', color: '#d97706' },
            { grade: 'C', range: '50-54%', gpa: '2.50', color: '#f59e0b' },
            { grade: 'D', range: '45-49%', gpa: '2.25', color: '#f97316' },
            { grade: 'E', range: '40-44%', gpa: '2.00', color: '#ef4444' },
            { grade: 'F', range: '<40%', gpa: '0.00', color: '#ef4444' }
          ].map((item, index) => (
            <div key={index} style={{
              padding: '0.5rem',
              backgroundColor: '#f8fafc',
              borderRadius: '6px',
              textAlign: 'center',
              border: `2px solid ${item.color}20`
            }}>
              <div style={{ fontWeight: 'bold', color: item.color }}>{item.grade}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.range}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{item.gpa}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Attendance Grading Explanation */}
      <div style={{
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: '#f0fdf4',
        borderRadius: '12px',
        border: '2px solid #22c55e'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span>📈</span>
          Attendance Grading System
        </h3>
        <p style={{ margin: '0 0 1rem 0', color: '#374151' }}>
          Attendance contributes <strong>30 marks</strong> to your overall grade. Here's how attendance marks are calculated:
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {[
            { range: '≥75%', marks: '30/30', color: '#059669', description: 'Full marks' },
            { range: '50-74%', marks: '20/30', color: '#f59e0b', description: '10 marks deducted' },
            { range: '25-49%', marks: '10/30', color: '#f97316', description: '20 marks deducted' },
            { range: '<25%', marks: '0/30', color: '#ef4444', description: 'No marks' }
          ].map((item, index) => (
            <div key={index} style={{
              padding: '1rem',
              backgroundColor: 'white',
              borderRadius: '8px',
              border: `2px solid ${item.color}30`
            }}>
              <div style={{ fontWeight: 'bold', color: item.color, fontSize: '1.1rem', marginBottom: '0.25rem' }}>
                {item.range} Attendance
              </div>
              <div style={{ fontSize: '1rem', fontWeight: '600', color: '#374151', marginBottom: '0.25rem' }}>
                {item.marks}
              </div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                {item.description}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'white', borderRadius: '8px', fontSize: '0.875rem', color: '#374151' }}>
          <strong>Your current attendance:</strong> {grades.attendance.attendancePercentage?.toFixed(1)}%
          ({grades.attendance.presentCount}/{grades.attendance.totalSessions} sessions) =
          <span style={{ fontWeight: 'bold', color: grades.attendanceMarks >= 25 ? '#059669' : grades.attendanceMarks >= 15 ? '#f59e0b' : '#ef4444' }}>
            {' '}{grades.attendanceMarks}/{grades.maxAttendanceMarks} marks
          </span>
        </div>
      </div>

      {/* Assignment Grades */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e2e8f0' }}>
          <h3 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📝</span>
            Assignment Grades
          </h3>
        </div>

        <div style={{ padding: '0' }}>
          {grades.assignments.map((assignment, index) => {
            const status = getGradeStatusIcon(assignment);

            return (
              <div key={assignment.assignmentId} style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem 1.5rem',
                borderBottom: index < grades.assignments.length - 1 ? '1px solid #f1f5f9' : 'none',
                backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc'
              }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>
                    {assignment.assignmentTitle}
                  </h4>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    Type: {assignment.assignmentType} • Max Marks: {assignment.maxMarks}
                    {assignment.deadline && (
                      <span> • Due: {new Date(assignment.deadline).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  textAlign: 'right'
                }}>
                  <div>
                    <div style={{
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: status.color
                    }}>
                      {assignment.hasGrade && assignment.gradesVisible
                        ? `${assignment.finalMark}/${assignment.maxMarks}`
                        : 'N/A'
                      }
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                      {formatGrade(assignment)}
                    </div>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    minWidth: '120px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: `${status.color}20`,
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      color: status.color
                    }}>
                      <span style={{ fontSize: '1rem' }}>{status.icon}</span>
                      {status.text}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Grade Distribution Chart */}
      {grades.gradeDistribution && (
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>📊</span>
            Grade Distribution
          </h3>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {Object.entries(grades.gradeDistribution).map(([grade, count]) => {
              const gradeInfo = getGradeInfo(grade === 'A+' ? 85 : grade === 'A' ? 77 : grade === 'A-' ? 72 :
                grade === 'B+' ? 67 : grade === 'B' ? 62 : grade === 'B-' ? 57 :
                  grade === 'C' ? 52 : grade === 'D' ? 45 : 35);

              return (
                <div key={grade} style={{
                  padding: '1rem',
                  backgroundColor: `${gradeInfo.color}10`,
                  borderRadius: '8px',
                  border: `2px solid ${gradeInfo.color}30`,
                  textAlign: 'center',
                  minWidth: '80px'
                }}>
                  <div style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: gradeInfo.color
                  }}>
                    {grade}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                    {count} assignments
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentGrades;
