import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';
import './StudentAttendanceView.css';

const StudentAttendanceView = ({ user, courseId, courseCode, courseTitle }) => {
  const [sessions, setSessions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('sessions'); // 'sessions' or 'summary'

  useEffect(() => {
    if (courseId && user) {
      fetchAttendanceData();
    }
  }, [courseId, user]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      
      // Fetch attendance sessions visible to student
      const sessionsResponse = await axios.get(`/attendance/course/${courseId}/student?studentId=${user.id}`);
      setSessions(sessionsResponse.data || []);

      // Fetch attendance summary for the student
      const summaryResponse = await axios.get(`/attendance/student/${user.id}/course/${courseId}/summary`);
      setSummary(summaryResponse.data);
      
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      // Don't show error to student if attendance is not visible or not set up yet
      setSessions([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'long'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PRESENT': return '#10b981';
      case 'ABSENT': return '#dc2626';
      case 'LATE': return '#f59e0b';
      case 'EXCUSED': return '#6366f1';
      default: return '#6b7280';
    }
  };

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'PRESENT': return 'Present';
      case 'ABSENT': return 'Absent';
      case 'LATE': return 'Late';
      case 'EXCUSED': return 'Excused';
      default: return 'Unknown';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PRESENT': return '✅';
      case 'ABSENT': return '❌';
      case 'LATE': return '⏰';
      case 'EXCUSED': return '📝';
      default: return '❓';
    }
  };

  const getAttendanceGrade = (percentage) => {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  };

  if (loading) {
    return (
      <div className="student-attendance-loading">
        <div className="loading-spinner"></div>
        <p>Loading attendance data...</p>
      </div>
    );
  }

  // If no attendance data is available
  if (!sessions.length && !summary) {
    return (
      <div className="student-attendance-empty">
        <div className="empty-icon">📋</div>
        <h3>No Attendance Records</h3>
        <p>Your instructor hasn't set up attendance tracking for this course yet.</p>
      </div>
    );
  }

  return (
    <div className="student-attendance-view">
      <div className="attendance-header">
        <div className="header-info">
          <h2>📋 My Attendance</h2>
          <p className="course-info">{courseCode} - {courseTitle}</p>
        </div>
        <div className="view-toggle">
          <button
            className={`toggle-btn ${view === 'sessions' ? 'active' : ''}`}
            onClick={() => setView('sessions')}
          >
            📅 Sessions
          </button>
          <button
            className={`toggle-btn ${view === 'summary' ? 'active' : ''}`}
            onClick={() => setView('summary')}
          >
            📊 Summary
          </button>
        </div>
      </div>

      {view === 'summary' && summary && (
        <div className="attendance-summary">
          <div className="summary-cards">
            <div className="summary-card total">
              <div className="card-icon">📚</div>
              <div className="card-content">
                <h3>Total Sessions</h3>
                <div className="card-value">{summary.totalEnrolledStudents || 0}</div>
              </div>
            </div>
            <div className="summary-card present">
              <div className="card-icon">✅</div>
              <div className="card-content">
                <h3>Present</h3>
                <div className="card-value">{summary.presentCount || 0}</div>
              </div>
            </div>
            <div className="summary-card absent">
              <div className="card-icon">❌</div>
              <div className="card-content">
                <h3>Absent</h3>
                <div className="card-value">{summary.absentCount || 0}</div>
              </div>
            </div>
            <div className="summary-card percentage">
              <div className="card-icon">📈</div>
              <div className="card-content">
                <h3>Attendance Rate</h3>
                <div className="card-value">
                  {summary.attendancePercentage ? summary.attendancePercentage.toFixed(1) : '0.0'}%
                </div>
                <div className="grade">
                  Grade: {getAttendanceGrade(summary.attendancePercentage || 0)}
                </div>
              </div>
            </div>
          </div>

          {summary.attendancePercentage !== undefined && (
            <div className="progress-section">
              <h3>Attendance Progress</h3>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ 
                    width: `${summary.attendancePercentage}%`,
                    backgroundColor: summary.attendancePercentage >= 75 ? '#10b981' : 
                                   summary.attendancePercentage >= 60 ? '#f59e0b' : '#dc2626'
                  }}
                ></div>
              </div>
              <div className="progress-labels">
                <span>0%</span>
                <span>25%</span>
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
              {summary.attendancePercentage < 75 && (
                <div className="attendance-warning">
                  <div className="warning-icon">⚠️</div>
                  <div className="warning-content">
                    <strong>Attendance Notice</strong>
                    <p>Your attendance is below the recommended 75%. Please make an effort to attend future sessions.</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {view === 'sessions' && (
        <div className="attendance-sessions">
          {sessions.length === 0 ? (
            <div className="empty-sessions">
              <p>No attendance sessions are currently visible to students.</p>
            </div>
          ) : (
            <div className="sessions-list">
              {sessions.map(session => {
                const myRecord = session.attendanceRecords?.[0]; // Student only sees their own record
                return (
                  <div key={session.id} className="session-item">
                    <div className="session-main">
                      <div className="session-info">
                        <h3 className="session-title">{session.sessionTitle}</h3>
                        <p className="session-date">{formatDate(session.sessionDate)}</p>
                        {session.description && (
                          <p className="session-description">{session.description}</p>
                        )}
                      </div>
                      <div className="session-status">
                        {myRecord ? (
                          <div 
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(myRecord.status) }}
                          >
                            <span className="status-icon">{getStatusIcon(myRecord.status)}</span>
                            <span className="status-text">{getStatusDisplay(myRecord.status)}</span>
                          </div>
                        ) : (
                          <div className="status-badge pending">
                            <span className="status-icon">❓</span>
                            <span className="status-text">Pending</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {myRecord?.notes && (
                      <div className="session-notes">
                        <strong>Note:</strong> {myRecord.notes}
                      </div>
                    )}
                    {myRecord?.teacherOverride && (
                      <div className="teacher-override">
                        <span className="override-icon">👨‍🏫</span>
                        <span>Manually marked by instructor</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tips Section */}
      <div className="attendance-tips">
        <h3>📝 Attendance Tips</h3>
        <ul>
          <li><strong>Be punctual:</strong> Arrive on time to avoid being marked as late</li>
          <li><strong>Communicate:</strong> Inform your instructor about planned absences</li>
          <li><strong>Stay updated:</strong> Check this page regularly for attendance updates</li>
          <li><strong>Maintain 75%+:</strong> Aim for at least 75% attendance for good standing</li>
        </ul>
      </div>
    </div>
  );
};

export default StudentAttendanceView;
