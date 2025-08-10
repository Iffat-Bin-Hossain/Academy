import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';
import './AttendanceManagement.css';

const AttendanceManagement = ({ user, courseId, onShowMessage }) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Form states
  const [sessionForm, setSessionForm] = useState({
    sessionDate: '',
    sessionTitle: '',
    description: '',
    isVisibleToStudents: true
  });

  // Attendance data
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('PRESENT');
  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => {
    if (courseId) {
      fetchSessions();
    }
  }, [courseId]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/attendance/course/${courseId}/teacher?teacherId=${user.id}`);
      setSessions(response.data || []);
    } catch (error) {
      console.error('Error fetching attendance sessions:', error);
      onShowMessage('Failed to load attendance sessions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!sessionForm.sessionDate || !sessionForm.sessionTitle) {
      onShowMessage('Please fill in required fields', 'error');
      return;
    }

    try {
      await axios.post(`/attendance/sessions?teacherId=${user.id}`, {
        courseId,
        sessionDate: sessionForm.sessionDate,
        sessionTitle: sessionForm.sessionTitle,
        description: sessionForm.description,
        isVisibleToStudents: sessionForm.isVisibleToStudents
      });
      
      onShowMessage('Attendance session created successfully!', 'success');
      setShowCreateModal(false);
      resetForm();
      fetchSessions();
    } catch (error) {
      console.error('Error creating attendance session:', error);
      onShowMessage(error.response?.data?.error || 'Failed to create attendance session', 'error');
    }
  };

  const openSessionDetails = (session) => {
    setSelectedSession(session);
    setAttendanceRecords(session.attendanceRecords || []);
    setShowEditModal(true);
    setEditMode(false);
  };

  const toggleEditMode = () => {
    // Check if session is locked before allowing edit mode
    if (selectedSession?.isLocked && !editMode) {
      onShowMessage('Cannot edit a locked session. Please unlock it first.', 'warning');
      return;
    }
    setEditMode(!editMode);
  };

  const updateAttendanceStatus = (studentId, status) => {
    if (!editMode) return;
    
    setAttendanceRecords(prev => 
      prev.map(record => 
        record.studentId === studentId 
          ? { ...record, status, teacherOverride: true }
          : record
      )
    );
  };

  const saveAttendance = async (closeModal = false) => {
    if (!selectedSession) return;

    try {
      const attendanceData = {
        sessionId: selectedSession.id,
        attendanceRecords: attendanceRecords.map(record => ({
          studentId: record.studentId,
          status: record.status,
          notes: record.notes || '',
          teacherOverride: record.teacherOverride || false
        }))
      };

      await axios.put(`/attendance/records?teacherId=${user.id}`, attendanceData);
      onShowMessage('Attendance saved successfully!', 'success');
      setEditMode(false);
      
      // Close modal if requested
      if (closeModal) {
        setShowEditModal(false);
        setSelectedSession(null);
      }
      
      fetchSessions();
      
      // Update selected session only if modal stays open
      if (!closeModal) {
        const updatedSession = sessions.find(s => s.id === selectedSession.id);
        if (updatedSession) {
          setSelectedSession({...updatedSession, attendanceRecords});
        }
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      onShowMessage(error.response?.data?.error || 'Failed to save attendance', 'error');
    }
  };

  const bulkMarkAttendance = async () => {
    if (!selectedSession || selectedStudents.length === 0) {
      onShowMessage('Please select students to mark attendance', 'warning');
      return;
    }

    try {
      console.log('Bulk marking attendance:', {
        sessionId: selectedSession.id,
        status: bulkStatus,
        studentIds: selectedStudents,
        totalRecords: attendanceRecords.length
      });

      const response = await axios.put(`/attendance/bulk?teacherId=${user.id}`, {
        sessionId: selectedSession.id,
        status: bulkStatus,
        studentIds: selectedStudents,
        notes: `Bulk marked as ${bulkStatus}`
      });

      // Update local attendance records immediately
      const updatedRecords = attendanceRecords.map(record => 
        selectedStudents.includes(record.studentId)
          ? { ...record, status: bulkStatus, teacherOverride: true, notes: `Bulk marked as ${bulkStatus}` }
          : record
      );
      
      setAttendanceRecords(updatedRecords);
      
      console.log('Updated attendance records:', updatedRecords);

      onShowMessage(`Marked ${selectedStudents.length} students as ${bulkStatus}`, 'success');
      setSelectedStudents([]);
      
      // Refresh the sessions list to update statistics
      fetchSessions();
      
      // Update the selected session with new data
      setSelectedSession(prev => ({
        ...prev,
        attendanceRecords: updatedRecords
      }));
      
    } catch (error) {
      console.error('Error bulk marking attendance:', error);
      onShowMessage(error.response?.data?.error || 'Failed to bulk mark attendance', 'error');
    }
  };

  const toggleSessionLock = async (sessionId, isLocked) => {
    try {
      await axios.put(`/attendance/sessions/settings?teacherId=${user.id}`, {
        sessionId,
        isLocked: !isLocked,
        isVisibleToStudents: selectedSession?.isVisibleToStudents || true
      });

      onShowMessage(`Session ${!isLocked ? 'locked' : 'unlocked'} successfully`, 'success');
      
      // If we're currently in edit mode and locking the session, exit edit mode
      if (!isLocked && editMode) {
        setEditMode(false);
        onShowMessage('Edit mode disabled due to session lock', 'info');
      }
      
      // Update the selected session if it's the one being toggled
      if (selectedSession?.id === sessionId) {
        setSelectedSession(prev => ({
          ...prev,
          isLocked: !isLocked
        }));
      }
      
      fetchSessions();
    } catch (error) {
      console.error('Error toggling session lock:', error);
      onShowMessage(error.response?.data?.error || 'Failed to update session', 'error');
    }
  };

  const toggleSessionVisibility = async (sessionId, isVisible) => {
    try {
      // Update UI immediately
      setSelectedSession(prev => ({
        ...prev,
        isVisibleToStudents: !isVisible
      }));

      await axios.put(`/attendance/sessions/settings?teacherId=${user.id}`, {
        sessionId,
        isLocked: selectedSession?.isLocked || false,
        isVisibleToStudents: !isVisible
      });

      onShowMessage(`Session visibility ${!isVisible ? 'enabled' : 'disabled'} for students`, 'success');
      fetchSessions();
    } catch (error) {
      // Revert UI change on error
      setSelectedSession(prev => ({
        ...prev,
        isVisibleToStudents: isVisible
      }));
      console.error('Error toggling session visibility:', error);
      onShowMessage(error.response?.data?.error || 'Failed to update session visibility', 'error');
    }
  };

  const deleteSession = async (sessionId) => {
    if (!window.confirm('Are you sure you want to delete this attendance session?')) {
      return;
    }

    try {
      await axios.delete(`/attendance/sessions/${sessionId}?teacherId=${user.id}`);
      onShowMessage('Attendance session deleted successfully', 'success');
      fetchSessions();
      if (selectedSession?.id === sessionId) {
        setShowEditModal(false);
        setSelectedSession(null);
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      onShowMessage(error.response?.data?.error || 'Failed to delete session', 'error');
    }
  };

  const resetForm = () => {
    setSessionForm({
      sessionDate: '',
      sessionTitle: '',
      description: '',
      isVisibleToStudents: true
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return 'Not set';
    return new Date(dateTimeString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
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
      case 'PRESENT': return 'P';
      case 'ABSENT': return 'A';
      case 'LATE': return 'L';
      case 'EXCUSED': return 'E';
      default: return '?';
    }
  };

  if (loading) {
    return (
      <div className="attendance-loading">
        <div className="loading-spinner"></div>
        <p>Loading attendance data...</p>
      </div>
    );
  }

  return (
    <div className="attendance-management">
      <div className="attendance-header">
        <h2>📋 Attendance Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <span>➕</span> Create Session
        </button>
      </div>

      <div className="sessions-grid">
        {sessions.length === 0 ? (
          <div className="empty-state">
            <p>No attendance sessions yet.</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              Create First Session
            </button>
          </div>
        ) : (
          sessions.map(session => (
            <div key={session.id} className="session-card">
              <div className="session-header">
                <h3>{session.sessionTitle}</h3>
                <div className="session-badges">
                  {session.isLocked && <span className="badge locked">🔒 Locked</span>}
                  {!session.isVisibleToStudents && <span className="badge hidden">👁️‍🗨️ Hidden</span>}
                </div>
              </div>
              <div className="session-details">
                <p className="session-date">📅 {formatDate(session.sessionDate)}</p>
                <p className="session-created">🕐 Created: {formatDateTime(session.createdAt)}</p>
                {session.description && <p className="session-description">{session.description}</p>}
                <div className="session-stats">
                  <span className="stat present">Present: {session.presentCount || 0}</span>
                  <span className="stat absent">Absent: {session.absentCount || 0}</span>
                  <span className="stat percentage">
                    {session.attendancePercentage ? session.attendancePercentage.toFixed(1) : '0.0'}%
                  </span>
                </div>
              </div>
              <div className="session-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => openSessionDetails(session)}
                >
                  View Details
                </button>
                <button
                  className="btn btn-warning"
                  onClick={() => toggleSessionLock(session.id, session.isLocked)}
                >
                  {session.isLocked ? '🔓 Unlock' : '🔒 Lock'}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => deleteSession(session.id)}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Attendance Session</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateSession}>
              <div className="form-group">
                <label htmlFor="sessionDate">Date *</label>
                <input
                  id="sessionDate"
                  type="date"
                  className="form-control"
                  value={sessionForm.sessionDate}
                  onChange={(e) => setSessionForm({...sessionForm, sessionDate: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="sessionTitle">Title *</label>
                <input
                  id="sessionTitle"
                  type="text"
                  className="form-control"
                  placeholder="e.g., Class 1 - Introduction"
                  value={sessionForm.sessionTitle}
                  onChange={(e) => setSessionForm({...sessionForm, sessionTitle: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  className="form-control"
                  placeholder="Optional description..."
                  rows="3"
                  value={sessionForm.description}
                  onChange={(e) => setSessionForm({...sessionForm, description: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={sessionForm.isVisibleToStudents}
                    onChange={(e) => setSessionForm({...sessionForm, isVisibleToStudents: e.target.checked})}
                  />
                  Visible to students
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      {showEditModal && selectedSession && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{selectedSession.sessionTitle}</h3>
                <p>{formatDate(selectedSession.sessionDate)}</p>
                <small className="session-created-info">
                  Created: {formatDateTime(selectedSession.createdAt)}
                  {selectedSession.createdByName && ` by ${selectedSession.createdByName}`}
                </small>
              </div>
              <div className="modal-header-actions">
                {!selectedSession.isLocked && !editMode && (
                  <button
                    className="btn btn-primary"
                    onClick={toggleEditMode}
                  >
                    ✏️ Edit
                  </button>
                )}
                {!selectedSession.isLocked && editMode && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() => saveAttendance(false)}
                      title="Save changes and continue editing"
                    >
                      💾 Save
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => saveAttendance(true)}
                      title="Save changes and close modal"
                    >
                      💾 Save & Close
                    </button>
                  </>
                )}
                {selectedSession.isLocked && (
                  <span className="locked-indicator" title="Session is locked - cannot edit">
                    🔒 Locked
                  </span>
                )}
                <button
                  className="btn btn-warning btn-sm"
                  onClick={() => toggleSessionLock(selectedSession.id, selectedSession.isLocked)}
                  title={selectedSession.isLocked ? 'Unlock session to enable editing' : 'Lock session to prevent editing'}
                >
                  {selectedSession.isLocked ? '🔓 Unlock' : '🔒 Lock'}
                </button>
                <button className="modal-close" onClick={() => {
                  // Auto-save if in edit mode before closing
                  if (editMode) {
                    saveAttendance(true);
                  } else {
                    setShowEditModal(false);
                    setSelectedSession(null);
                  }
                }}>×</button>
              </div>
            </div>

            {editMode && !selectedSession.isLocked && (
              <div className="bulk-actions">
                <h4>Bulk Actions</h4>
                <div className="bulk-controls">
                  <div className="bulk-select-controls">
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => {
                        const allStudentIds = attendanceRecords.map(record => record.studentId);
                        setSelectedStudents(allStudentIds);
                      }}
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-secondary"
                      onClick={() => setSelectedStudents([])}
                    >
                      Clear Selection
                    </button>
                  </div>
                  <select 
                    value={bulkStatus} 
                    onChange={(e) => setBulkStatus(e.target.value)}
                    className="form-control"
                  >
                    <option value="PRESENT">Present</option>
                    <option value="ABSENT">Absent</option>
                    <option value="LATE">Late</option>
                    <option value="EXCUSED">Excused</option>
                  </select>
                  <button
                    className="btn btn-primary"
                    onClick={bulkMarkAttendance}
                    disabled={selectedStudents.length === 0}
                  >
                    Mark Selected ({selectedStudents.length})
                  </button>
                </div>
              </div>
            )}

            <div className="attendance-table">
              <table>
                <thead>
                  <tr>
                    {editMode && !selectedSession.isLocked && <th>Select</th>}
                    <th>Student</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceRecords.map(record => (
                    <tr key={record.studentId}>
                      {editMode && !selectedSession.isLocked && (
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedStudents.includes(record.studentId)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudents([...selectedStudents, record.studentId]);
                              } else {
                                setSelectedStudents(selectedStudents.filter(id => id !== record.studentId));
                              }
                            }}
                          />
                        </td>
                      )}
                      <td>
                        <div className="student-info">
                          <strong>{record.studentName}</strong>
                          <small>{record.studentEmail}</small>
                        </div>
                      </td>
                      <td>
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(record.status) }}
                        >
                          {getStatusDisplay(record.status)}
                        </span>
                      </td>
                      <td>
                        {editMode && !selectedSession.isLocked ? (
                          <div className="status-buttons">
                            {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map(status => (
                              <button
                                key={status}
                                className={`btn btn-sm ${record.status === status ? 'active' : ''}`}
                                onClick={() => updateAttendanceStatus(record.studentId, status)}
                                style={{ backgroundColor: getStatusColor(status) }}
                              >
                                {getStatusDisplay(status)}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="status-display">
                            <span className="status-text">{record.status}</span>
                            {selectedSession.isLocked && (
                              <small className="locked-note">🔒 Session locked</small>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="session-settings">
              <h4>Session Settings</h4>
              <div className="settings-controls">
                <label>
                  <input
                    type="checkbox"
                    checked={!selectedSession.isVisibleToStudents}
                    onChange={() => toggleSessionVisibility(selectedSession.id, selectedSession.isVisibleToStudents)}
                  />
                  Hide from students
                </label>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceManagement;
