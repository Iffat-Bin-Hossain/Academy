import React, { useEffect, useState } from 'react';
import axios from '../api/axiosInstance';
import Layout from './Layout';

const ModernStudentDashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    availableCourses: 0,
    completedAssignments: 0,
    upcomingDeadlines: 0
  });
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
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
          role: 'STUDENT',
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
      
      // Mock enrolled courses (first 2 courses)
      const enrolled = coursesResponse.data.slice(0, 2);
      const available = coursesResponse.data.slice(2);
      
      setEnrolledCourses(enrolled);
      setAvailableCourses(available);
      
      // Calculate stats
      setStats({
        enrolledCourses: enrolled.length,
        availableCourses: available.length,
        completedAssignments: enrolled.length * 3, // Mock data
        upcomingDeadlines: enrolled.length * 1 // Mock data
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

  const enrollInCourse = async (courseId) => {
    try {
      await axios.post(`/enrollments`, {
        courseId: courseId
      });
      
      showMessage('Successfully enrolled in course!', 'success');
      fetchData();
    } catch (error) {
      console.error('Error enrolling in course:', error);
      showMessage('Failed to enroll in course', 'error');
    }
  };

  const unenrollFromCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to unenroll from this course?')) {
      return;
    }

    try {
      await axios.delete(`/enrollments/${courseId}`);
      showMessage('Successfully unenrolled from course', 'success');
      fetchData();
    } catch (error) {
      console.error('Error unenrolling from course:', error);
      showMessage('Failed to unenroll from course', 'error');
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
      day: 'numeric'
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
      pageTitle="Student Portal"
      pageSubtitle="Access your courses and track your progress"
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
              { id: 'enrolled', label: 'My Courses', icon: '📚' },
              { id: 'browse', label: 'Browse Courses', icon: '🔍' },
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
              <div className="stat-value">{stats.enrolledCourses}</div>
              <div className="stat-label">Enrolled Courses</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">🔍</span>
              <div className="stat-value">{stats.availableCourses}</div>
              <div className="stat-label">Available Courses</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">✅</span>
              <div className="stat-value">{stats.completedAssignments}</div>
              <div className="stat-label">Completed Tasks</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">⏰</span>
              <div className="stat-value">{stats.upcomingDeadlines}</div>
              <div className="stat-label">Upcoming Deadlines</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
              <p className="card-subtitle">Navigate to your learning activities</p>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2">
                <button 
                  className="btn btn-primary btn-lg"
                  onClick={() => setActiveTab('enrolled')}
                >
                  <span style={{ marginRight: '0.5rem' }}>📚</span>
                  View My Courses ({stats.enrolledCourses})
                </button>
                <button 
                  className="btn btn-secondary btn-lg"
                  onClick={() => setActiveTab('browse')}
                >
                  <span style={{ marginRight: '0.5rem' }}>🔍</span>
                  Browse New Courses ({stats.availableCourses})
                </button>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          {enrolledCourses.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Recent Activity</h3>
                <p className="card-subtitle">Your latest course interactions</p>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {enrolledCourses.map(course => (
                    <div key={course.id} style={{
                      padding: '1rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <strong style={{ color: '#1e293b' }}>{course.title}</strong>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
                          Last accessed: {formatDate(course.createdAt)}
                        </p>
                      </div>
                      <button className="btn btn-primary btn-sm">
                        Continue
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* My Courses Tab */}
      {activeTab === 'enrolled' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ margin: 0, color: '#1e293b' }}>My Enrolled Courses</h3>
              <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>
                {enrolledCourses.length} course{enrolledCourses.length !== 1 ? 's' : ''} enrolled
              </p>
            </div>
            <button 
              className="btn btn-primary"
              onClick={() => setActiveTab('browse')}
            >
              <span style={{ marginRight: '0.5rem' }}>🔍</span>
              Browse More Courses
            </button>
          </div>

          {enrolledCourses.length === 0 ? (
            <div className="card">
              <div className="card-body">
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📚</span>
                  <h4>No courses enrolled yet</h4>
                  <p>Explore available courses and start your learning journey.</p>
                  <button 
                    className="btn btn-primary btn-lg"
                    onClick={() => setActiveTab('browse')}
                    style={{ marginTop: '1rem' }}
                  >
                    <span style={{ marginRight: '0.5rem' }}>🔍</span>
                    Browse Courses
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1">
              {enrolledCourses.map(course => (
                <div key={course.id} className="card">
                  <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <h4 style={{ margin: 0, color: '#1e293b' }}>
                            {course.title}
                          </h4>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            background: '#dbeafe',
                            color: '#1e40af'
                          }}>
                            ENROLLED
                          </span>
                        </div>
                        <p style={{ margin: '0 0 1rem 0', color: '#64748b' }}>
                          {course.description}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
                          <span>📅 Enrolled: {formatDate(course.createdAt)}</span>
                          <span>📊 Progress: 45%</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                        <button className="btn btn-primary btn-sm">
                          📖 Continue
                        </button>
                        <button 
                          className="btn btn-danger btn-sm"
                          onClick={() => unenrollFromCourse(course.id)}
                        >
                          ❌ Unenroll
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

      {/* Browse Courses Tab */}
      {activeTab === 'browse' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div>
              <h3 style={{ margin: 0, color: '#1e293b' }}>Available Courses</h3>
              <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>
                {availableCourses.length} course{availableCourses.length !== 1 ? 's' : ''} available for enrollment
              </p>
            </div>
          </div>

          {availableCourses.length === 0 ? (
            <div className="card">
              <div className="card-body">
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🎓</span>
                  <h4>All caught up!</h4>
                  <p>You're enrolled in all available courses. Check back later for new offerings.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1">
              {availableCourses.map(course => (
                <div key={course.id} className="card">
                  <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                          <h4 style={{ margin: 0, color: '#1e293b' }}>
                            {course.title}
                          </h4>
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            background: '#f0fdf4',
                            color: '#166534'
                          }}>
                            AVAILABLE
                          </span>
                        </div>
                        <p style={{ margin: '0 0 1rem 0', color: '#64748b' }}>
                          {course.description}
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
                          <span>📅 Created: {formatDate(course.createdAt)}</span>
                          <span>👨‍🏫 Teacher: {course.teacherName || 'Academy Staff'}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                        <button className="btn btn-secondary btn-sm">
                          👁️ Preview
                        </button>
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => enrollInCourse(course.id)}
                        >
                          ✅ Enroll
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

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">My Assignments</h3>
            <p className="card-subtitle">Track your coursework and deadlines</p>
          </div>
          <div className="card-body">
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📝</span>
              <h4>Assignments & Submissions</h4>
              <p>Assignment tracking and submission features will be available here.</p>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ModernStudentDashboard;
