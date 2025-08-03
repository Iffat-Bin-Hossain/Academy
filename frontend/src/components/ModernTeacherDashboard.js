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
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    // Get user info from token
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({
          name: payload.sub,
          role: 'TEACHER',
          email: payload.sub
        });
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    }
    
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [coursesResponse] = await Promise.all([
        axios.get('/courses')
      ]);
      
      setCourses(coursesResponse.data);
      
      // Calculate stats
      const totalEnrollments = coursesResponse.data.reduce((acc, course) => acc + (course.enrollments || 0), 0);
      setStats({
        totalCourses: coursesResponse.data.length,
        totalStudents: totalEnrollments, // Approximate
        totalEnrollments: totalEnrollments,
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
              { id: 'courses', label: 'My Courses', icon: '📚' },
              { id: 'students', label: 'Students', icon: '👨‍🎓' },
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
                <button 
                  className="btn btn-secondary btn-lg"
                  onClick={() => setActiveTab('students')}
                >
                  <span style={{ marginRight: '0.5rem' }}>👨‍🎓</span>
                  Manage Students
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
              <h3 style={{ margin: 0, color: '#1e293b' }}>Courses Assigned to Me</h3>
              <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>
                {courses.length} course{courses.length !== 1 ? 's' : ''} assigned by administration
              </p>
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
              {courses.map(course => (
                <div key={course.id} className="card">
                  <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
                          {course.title}
                        </h4>
                        <p style={{ margin: '0 0 1rem 0', color: '#64748b' }}>
                          {course.description}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
                          <span>📅 Created: {formatDate(course.createdAt)}</span>
                          <span>👨‍🎓 Students: {course.enrollments || 0}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                        <button className="btn btn-primary btn-sm">
                          👁️ View Details
                        </button>
                        <button className="btn btn-secondary btn-sm">
                          👨‍🎓 Manage Students
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Students Tab */}
      {activeTab === 'students' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">My Students</h3>
            <p className="card-subtitle">Students enrolled in your courses</p>
          </div>
          <div className="card-body">
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>👨‍🎓</span>
              <h4>Student Management</h4>
              <p>Student enrollment and management features will be available here.</p>
            </div>
          </div>
        </div>
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
