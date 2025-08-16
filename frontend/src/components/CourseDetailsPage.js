import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';
import Layout from './Layout';
import AssignmentManagement from './AssignmentManagement';
import ResourceManagement from './ResourceManagement';
import DiscussionThreads from './DiscussionThreads';
import AttendanceManagement from './AttendanceManagement';
import AssessmentGrid from './AssessmentGrid';
import GradeVisibilityControl from './GradeVisibilityControl';

const CourseDetailsPage = () => {
  const { courseCode } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('students');
  
  // Bulk selection states
  const [selectedEnrollments, setSelectedEnrollments] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);

  useEffect(() => {
    fetchData();
  }, [courseCode]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get current user info
      const userResponse = await axios.get('/user/me');
      const currentUser = userResponse.data;
      
      setUser({
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        email: currentUser.email
      });
      
      // Get all courses for this teacher and find the one with matching courseCode
      const coursesResponse = await axios.get(`/courses/teacher/${currentUser.id}`);
      const foundCourse = coursesResponse.data.find(c => c.courseCode === courseCode);
      
      if (!foundCourse) {
        showMessage('Course not found', 'error');
        return;
      }
      
      setCourse(foundCourse);
      
      // Get enrollments for this specific course
      const enrollmentsResponse = await axios.get(`/courses/${foundCourse.id}/enrollments`);
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

  const approveEnrollment = async (enrollmentId) => {
    if (!user || !user.id) {
      showMessage('User information not available', 'error');
      return;
    }

    try {
      const response = await axios.post('/courses/decide', null, {
        params: {
          enrollmentId: enrollmentId,
          approve: true,
          teacherId: user.id
        }
      });
      
      showMessage(response.data, 'success');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error approving enrollment:', error);
      showMessage(error.response?.data || 'Failed to approve enrollment', 'error');
    }
  };

  const rejectEnrollment = async (enrollmentId) => {
    if (!window.confirm('Are you sure you want to reject this enrollment request?')) {
      return;
    }

    if (!user || !user.id) {
      showMessage('User information not available', 'error');
      return;
    }

    try {
      const response = await axios.post('/courses/decide', null, {
        params: {
          enrollmentId: enrollmentId,
          approve: false,
          teacherId: user.id
        }
      });
      
      showMessage(response.data, 'success');
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting enrollment:', error);
      showMessage(error.response?.data || 'Failed to reject enrollment', 'error');
    }
  };

  // Bulk selection functions
  const toggleSelectEnrollment = (enrollmentId) => {
    const newSelected = new Set(selectedEnrollments);
    if (newSelected.has(enrollmentId)) {
      newSelected.delete(enrollmentId);
    } else {
      newSelected.add(enrollmentId);
    }
    setSelectedEnrollments(newSelected);
    setSelectAll(newSelected.size === getFilteredEnrollments().filter(e => e.status === 'PENDING' || e.status === 'RETAKING').length);
  };

  const toggleSelectAll = () => {
    const actionableEnrollments = getFilteredEnrollments().filter(e => e.status === 'PENDING' || e.status === 'RETAKING');
    if (selectAll) {
      setSelectedEnrollments(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(actionableEnrollments.map(e => e.id));
      setSelectedEnrollments(allIds);
      setSelectAll(true);
    }
  };

  const bulkApproveEnrollments = async () => {
    if (selectedEnrollments.size === 0) {
      showMessage('Please select enrollments to approve', 'warning');
      return;
    }

    if (!window.confirm(`Are you sure you want to approve ${selectedEnrollments.size} enrollment${selectedEnrollments.size !== 1 ? 's' : ''}?`)) {
      return;
    }

    if (!user || !user.id) {
      showMessage('User information not available', 'error');
      return;
    }

    try {
      setIsProcessingBulk(true);
      const enrollmentIds = Array.from(selectedEnrollments);
      
      const response = await axios.post('/courses/decide-bulk', null, {
        params: {
          enrollmentIds: enrollmentIds,
          approve: true,
          teacherId: user.id
        },
        paramsSerializer: {
          indexes: null // This formats array as enrollmentIds=1&enrollmentIds=2 etc.
        }
      });
      
      showMessage(response.data.message, 'success');
      setSelectedEnrollments(new Set());
      setSelectAll(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error bulk approving enrollments:', error);
      showMessage(error.response?.data?.error || 'Failed to bulk approve enrollments', 'error');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const bulkRejectEnrollments = async () => {
    if (selectedEnrollments.size === 0) {
      showMessage('Please select enrollments to reject', 'warning');
      return;
    }

    if (!window.confirm(`Are you sure you want to reject ${selectedEnrollments.size} enrollment${selectedEnrollments.size !== 1 ? 's' : ''}?`)) {
      return;
    }

    if (!user || !user.id) {
      showMessage('User information not available', 'error');
      return;
    }

    try {
      setIsProcessingBulk(true);
      const enrollmentIds = Array.from(selectedEnrollments);
      
      const response = await axios.post('/courses/decide-bulk', null, {
        params: {
          enrollmentIds: enrollmentIds,
          approve: false,
          teacherId: user.id
        },
        paramsSerializer: {
          indexes: null // This formats array as enrollmentIds=1&enrollmentIds=2 etc.
        }
      });
      
      showMessage(response.data.message, 'success');
      setSelectedEnrollments(new Set());
      setSelectAll(false);
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Error bulk rejecting enrollments:', error);
      showMessage(error.response?.data?.error || 'Failed to bulk reject enrollments', 'error');
    } finally {
      setIsProcessingBulk(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStats = () => {
    const approved = enrollments.filter(e => e.status === 'APPROVED').length;
    const pending = enrollments.filter(e => e.status === 'PENDING').length;
    const retaking = enrollments.filter(e => e.status === 'RETAKING').length;
    const rejected = enrollments.filter(e => e.status === 'REJECTED').length;
    
    return { approved, pending, retaking, rejected, total: enrollments.length };
  };

  const getFilteredEnrollments = () => {
    let filtered = enrollments;

    // Filter by status
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(enrollment => enrollment.status === statusFilter);
    }

    // Filter by search term (name or email)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(enrollment => 
        enrollment.student.name.toLowerCase().includes(searchLower) ||
        enrollment.student.email.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  };

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
        <div className="card">
          <div className="card-body">
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>❌</span>
              <h4>Course not found</h4>
              <p>The course with code "{courseCode}" was not found or you don't have access to it.</p>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/teacher')}
                style={{ marginTop: '1rem' }}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const stats = getStats();

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <Layout 
        user={user} 
        onLogout={handleLogout}
        pageTitle={`Course: ${course.title}`}
        pageSubtitle={`Manage students and enrollments for ${course.courseCode}`}
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
          onClick={() => navigate('/teacher')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          ← Back to Courses
        </button>
      </div>

      {/* Course Info Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <h2 style={{ margin: 0, color: '#1e293b' }}>{course.title}</h2>
                <span style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  fontWeight: '700',
                  background: '#3b82f6',
                  color: 'white',
                  letterSpacing: '0.5px'
                }}>
                  {course.courseCode}
                </span>
              </div>
              <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '1rem', lineHeight: '1.6' }}>
                {course.description}
              </p>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                📅 Created: {formatDate(course.createdAt)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4" style={{ gap: '1rem', marginBottom: '2rem' }}>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e293b' }}>{stats.total}</div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Total Students</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>{stats.approved}</div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Approved</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⏳</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{stats.pending}</div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Pending</div>
          </div>
        </div>
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🔄</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444' }}>{stats.retaking}</div>
            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Retaking</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <div style={{ display: 'flex', gap: '1rem', borderBottom: 'none' }}>
            {[
              { id: 'students', label: 'Students', icon: '👥' },
              { id: 'assignments', label: 'Assignments', icon: '📝' },
              { id: 'assessment-grid', label: 'Assessment', icon: '📊' },
              { id: 'grades', label: 'Grade Control', icon: '🏆' },
              { id: 'resources', label: 'Resources', icon: '📚' },
              { id: 'discussions', label: 'Discussions', icon: '💬' },
              { id: 'attendance', label: 'Attendance', icon: '📋' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-secondary'} btn-sm`}
                style={{ textTransform: 'none', letterSpacing: 'normal' }}
              >
                <span style={{ marginRight: '0.5rem' }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Students Tab */}
      {activeTab === 'students' && (
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ margin: 0 }}>📋 Enrolled Students</h3>
              <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>
                Manage student enrollments and requests
              </p>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ flex: 1, minWidth: '250px' }}>
              <input
                type="text"
                placeholder="🔍 Search by student name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
              />
            </div>

            {/* Status Filter */}
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: '#64748b', fontWeight: '500' }}>Filter:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{
                  padding: '0.5rem 1rem',
                  border: '2px solid #e2e8f0',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                <option value="ALL">All Status ({stats.total})</option>
                <option value="APPROVED">Approved ({stats.approved})</option>
                <option value="PENDING">Pending ({stats.pending})</option>
                <option value="RETAKING">Retaking ({stats.retaking})</option>
                <option value="REJECTED">Rejected ({stats.rejected})</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {(searchTerm || statusFilter !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                }}
                style={{
                  padding: '0.5rem 1rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  background: '#f9fafb',
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#f3f4f6';
                  e.target.style.borderColor = '#9ca3af';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = '#f9fafb';
                  e.target.style.borderColor = '#d1d5db';
                }}
              >
                ✕ Clear
              </button>
            )}
          </div>

          {/* Bulk Actions Section */}
          {getFilteredEnrollments().some(e => e.status === 'PENDING' || e.status === 'RETAKING') && (
            <div style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    style={{ transform: 'scale(1.2)' }}
                  />
                  <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                    Select All Actionable ({getFilteredEnrollments().filter(e => e.status === 'PENDING' || e.status === 'RETAKING').length})
                  </span>
                </label>
                {selectedEnrollments.size > 0 && (
                  <span style={{ 
                    fontSize: '0.875rem', 
                    color: '#3b82f6', 
                    padding: '0.25rem 0.5rem',
                    background: '#dbeafe',
                    borderRadius: '12px',
                    fontWeight: '500'
                  }}>
                    {selectedEnrollments.size} selected
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  onClick={bulkApproveEnrollments}
                  disabled={selectedEnrollments.size === 0 || isProcessingBulk}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '6px',
                    background: selectedEnrollments.size === 0 || isProcessingBulk ? '#d1d5db' : '#10b981',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: selectedEnrollments.size === 0 || isProcessingBulk ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedEnrollments.size > 0 && !isProcessingBulk) {
                      e.target.style.background = '#059669';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedEnrollments.size > 0 && !isProcessingBulk) {
                      e.target.style.background = '#10b981';
                    }
                  }}
                >
                  {isProcessingBulk ? (
                    <>
                      <div style={{ 
                        width: '12px', 
                        height: '12px', 
                        border: '2px solid #ffffff',
                        borderTop: '2px solid transparent',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite'
                      }}></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      ✅ Bulk Approve
                    </>
                  )}
                </button>

                <button
                  onClick={bulkRejectEnrollments}
                  disabled={selectedEnrollments.size === 0 || isProcessingBulk}
                  style={{
                    padding: '0.5rem 1rem',
                    border: 'none',
                    borderRadius: '6px',
                    background: selectedEnrollments.size === 0 || isProcessingBulk ? '#d1d5db' : '#ef4444',
                    color: 'white',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: selectedEnrollments.size === 0 || isProcessingBulk ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedEnrollments.size > 0 && !isProcessingBulk) {
                      e.target.style.background = '#dc2626';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedEnrollments.size > 0 && !isProcessingBulk) {
                      e.target.style.background = '#ef4444';
                    }
                  }}
                >
                  ❌ Bulk Reject
                </button>
              </div>
            </div>
          )}
        </div>
        <div className="card-body">
          {getFilteredEnrollments().length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>
                {enrollments.length === 0 ? '👥' : '🔍'}
              </span>
              <h4>
                {enrollments.length === 0 
                  ? 'No students enrolled' 
                  : searchTerm || statusFilter !== 'ALL' 
                    ? 'No students match your filters'
                    : 'No students found'
                }
              </h4>
              <p>
                {enrollments.length === 0 
                  ? 'Students will appear here once they request to enroll in this course.'
                  : 'Try adjusting your search terms or filters.'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Results Summary */}
              <div style={{ 
                marginBottom: '1rem', 
                padding: '0.75rem 1rem', 
                background: '#f8fafc', 
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                fontSize: '0.875rem',
                color: '#64748b'
              }}>
                Showing {getFilteredEnrollments().length} of {enrollments.length} students
                {searchTerm && (
                  <span> matching "{searchTerm}"</span>
                )}
                {statusFilter !== 'ALL' && (
                  <span> with status "{statusFilter}"</span>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {getFilteredEnrollments().map(enrollment => (
                <div 
                  key={enrollment.id} 
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1rem',
                    backgroundColor: enrollment.status === 'RETAKING' ? '#fef2f2' : 
                                   enrollment.status === 'PENDING' ? '#fefce8' :
                                   enrollment.status === 'APPROVED' ? '#f0fdf4' : '#fef2f2',
                    borderRadius: '8px',
                    border: `2px solid ${enrollment.status === 'RETAKING' ? '#fecaca' : 
                                        enrollment.status === 'PENDING' ? '#fde047' :
                                        enrollment.status === 'APPROVED' ? '#bbf7d0' : '#fecaca'}`,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    {/* Bulk selection checkbox - only show for actionable enrollments */}
                    {(enrollment.status === 'PENDING' || enrollment.status === 'RETAKING') && (
                      <input
                        type="checkbox"
                        checked={selectedEnrollments.has(enrollment.id)}
                        onChange={() => toggleSelectEnrollment(enrollment.id)}
                        style={{
                          transform: 'scale(1.2)',
                          cursor: 'pointer'
                        }}
                      />
                    )}
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '50%',
                      background: '#3b82f6',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.25rem',
                      fontWeight: 'bold'
                    }}>
                      {enrollment.student.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 style={{ margin: '0', color: '#1e293b', fontSize: '1.125rem' }}>
                        {enrollment.student.name}
                      </h4>
                      <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
                        {enrollment.student.email}
                      </p>
                    </div>
                    <span style={{
                      padding: '0.375rem 0.75rem',
                      borderRadius: '12px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      background: enrollment.status === 'RETAKING' ? '#fecaca' : 
                                 enrollment.status === 'PENDING' ? '#fef3c7' : 
                                 enrollment.status === 'APPROVED' ? '#dcfce7' : '#fee2e2',
                      color: enrollment.status === 'RETAKING' ? '#dc2626' : 
                            enrollment.status === 'PENDING' ? '#92400e' : 
                            enrollment.status === 'APPROVED' ? '#166534' : '#dc2626'
                    }}>
                      {enrollment.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {enrollment.status === 'PENDING' && (
                      <>
                        <button 
                          className="btn btn-success"
                          onClick={() => approveEnrollment(enrollment.id)}
                        >
                          ✅ Approve
                        </button>
                        <button 
                          className="btn btn-danger"
                          onClick={() => rejectEnrollment(enrollment.id)}
                        >
                          ❌ Reject
                        </button>
                      </>
                    )}
                    {enrollment.status === 'RETAKING' && (
                      <>
                        <button 
                          className="btn btn-success"
                          onClick={() => approveEnrollment(enrollment.id)}
                          title="Approve retake request"
                        >
                          ✅ Allow Retake
                        </button>
                        <button 
                          className="btn btn-danger"
                          onClick={() => rejectEnrollment(enrollment.id)}
                          title="Reject retake request"
                        >
                          ❌ Deny Retake
                        </button>
                      </>
                    )}
                    {enrollment.status === 'APPROVED' && (
                      <div style={{ padding: '0.5rem 1rem', color: '#166534', fontSize: '0.875rem', fontStyle: 'italic' }}>
                        Enrolled successfully
                      </div>
                    )}
                    {enrollment.status === 'REJECTED' && (
                      <div style={{ padding: '0.5rem 1rem', color: '#dc2626', fontSize: '0.875rem', fontStyle: 'italic' }}>
                        Request rejected
                      </div>
                    )}
                  </div>
                </div>
              ))}
              </div>
            </>
          )}
        </div>
      </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <AssignmentManagement 
          user={user}
          courses={course ? [course] : []}
          onShowMessage={showMessage}
        />
      )}

      {/* Assessment Grid Tab */}
      {activeTab === 'assessment-grid' && (
        <AssessmentGrid 
          courseId={course?.id} 
          userId={user?.id}
          courseName={course?.courseName}
        />
      )}

      {/* Resources Tab */}
      {activeTab === 'resources' && (
        <ResourceManagement 
          courseId={course?.id}
          user={user}
          onShowMessage={showMessage}
        />
      )}

      {/* Discussions Tab */}
      {activeTab === 'discussions' && (
        <DiscussionThreads 
          courseId={course?.id}
          user={user}
          onShowMessage={showMessage}
        />
      )}

      {/* Grades Control Tab */}
      {activeTab === 'grades' && (
        <GradeVisibilityControl 
          courseId={course?.id}
          user={user}
          onShowMessage={showMessage}
        />
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <AttendanceManagement 
          courseId={course?.id}
          user={user}
          onShowMessage={showMessage}
        />
      )}

    </Layout>
    </>
  );
};

export default CourseDetailsPage;
