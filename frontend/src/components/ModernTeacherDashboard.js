import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from './Layout';

const ModernTeacherDashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalEnrollments: 0,
    activeAssignments: 0
  });
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // First get current user info
      const userResponse = await axios.get('/user/me');
      const currentUser = userResponse.data;
      
      setUser({
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        email: currentUser.email
      });
      
      // Then fetch courses assigned to this teacher
      const [coursesResponse] = await Promise.all([
        axios.get(`/courses/teacher/${currentUser.id}`)
      ]);
      
      setCourses(coursesResponse.data);
      
      // Calculate stats
      const allEnrollments = coursesResponse.data.length > 0 ? 
        (await Promise.all(coursesResponse.data.map(course => 
          axios.get(`/courses/${course.id}/enrollments`)
        ))).flatMap(response => response.data) : [];
      
      setEnrollments(allEnrollments);
      
      // Count unique students and approved enrollments
      const approvedEnrollments = allEnrollments.filter(e => e.status === 'APPROVED');
      const uniqueStudents = new Set(approvedEnrollments.map(e => e.student?.id)).size;
      
      setStats({
        totalCourses: coursesResponse.data.length,
        totalStudents: uniqueStudents,
        totalEnrollments: allEnrollments.length,
        activeAssignments: coursesResponse.data.length * 2 // Mock data
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      showMessage('Failed to load data', 'error');
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  if (loading) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="loading">
          <div className="spinner"></div>
          Loading dashboard...
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout}
      pageTitle="Teacher Portal"
      pageSubtitle="Manage your courses and students"
    >
      {/* Message Alert */}
      {message && (
        <div className={`alert alert-${messageType}`}>
          {message}
        </div>
      )}

      {/* Dashboard Tabs */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <div style={{ display: 'flex', gap: '1rem', borderBottom: 'none' }}>
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'courses', label: 'My Courses & Students', icon: '�' },
              { id: 'assignments', label: 'Assignments', icon: '📝' }
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Grid */}
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-icon">📚</span>
              <div className="stat-value">{stats.totalCourses}</div>
              <div className="stat-label">My Courses</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">👨‍🎓</span>
              <div className="stat-value">{stats.totalStudents}</div>
              <div className="stat-label">Total Students</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">📋</span>
              <div className="stat-value">{stats.totalEnrollments}</div>
              <div className="stat-label">Enrollments</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">📝</span>
              <div className="stat-value">{stats.activeAssignments}</div>
              <div className="stat-label">Assignments</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
              <p className="card-subtitle">Common teaching tasks</p>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2">
                <button 
                  className="btn btn-secondary btn-lg"
                  onClick={() => setActiveTab('courses')}
                >
                  <span style={{ marginRight: '0.5rem' }}>📚</span>
                  View My Courses & Students
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ margin: 0, color: '#1e293b' }}>My Courses & Students</h3>
              <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>
                {courses.length} course{courses.length !== 1 ? 's' : ''} assigned by administration
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card-body" style={{ padding: '1rem' }}>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="🔍 Search courses by name, code, or student name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    border: '2px solid #e2e8f0',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                  onBlur={(e) => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="card">
              <div className="card-body">
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📚</span>
                  <h4>No courses assigned yet</h4>
                  <p>Contact your administrator to get courses assigned to you.</p>
                  <p style={{ fontSize: '0.875rem', marginTop: '1rem', fontStyle: 'italic' }}>
                    Note: Only administrators can create and assign courses to teachers.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1">
              {courses
                .filter(course => {
                  if (!searchTerm) return true;
                  const searchLower = searchTerm.toLowerCase();
                  
                  // Search in course title and code
                  const courseMatch = course.title.toLowerCase().includes(searchLower) || 
                                    course.courseCode.toLowerCase().includes(searchLower);
                  
                  // Search in student names for this course
                  const studentMatch = enrollments.some(enrollment => 
                    enrollment.course?.id === course.id && 
                    enrollment.student?.name.toLowerCase().includes(searchLower)
                  );
                  
                  return courseMatch || studentMatch;
                })
                .map(course => {
                  const courseEnrollments = enrollments.filter(e => e.course?.id === course.id);
                  const approvedCount = courseEnrollments.filter(e => e.status === 'APPROVED').length;
                  const pendingCount = courseEnrollments.filter(e => e.status === 'PENDING').length;
                  const retakingCount = courseEnrollments.filter(e => e.status === 'RETAKING').length;

                  return (
                    <div key={course.id} className="card">
                      <div className="card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                              <h4 style={{ margin: '0', color: '#1e293b' }}>
                                {course.title}
                              </h4>
                              <span style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                background: '#3b82f6',
                                color: 'white',
                                border: '1px solid #2563eb'
                              }}>
                                {course.courseCode}
                              </span>
                            </div>
                            <p style={{ margin: '0 0 1rem 0', color: '#64748b' }}>
                              {course.description}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
                              <span>📅 Created: {formatDate(course.createdAt)}</span>
                              <span>👨‍🎓 Active: {approvedCount}</span>
                              {pendingCount > 0 && <span style={{ color: '#f59e0b' }}>⏳ Pending: {pendingCount}</span>}
                              {retakingCount > 0 && <span style={{ color: '#ef4444' }}>🔄 Retaking: {retakingCount}</span>}
                            </div>

                            {/* Student List for this course */}
                            {courseEnrollments.length > 0 && (
                              <div style={{ 
                                marginTop: '1rem', 
                                padding: '1rem', 
                                backgroundColor: '#f8fafc', 
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0'
                              }}>
                                <h5 style={{ margin: '0 0 0.75rem 0', color: '#1e293b', fontSize: '0.875rem', fontWeight: '600' }}>
                                  📋 Enrolled Students ({courseEnrollments.length})
                                </h5>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {courseEnrollments.map(enrollment => (
                                    <div key={enrollment.id} style={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      padding: '0.5rem',
                                      backgroundColor: enrollment.status === 'RETAKING' ? '#fef2f2' : 'white',
                                      borderRadius: '6px',
                                      border: `1px solid ${enrollment.status === 'RETAKING' ? '#fecaca' : '#e5e7eb'}`,
                                      fontSize: '0.875rem'
                                    }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{ 
                                          color: enrollment.status === 'RETAKING' ? '#dc2626' : '#1e293b',
                                          fontWeight: '500'
                                        }}>
                                          {enrollment.student.name}
                                        </span>
                                        <span style={{
                                          padding: '0.125rem 0.5rem',
                                          borderRadius: '12px',
                                          fontSize: '0.75rem',
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
                                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                                        {enrollment.status === 'PENDING' && (
                                          <>
                                            <button 
                                              className="btn btn-success btn-sm"
                                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                              onClick={() => approveEnrollment(enrollment.id)}
                                            >
                                              ✅
                                            </button>
                                            <button 
                                              className="btn btn-danger btn-sm"
                                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                              onClick={() => rejectEnrollment(enrollment.id)}
                                            >
                                              ❌
                                            </button>
                                          </>
                                        )}
                                        {enrollment.status === 'RETAKING' && (
                                          <>
                                            <button 
                                              className="btn btn-success btn-sm"
                                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                              onClick={() => approveEnrollment(enrollment.id)}
                                              title="Approve retake request"
                                            >
                                              ✅ Allow Retake
                                            </button>
                                            <button 
                                              className="btn btn-danger btn-sm"
                                              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                                              onClick={() => rejectEnrollment(enrollment.id)}
                                              title="Reject retake request"
                                            >
                                              ❌ Deny Retake
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Assignments</h3>
            <p className="card-subtitle">Create and manage course assignments</p>
          </div>
          <div className="card-body">
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📝</span>
              <h4>Assignment Management</h4>
              <p>Assignment creation and grading features will be available here.</p>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default ModernTeacherDashboard;
