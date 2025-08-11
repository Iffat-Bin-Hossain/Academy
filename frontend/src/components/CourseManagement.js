import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';
import Layout from './Layout';
import './CourseManagement.css';

const CourseManagement = ({ courseId, onBack }) => {
  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [showTeacherHistory, setShowTeacherHistory] = useState(false);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [enrollmentFilter, setEnrollmentFilter] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED
  // Removed bulk actions state variables - Admin can only view enrollment status

  useEffect(() => {
    // Get user info from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          name: payload.sub,
          role: 'ADMIN',
          email: payload.sub
        });
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
    
    if (courseId) {
      fetchCourseData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]); // fetchCourseData is stable, no need to include it

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      
      // Fetch course details, teachers, and enrollments in parallel
      const [courseResponse, teachersResponse, enrollmentsResponse] = await Promise.all([
        axios.get(`/courses/${courseId}`),
        axios.get('/admin/users'),
        axios.get(`/courses/${courseId}/enrollments`)
      ]);

      setCourse(courseResponse.data);
      // Filter only approved teachers
      const approvedTeachers = teachersResponse.data.filter(
        user => user.role === 'TEACHER' && user.approved
      );
      setTeachers(approvedTeachers);
      setEnrollments(enrollmentsResponse.data || []);

    } catch (error) {
      console.error('Error fetching course data:', error);
      showMessage('Failed to load course data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const openTeacherModal = () => {
    setSelectedTeacher(course?.assignedTeacher?.id?.toString() || '');
    setShowTeacherModal(true);
  };

  const closeTeacherModal = () => {
    setShowTeacherModal(false);
    setSelectedTeacher('');
    setTeacherSearchTerm('');
  };

  const assignTeacher = async () => {
    if (!selectedTeacher) {
      showMessage('Please select a teacher', 'error');
      return;
    }

    setIsAssigning(true);
    try {
      await axios.post(`/courses/assign?courseId=${courseId}&teacherId=${selectedTeacher}`);
      showMessage('Teacher assigned successfully!', 'success');
      closeTeacherModal();
      fetchCourseData(); // Refresh data
    } catch (error) {
      console.error('Error assigning teacher:', error);
      showMessage('Failed to assign teacher', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const removeTeacher = async () => {
    if (!window.confirm('Are you sure you want to remove the assigned teacher from this course?')) {
      return;
    }

    try {
      await axios.post(`/courses/remove-teacher?courseId=${courseId}`);
      showMessage('Teacher removed successfully!', 'success');
      fetchCourseData(); // Refresh data
    } catch (error) {
      console.error('Error removing teacher:', error);
      showMessage('Failed to remove teacher', 'error');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEnrollmentStats = () => {
    const approved = enrollments.filter(e => e.status === 'APPROVED').length;
    const pending = enrollments.filter(e => e.status === 'PENDING').length;
    const rejected = enrollments.filter(e => e.status === 'REJECTED').length;
    const total = enrollments.length;
    
    return { approved, pending, rejected, total };
  };

  const getFilteredEnrollments = () => {
    let filtered = enrollments;
    
    if (enrollmentFilter !== 'ALL') {
      filtered = filtered.filter(e => e.status === enrollmentFilter);
    }
    
    return filtered;
  };

  const getFilteredTeachers = () => {
    if (!teacherSearchTerm) return teachers;
    
    return teachers.filter(teacher => 
      teacher.name.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
      teacher.email.toLowerCase().includes(teacherSearchTerm.toLowerCase())
    );
  };

  // Removed bulk selection functionality - Only teachers should manage enrollments
  // Admin can only view enrollment status

  // Removed bulk enrollment actions - Only teachers should manage student enrollments
  // Admin role is limited to viewing enrollment status and managing course-teacher assignments

  if (loading) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="loading">
          <div className="spinner"></div>
          Loading course details...
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <h3>Course not found</h3>
          <button className="btn btn-primary" onClick={onBack}>
            Back to Courses
          </button>
        </div>
      </Layout>
    );
  }

  const stats = getEnrollmentStats();

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout}
      pageTitle="Course Management"
      pageSubtitle="Manage course details, teachers, and enrollments"
    >
      {/* Message Alert */}
      {message && (
        <div className={`alert alert-${messageType}`}>
          {message}
        </div>
      )}

      {/* Back Button */}
      <div style={{ marginBottom: '2rem' }}>
        <button 
          className="btn btn-secondary"
          onClick={onBack}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          ← Back to Courses
        </button>
      </div>

      {/* Course Header */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, color: '#1e293b' }}>{course.title}</h2>
                <span style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  background: '#3b82f6',
                  color: 'white'
                }}>
                  {course.courseCode}
                </span>
              </div>
              <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '1.1rem' }}>
                {course.description}
              </p>
              <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#64748b' }}>
                <span>📅 Created: {formatDate(course.createdAt)}</span>
                <span>🆔 Course ID: {course.id}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <span className="stat-icon">👨‍🎓</span>
          <div className="stat-value">{stats.approved}</div>
          <div className="stat-label">Enrolled Students</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏳</span>
          <div className="stat-value">{stats.pending}</div>
          <div className="stat-label">Pending Requests</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">❌</span>
          <div className="stat-value">{stats.rejected}</div>
          <div className="stat-label">Rejected Requests</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">👨‍🏫</span>
          <div className="stat-value">{course.assignedTeacher ? '1' : '0'}</div>
          <div className="stat-label">Assigned Teachers</div>
        </div>
      </div>

      {/* Teacher Management Section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">👨‍🏫 Teacher Assignment</h3>
          <p className="card-subtitle">Manage course instructor</p>
        </div>
        <div className="card-body">
          {course.assignedTeacher ? (
            <div className="teacher-assignment-card">
              <div className="teacher-info">
                <div className="teacher-avatar">
                  {course.assignedTeacher.name.charAt(0)}
                </div>
                <div>
                  <h4 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>
                    {course.assignedTeacher.name}
                  </h4>
                  <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
                    {course.assignedTeacher.email}
                  </p>
                  <span style={{
                    display: 'inline-block',
                    marginTop: '0.5rem',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: '600',
                    background: '#10b981',
                    color: 'white'
                  }}>
                    ASSIGNED
                  </span>
                </div>
              </div>
              <div className="teacher-actions">
                <button 
                  className="btn btn-secondary btn-sm"
                  onClick={openTeacherModal}
                >
                  🔄 Change Teacher
                </button>
                <button 
                  className="btn btn-danger btn-sm"
                  onClick={removeTeacher}
                >
                  ❌ Remove Teacher
                </button>
                <button 
                  className="btn btn-info btn-sm"
                  onClick={() => setShowTeacherHistory(!showTeacherHistory)}
                >
                  📊 View Details
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>👨‍🏫</span>
              <h4 style={{ color: '#64748b' }}>No Teacher Assigned</h4>
              <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                This course needs a teacher to manage student enrollments
              </p>
              <button 
                className="btn btn-primary"
                onClick={openTeacherModal}
              >
                <span style={{ marginRight: '0.5rem' }}>➕</span>
                Assign Teacher
              </button>
            </div>
          )}

          {/* Teacher Details Section */}
          {showTeacherHistory && course.assignedTeacher && (
            <div style={{ 
              marginTop: '1.5rem', 
              padding: '1rem', 
              background: '#f8fafc', 
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <h5 style={{ margin: '0 0 1rem 0', color: '#1e293b' }}>Teacher Details</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <div>
                  <strong>Full Name:</strong>
                  <p style={{ margin: '0.25rem 0', color: '#64748b' }}>{course.assignedTeacher.name}</p>
                </div>
                <div>
                  <strong>Email:</strong>
                  <p style={{ margin: '0.25rem 0', color: '#64748b' }}>{course.assignedTeacher.email}</p>
                </div>
                <div>
                  <strong>Role:</strong>
                  <p style={{ margin: '0.25rem 0', color: '#64748b' }}>{course.assignedTeacher.role}</p>
                </div>
                <div>
                  <strong>Status:</strong>
                  <p style={{ margin: '0.25rem 0', color: '#10b981' }}>
                    {course.assignedTeacher.approved ? '✅ Approved' : '⏳ Pending Approval'}
                  </p>
                </div>
              </div>
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                <strong>Assignment Summary:</strong>
                <div style={{ marginTop: '0.5rem', display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                  <span style={{ color: '#64748b' }}>
                    📚 Managing: {stats.approved} enrolled student(s)
                  </span>
                  <span style={{ color: '#64748b' }}>
                    ⏳ Pending: {stats.pending} enrollment request(s)
                  </span>
                  <span style={{ color: '#64748b' }}>
                    📅 Assigned: {formatDate(course.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Student Enrollments Section */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 className="card-title">👨‍🎓 Student Enrollments</h3>
              <p className="card-subtitle">View student enrollment status and activity</p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <select
                className="form-control"
                value={enrollmentFilter}
                onChange={(e) => setEnrollmentFilter(e.target.value)}
                style={{ minWidth: '150px' }}
              >
                <option value="ALL">All Status ({stats.total})</option>
                <option value="PENDING">Pending ({stats.pending})</option>
                <option value="APPROVED">Approved ({stats.approved})</option>
                <option value="REJECTED">Rejected ({stats.rejected})</option>
              </select>
              {/* Removed Bulk Actions - Only teachers should manage student enrollments */}
            </div>
          </div>
        </div>
        <div className="card-body">
          {getFilteredEnrollments().length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📝</span>
              <h4>No {enrollmentFilter === 'ALL' ? 'Enrollment Requests' : `${enrollmentFilter.toLowerCase()} requests`}</h4>
              <p>
                {enrollmentFilter === 'ALL' 
                  ? "Students haven't requested enrollment in this course yet." 
                  : `No ${enrollmentFilter.toLowerCase()} enrollment requests found.`
                }
              </p>
            </div>
          ) : (
            <>
              {/* Admin can only view enrollment status - Teachers manage approvals/rejections */}
              
              <div className="enrollment-list">
                {getFilteredEnrollments().map(enrollment => (
                  <div key={enrollment.id} className="enrollment-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {/* Removed checkbox - Admin can only view enrollment status */}
                      <div className="student-info">
                        <div className="student-avatar">
                          {enrollment.student.name.charAt(0)}
                        </div>
                        <div>
                          <h5 style={{ margin: '0 0 0.25rem 0', color: '#1e293b' }}>
                            {enrollment.student.name}
                          </h5>
                          <p style={{ margin: '0 0 0.25rem 0', color: '#64748b', fontSize: '0.875rem' }}>
                            {enrollment.student.email}
                          </p>
                          <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Requested: {formatDate(enrollment.enrolledAt)}
                          </span>
                          {enrollment.decisionAt && (
                            <span style={{ fontSize: '0.75rem', color: '#64748b', display: 'block' }}>
                              Decision: {formatDate(enrollment.decisionAt)}
                              {enrollment.actionBy && ` by ${enrollment.actionBy.name}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="enrollment-status">
                      <span className={`status-badge status-${enrollment.status.toLowerCase()}`}>
                        {enrollment.status === 'APPROVED' && '✅'}
                        {enrollment.status === 'PENDING' && '⏳'}
                        {enrollment.status === 'REJECTED' && '❌'}
                        {enrollment.status === 'RETAKING' && '🔄'}
                        {' '}
                        {enrollment.status}
                      </span>
                      {enrollment.status === 'PENDING' && course.assignedTeacher && (
                        <p style={{ margin: '0.5rem 0 0 0', color: '#64748b', fontSize: '0.75rem', fontStyle: 'italic' }}>
                          Awaiting {course.assignedTeacher.name}'s approval
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Teacher Assignment Modal */}
      {showTeacherModal && (
        <div className="modal-overlay" onClick={closeTeacherModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Assign Teacher</h3>
              <button 
                className="modal-close"
                onClick={closeTeacherModal}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="teacherSearch">Search Teachers</label>
                <input
                  id="teacherSearch"
                  type="text"
                  className="form-control"
                  placeholder="Search by name or email..."
                  value={teacherSearchTerm}
                  onChange={(e) => setTeacherSearchTerm(e.target.value)}
                  style={{ marginBottom: '1rem' }}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="teacherSelect">Select Teacher</label>
                <select
                  id="teacherSelect"
                  className="form-control"
                  value={selectedTeacher}
                  onChange={(e) => setSelectedTeacher(e.target.value)}
                >
                  <option value="">-- Select a teacher --</option>
                  {getFilteredTeachers().map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name} ({teacher.email})
                    </option>
                  ))}
                </select>
                <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem', display: 'block' }}>
                  Showing {getFilteredTeachers().length} of {teachers.length} approved teachers
                </small>
              </div>
              
              {teachers.length === 0 && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '1rem', 
                  color: '#64748b',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  margin: '1rem 0'
                }}>
                  <p>No approved teachers available. Please ensure teachers are approved in the user management section.</p>
                </div>
              )}

              {getFilteredTeachers().length === 0 && teachers.length > 0 && teacherSearchTerm && (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '1rem', 
                  color: '#64748b',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  margin: '1rem 0'
                }}>
                  <p>No teachers found matching "{teacherSearchTerm}"</p>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={closeTeacherModal}
                disabled={isAssigning}
              >
                Cancel
              </button>
              <button 
                className="btn btn-primary"
                onClick={assignTeacher}
                disabled={isAssigning || !selectedTeacher}
              >
                {isAssigning ? (
                  <>
                    <span style={{ marginRight: '0.5rem' }}>⏳</span>
                    Assigning...
                  </>
                ) : (
                  <>
                    <span style={{ marginRight: '0.5rem' }}>✅</span>
                    Assign Teacher
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CourseManagement;
