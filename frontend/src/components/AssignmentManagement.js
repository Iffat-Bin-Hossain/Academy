import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';

const AssignmentManagement = ({ user, courses, onShowMessage }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Assignment form data
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    content: '',
    maxMarks: '',
    courseId: '',
    deadline: '',
    lateSubmissionDeadline: '',
    instructions: '',
    assignmentType: 'HOMEWORK'
  });

  useEffect(() => {
    fetchAssignments();
  }, [courses, selectedCourse]);

  // Helper function to format date for datetime-local input (no timezone conversion)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    // Simply format the date without any timezone adjustments
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper function to convert datetime-local input to ISO string (no timezone conversion)
  const convertInputDateToISO = (inputDateString) => {
    if (!inputDateString) return null;
    // Keep the exact datetime as entered
    return new Date(inputDateString).toISOString();
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      let allAssignments = [];

      if (selectedCourse) {
        // Fetch assignments for specific course
        const response = await axios.get(`/assignments/course/${selectedCourse}`);
        allAssignments = response.data || [];
      } else {
        // Fetch assignments for all teacher's courses
        const promises = courses.map(course => 
          axios.get(`/assignments/course/${course.id}`)
            .then(response => response.data?.map(assignment => ({
              ...assignment,
              courseName: course.title,
              courseCode: course.courseCode
            })) || [])
            .catch(error => {
              console.error(`Error fetching assignments for course ${course.id}:`, error);
              return [];
            })
        );
        
        const results = await Promise.all(promises);
        allAssignments = results.flat();
      }

      setAssignments(allAssignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      onShowMessage('Failed to load assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    
    if (!assignmentForm.title || !assignmentForm.content || !assignmentForm.maxMarks || 
        !assignmentForm.courseId || !assignmentForm.deadline) {
      onShowMessage('Please fill in all required fields', 'error');
      return;
    }

    // Validate that late submission deadline is after main deadline
    if (assignmentForm.lateSubmissionDeadline && assignmentForm.deadline) {
      const mainDeadline = new Date(assignmentForm.deadline);
      const lateDeadline = new Date(assignmentForm.lateSubmissionDeadline);
      
      if (lateDeadline <= mainDeadline) {
        onShowMessage('Late submission deadline must be after the main deadline', 'error');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const deadline = new Date(assignmentForm.deadline);
      const lateDeadline = assignmentForm.lateSubmissionDeadline 
        ? new Date(assignmentForm.lateSubmissionDeadline)
        : new Date(deadline.getTime() + 2 * 24 * 60 * 60 * 1000); // Default: 2 days after main deadline

      const data = {
        title: assignmentForm.title,
        content: assignmentForm.content,
        maxMarks: parseInt(assignmentForm.maxMarks),
        courseId: parseInt(assignmentForm.courseId),
        deadline: convertInputDateToISO(assignmentForm.deadline),
        lateSubmissionDeadline: assignmentForm.lateSubmissionDeadline ? 
          convertInputDateToISO(assignmentForm.lateSubmissionDeadline) : 
          lateDeadline.toISOString(),
        instructions: assignmentForm.instructions || '',
        assignmentType: assignmentForm.assignmentType
      };

      const response = await axios.post(`/assignments?teacherId=${user.id}`, data);
      
      onShowMessage('Assignment created successfully!', 'success');
      setShowCreateModal(false);
      resetForm();
      fetchAssignments();
    } catch (error) {
      console.error('Error creating assignment:', error);
      onShowMessage(error.response?.data?.error || 'Failed to create assignment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAssignment = async (e) => {
    e.preventDefault();
    
    if (!assignmentForm.title || !assignmentForm.content || !assignmentForm.maxMarks || 
        !assignmentForm.deadline) {
      onShowMessage('Please fill in all required fields', 'error');
      return;
    }

    // Validate that late submission deadline is after main deadline
    if (assignmentForm.lateSubmissionDeadline && assignmentForm.deadline) {
      const mainDeadline = new Date(assignmentForm.deadline);
      const lateDeadline = new Date(assignmentForm.lateSubmissionDeadline);
      
      if (lateDeadline <= mainDeadline) {
        onShowMessage('Late submission deadline must be after the main deadline', 'error');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const deadline = new Date(assignmentForm.deadline);
      const lateDeadline = assignmentForm.lateSubmissionDeadline 
        ? new Date(assignmentForm.lateSubmissionDeadline)
        : new Date(deadline.getTime() + 2 * 24 * 60 * 60 * 1000);

      const data = {
        title: assignmentForm.title,
        content: assignmentForm.content,
        maxMarks: parseInt(assignmentForm.maxMarks),
        deadline: convertInputDateToISO(assignmentForm.deadline),
        lateSubmissionDeadline: assignmentForm.lateSubmissionDeadline ? 
          convertInputDateToISO(assignmentForm.lateSubmissionDeadline) : 
          lateDeadline.toISOString(),
        instructions: assignmentForm.instructions || '',
        assignmentType: assignmentForm.assignmentType
      };

      await axios.put(`/assignments/${editingAssignment.id}?teacherId=${user.id}`, data);
      
      onShowMessage('Assignment updated successfully!', 'success');
      setShowEditModal(false);
      setEditingAssignment(null);
      resetForm();
      fetchAssignments();
    } catch (error) {
      console.error('Error updating assignment:', error);
      onShowMessage(error.response?.data?.error || 'Failed to update assignment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/assignments/${assignmentId}?teacherId=${user.id}`);
      onShowMessage('Assignment deleted successfully!', 'success');
      fetchAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      onShowMessage(error.response?.data?.error || 'Failed to delete assignment', 'error');
    }
  };

  const openEditModal = (assignment) => {
    setEditingAssignment(assignment);
    setAssignmentForm({
      title: assignment.title,
      content: assignment.content,
      maxMarks: assignment.maxMarks.toString(),
      courseId: assignment.courseId?.toString() || '',
      deadline: formatDateForInput(assignment.deadline),
      lateSubmissionDeadline: formatDateForInput(assignment.lateSubmissionDeadline),
      instructions: assignment.instructions || '',
      assignmentType: assignment.assignmentType || 'HOMEWORK'
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setAssignmentForm({
      title: '',
      content: '',
      maxMarks: '',
      courseId: '',
      deadline: '',
      lateSubmissionDeadline: '',
      instructions: '',
      assignmentType: 'HOMEWORK'
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    // Display date exactly as stored without any timezone conversion
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilteredAssignments = () => {
    if (!searchTerm) return assignments;
    
    return assignments.filter(assignment => 
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.courseCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getAssignmentStats = () => {
    const now = new Date();
    const upcoming = assignments.filter(a => new Date(a.deadline) > now).length;
    const overdue = assignments.filter(a => new Date(a.deadline) < now).length;
    const total = assignments.length;
    
    return { total, upcoming, overdue };
  };

  const stats = getAssignmentStats();
  const filteredAssignments = getFilteredAssignments();

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="spinner"></div>
            <p>Loading assignments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Assignment Stats */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <span className="stat-icon">📝</span>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Assignments</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏰</span>
          <div className="stat-value">{stats.upcoming}</div>
          <div className="stat-label">Upcoming</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⚠️</span>
          <div className="stat-value">{stats.overdue}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      {/* Main Assignment Management Card */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <h3 className="card-title">Assignment Management</h3>
              <p className="card-subtitle">
                {filteredAssignments.length} of {assignments.length} assignments {searchTerm && '(filtered)'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <select
                className="form-control"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                style={{ minWidth: '150px' }}
              >
                <option value="">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.courseCode} - {course.title}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className="form-control"
                placeholder="🔍 Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: '0.875rem', minWidth: '250px' }}
              />
              <button 
                className="btn btn-primary"
                onClick={() => setShowCreateModal(true)}
                style={{ whiteSpace: 'nowrap' }}
              >
                <span style={{ marginRight: '0.5rem' }}>➕</span>
                Create Assignment
              </button>
            </div>
          </div>
        </div>
        <div className="card-body">
          {filteredAssignments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              {assignments.length === 0 ? (
                <>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📝</span>
                  <h4>No assignments yet</h4>
                  <p>Create your first assignment to get started.</p>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🔍</span>
                  <h4>No assignments found</h4>
                  <p>No assignments match your search criteria.</p>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredAssignments.map(assignment => {
                const deadline = new Date(assignment.deadline);
                const isOverdue = deadline < new Date();
                const lateDeadline = assignment.lateSubmissionDeadline ? new Date(assignment.lateSubmissionDeadline) : null;
                const isLateAllowed = lateDeadline && lateDeadline > new Date();
                
                return (
                  <div 
                    key={assignment.id} 
                    className="card" 
                    style={{ 
                      border: isOverdue ? '1px solid #ef4444' : '1px solid #e2e8f0',
                      background: isOverdue ? '#fef2f2' : 'white'
                    }}
                  >
                    <div className="card-body" style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <h4 style={{ margin: 0, color: '#1e293b' }}>
                              {assignment.title}
                            </h4>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              background: assignment.assignmentType === 'EXAM' ? '#fecaca' :
                                        assignment.assignmentType === 'PROJECT' ? '#a7f3d0' : '#fef3c7',
                              color: assignment.assignmentType === 'EXAM' ? '#dc2626' :
                                    assignment.assignmentType === 'PROJECT' ? '#065f46' : '#92400e'
                            }}>
                              {assignment.assignmentType}
                            </span>
                            {(assignment.courseName || assignment.courseCode) && (
                              <span style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                background: '#3b82f6',
                                color: 'white'
                              }}>
                                {assignment.courseCode || `Course ${assignment.courseId}`}
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '0 0 1rem 0', color: '#64748b' }}>
                            {assignment.content}
                          </p>
                          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#64748b', flexWrap: 'wrap' }}>
                            <span>📊 Max Marks: {assignment.maxMarks}</span>
                            <span style={{ color: isOverdue ? '#dc2626' : '#64748b' }}>
                              📅 Due: {formatDate(assignment.deadline)}
                            </span>
                            {assignment.lateSubmissionDeadline && (
                              <span style={{ color: isLateAllowed ? '#059669' : '#dc2626' }}>
                                ⏰ Late Until: {formatDate(assignment.lateSubmissionDeadline)}
                              </span>
                            )}
                            <span>📝 Created: {formatDate(assignment.createdAt)}</span>
                          </div>
                          {assignment.instructions && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <strong style={{ fontSize: '0.875rem', color: '#374151' }}>Instructions:</strong>
                              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                                {assignment.instructions}
                              </p>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEditModal(assignment)}
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Assignment</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateAssignment}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="course">Course *</label>
                  <select
                    id="course"
                    className="form-control"
                    value={assignmentForm.courseId}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, courseId: e.target.value })}
                    required
                  >
                    <option value="">Select a course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.courseCode} - {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="title">Assignment Title *</label>
                  <input
                    id="title"
                    type="text"
                    className="form-control"
                    placeholder="Enter assignment title"
                    value={assignmentForm.title}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="content">Description *</label>
                  <textarea
                    id="content"
                    className="form-control"
                    placeholder="Enter assignment description"
                    rows="4"
                    value={assignmentForm.content}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, content: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="maxMarks">Maximum Marks *</label>
                    <input
                      id="maxMarks"
                      type="number"
                      className="form-control"
                      placeholder="e.g., 100"
                      value={assignmentForm.maxMarks}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, maxMarks: e.target.value })}
                      min="1"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="assignmentType">Assignment Type</label>
                    <select
                      id="assignmentType"
                      className="form-control"
                      value={assignmentForm.assignmentType}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, assignmentType: e.target.value })}
                    >
                      <option value="HOMEWORK">Homework</option>
                      <option value="PROJECT">Project</option>
                      <option value="EXAM">Exam</option>
                      <option value="QUIZ">Quiz</option>
                      <option value="LAB">Lab Work</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="deadline">Deadline *</label>
                    <input
                      id="deadline"
                      type="datetime-local"
                      className="form-control"
                      value={assignmentForm.deadline}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, deadline: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="lateDeadline">Late Submission Deadline</label>
                    <input
                      id="lateDeadline"
                      type="datetime-local"
                      className="form-control"
                      value={assignmentForm.lateSubmissionDeadline}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, lateSubmissionDeadline: e.target.value })}
                    />
                    <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      Optional: Leave empty for 2 days after main deadline
                    </small>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="instructions">Additional Instructions</label>
                  <textarea
                    id="instructions"
                    className="form-control"
                    placeholder="Enter any additional instructions or requirements"
                    rows="3"
                    value={assignmentForm.instructions}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, instructions: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span style={{ marginRight: '0.5rem' }}>⏳</span>
                      Creating...
                    </>
                  ) : (
                    <>
                      <span style={{ marginRight: '0.5rem' }}>➕</span>
                      Create Assignment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {showEditModal && editingAssignment && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Assignment</h3>
              <button 
                className="modal-close"
                onClick={() => setShowEditModal(false)}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditAssignment}>
              <div className="modal-body">
                <div className="form-group">
                  <label htmlFor="editTitle">Assignment Title *</label>
                  <input
                    id="editTitle"
                    type="text"
                    className="form-control"
                    placeholder="Enter assignment title"
                    value={assignmentForm.title}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="editContent">Description *</label>
                  <textarea
                    id="editContent"
                    className="form-control"
                    placeholder="Enter assignment description"
                    rows="4"
                    value={assignmentForm.content}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, content: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="editMaxMarks">Maximum Marks *</label>
                    <input
                      id="editMaxMarks"
                      type="number"
                      className="form-control"
                      placeholder="e.g., 100"
                      value={assignmentForm.maxMarks}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, maxMarks: e.target.value })}
                      min="1"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="editAssignmentType">Assignment Type</label>
                    <select
                      id="editAssignmentType"
                      className="form-control"
                      value={assignmentForm.assignmentType}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, assignmentType: e.target.value })}
                    >
                      <option value="HOMEWORK">Homework</option>
                      <option value="PROJECT">Project</option>
                      <option value="EXAM">Exam</option>
                      <option value="QUIZ">Quiz</option>
                      <option value="LAB">Lab Work</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="editDeadline">Deadline *</label>
                    <input
                      id="editDeadline"
                      type="datetime-local"
                      className="form-control"
                      value={assignmentForm.deadline}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, deadline: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="editLateDeadline">Late Submission Deadline</label>
                    <input
                      id="editLateDeadline"
                      type="datetime-local"
                      className="form-control"
                      value={assignmentForm.lateSubmissionDeadline}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, lateSubmissionDeadline: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="editInstructions">Additional Instructions</label>
                  <textarea
                    id="editInstructions"
                    className="form-control"
                    placeholder="Enter any additional instructions or requirements"
                    rows="3"
                    value={assignmentForm.instructions}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, instructions: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowEditModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span style={{ marginRight: '0.5rem' }}>⏳</span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <span style={{ marginRight: '0.5rem' }}>💾</span>
                      Update Assignment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AssignmentManagement;
