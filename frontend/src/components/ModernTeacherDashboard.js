import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';
import Layout from './Layout';
import { useTabSync } from '../utils/useTabSync';
import AssignmentManagement from './AssignmentManagement';

const ModernTeacherDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalEnrollments: 0,
    activeAssignments: 0
  });
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      
      // Fetch assignment statistics for this teacher
      let assignmentStats = {
        totalAssignments: 0,
        overdueAssignments: 0,
        upcomingDeadlines: 0
      };
      
      try {
        const assignmentStatsResponse = await axios.get(`/assignments/teacher/${currentUser.id}/stats`);
        assignmentStats = assignmentStatsResponse.data;
        console.log('Fetched assignment stats:', assignmentStats);
      } catch (assignmentError) {
        console.warn('Could not fetch assignment stats, using fallback count:', assignmentError);
        // Fallback: Count assignments from all courses using teacher endpoint
        try {
          const assignmentPromises = coursesResponse.data.map(course => 
            axios.get(`/assignments/course/${course.id}/teacher/${currentUser.id}`)
              .then(response => response.data?.length || 0)
              .catch(() => 0)
          );
          const assignmentCounts = await Promise.all(assignmentPromises);
          assignmentStats.totalAssignments = assignmentCounts.reduce((sum, count) => sum + count, 0);
        } catch (fallbackError) {
          console.error('Error in fallback assignment count:', fallbackError);
          assignmentStats.totalAssignments = 0;
        }
      }
      
      setStats({
        totalCourses: coursesResponse.data.length,
        totalStudents: uniqueStudents,
        totalEnrollments: allEnrollments.length,
        activeAssignments: assignmentStats.totalAssignments,
        overdueAssignments: assignmentStats.overdueAssignments,
        upcomingDeadlines: assignmentStats.upcomingDeadlines
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      showMessage('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Cross-tab synchronization
  const handleDataUpdate = useCallback((detail) => {
    console.log('Data updated in another tab, refreshing...', detail);
    fetchData();
  }, []);

  const handleTokenChange = useCallback((newToken) => {
    if (newToken) {
      window.location.reload();
    }
  }, []);

  // Use tab sync hook
  useTabSync(handleDataUpdate, handleTokenChange);
  
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

  const getFilteredCourses = () => {
    if (!searchTerm) return courses;
    
    const searchLower = searchTerm.toLowerCase();
    return courses.filter(course => 
      course.title.toLowerCase().includes(searchLower) ||
      course.courseCode.toLowerCase().includes(searchLower) ||
      course.description.toLowerCase().includes(searchLower)
    );
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
              { id: 'courses', label: 'Courses', icon: '📚' },
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
                  View My Courses
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
              <h3 style={{ margin: 0, color: '#1e293b' }}>My Courses</h3>
              <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>
                {getFilteredCourses().length} of {courses.length} course{courses.length !== 1 ? 's' : ''} {searchTerm && '(filtered)'}
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card-body" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="text"
                    placeholder="🔍 Search courses by title, code, or description..."
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
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    style={{
                      padding: '0.75rem 1rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      background: '#f9fafb',
                      color: '#6b7280',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap'
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
            </div>
          </div>

          {getFilteredCourses().length === 0 ? (
            <div className="card">
              <div className="card-body">
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>
                    {courses.length === 0 ? '📚' : '🔍'}
                  </span>
                  <h4>
                    {courses.length === 0 
                      ? 'No courses assigned yet' 
                      : 'No courses match your search'
                    }
                  </h4>
                  <p>
                    {courses.length === 0 
                      ? 'Contact your administrator to get courses assigned to you.'
                      : 'Try adjusting your search terms or clear the search to see all courses.'
                    }
                  </p>
                  {courses.length === 0 && (
                    <p style={{ fontSize: '0.875rem', marginTop: '1rem', fontStyle: 'italic' }}>
                      Note: Only administrators can create and assign courses to teachers.
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" style={{ gap: '1.5rem' }}>
              {getFilteredCourses().map(course => {
                const courseEnrollments = enrollments.filter(e => e.course?.id === course.id);
                const approvedCount = courseEnrollments.filter(e => e.status === 'APPROVED').length;
                const pendingCount = courseEnrollments.filter(e => e.status === 'PENDING').length;
                const retakingCount = courseEnrollments.filter(e => e.status === 'RETAKING').length;

                return (
                  <div 
                    key={course.id} 
                    className="card"
                    style={{ 
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      borderRadius: '12px',
                      overflow: 'hidden'
                    }}
                    onClick={() => navigate(`/teacher/${course.courseCode}`)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                    }}
                  >
                    <div className="card-body" style={{ padding: '1.5rem' }}>
                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            background: '#3b82f6',
                            color: 'white',
                            letterSpacing: '0.5px'
                          }}>
                            {course.courseCode}
                          </span>
                        </div>
                        <h4 style={{ margin: '0', color: '#1e293b', fontSize: '1.25rem', fontWeight: '600', lineHeight: '1.4' }}>
                          {course.title}
                        </h4>
                      </div>
                      
                      <p style={{ 
                        margin: '0 0 1.5rem 0', 
                        color: '#64748b', 
                        fontSize: '0.875rem',
                        lineHeight: '1.5',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {course.description}
                      </p>
                      
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        paddingTop: '1rem',
                        borderTop: '1px solid #e2e8f0'
                      }}>
                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                          📅 {formatDate(course.createdAt)}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {approvedCount > 0 && (
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              background: '#dcfce7',
                              color: '#166534'
                            }}>
                              {approvedCount} enrolled
                            </span>
                          )}
                          {pendingCount > 0 && (
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              background: '#fef3c7',
                              color: '#92400e'
                            }}>
                              {pendingCount} pending
                            </span>
                          )}
                          {retakingCount > 0 && (
                            <span style={{
                              padding: '0.25rem 0.5rem',
                              borderRadius: '6px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              background: '#fecaca',
                              color: '#dc2626'
                            }}>
                              {retakingCount} retaking
                            </span>
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
        <AssignmentManagement 
          user={user}
          courses={courses}
          onShowMessage={showMessage}
        />
      )}

    </Layout>
  );
};

export default ModernTeacherDashboard;
