import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';
import Layout from './Layout';
import { useTabSync } from '../utils/useTabSync';
import FacultyFeedbackStudent from './feedback/FacultyFeedbackStudent';

const ModernStudentDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    availableCourses: 0,
    completedAssignments: 0,
    upcomingDeadlines: 0
  });
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [allAssignments, setAllAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  
  // Search states
  const [enrolledSearchTerm, setEnrolledSearchTerm] = useState('');
  const [pendingSearchTerm, setPendingSearchTerm] = useState('');
  const [availableSearchTerm, setAvailableSearchTerm] = useState('');
  const [assignmentSearchTerm, setAssignmentSearchTerm] = useState('');
  
  // Retake modal states
  const [showRetakeModal, setShowRetakeModal] = useState(false);
  const [retakeCourseData, setRetakeCourseData] = useState(null);

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
      
      // Get student enrollments and all available courses
      const [enrollmentsResponse, coursesResponse] = await Promise.all([
        axios.get(`/courses/student/${currentUser.id}`),
        axios.get('/courses')
      ]);
      
      // Filter enrollments by status
      const enrollments = enrollmentsResponse.data;
      const enrolled = enrollments.filter(e => e.status === 'APPROVED' || e.status === 'RETAKING');
      const pending = enrollments.filter(e => e.status === 'PENDING');
      
      // Get enrolled course IDs (including pending) to filter available courses
      const enrolledCourseIds = enrollments.map(e => e.course.id);
      const available = coursesResponse.data.filter(course => !enrolledCourseIds.includes(course.id));
      
      setEnrolledCourses(enrolled);
      setPendingCourses(pending);
      setAvailableCourses(available);
      
      // Fetch assignments for all enrolled courses
      let allCourseAssignments = [];
      let upcomingDeadlines = 0;
      
      for (const enrollment of enrolled) {
        try {
          const assignmentsResponse = await axios.get(`/assignments/course/${enrollment.course.id}`);
          const courseAssignments = assignmentsResponse.data.map(assignment => ({
            ...assignment,
            courseName: enrollment.course.title,
            courseCode: enrollment.course.courseCode,
            enrollmentStatus: enrollment.status
          }));
          allCourseAssignments = [...allCourseAssignments, ...courseAssignments];
          
          // Count upcoming deadlines (within next 7 days)
          const upcoming = courseAssignments.filter(assignment => {
            const deadline = new Date(assignment.deadline);
            const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            return deadline <= nextWeek && deadline > new Date();
          });
          upcomingDeadlines += upcoming.length;
        } catch (assignmentError) {
          console.error(`Error fetching assignments for course ${enrollment.course.courseCode}:`, assignmentError);
        }
      }
      
      setAllAssignments(allCourseAssignments);
      
      // Calculate stats
      setStats({
        enrolledCourses: enrolled.length,
        availableCourses: available.length,
        completedAssignments: 0, // TODO: Implement submission tracking
        upcomingDeadlines: upcomingDeadlines
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

  const enrollInCourse = async (courseId) => {
    if (!user || !user.id) {
      showMessage('User information not available', 'error');
      return;
    }

    try {
      await axios.post(`/courses/enroll`, null, {
        params: {
          courseId: courseId,
          studentId: user.id
        }
      });
      
      showMessage('Enrollment request submitted! Waiting for teacher approval.', 'success');
      fetchData(); // Refresh data to move course from available to pending
    } catch (error) {
      console.error('Error enrolling in course:', error);
      showMessage(error.response?.data?.error || 'Failed to enroll in course', 'error');
    }
  };

  const retakeCourse = (courseId, courseTitle) => {
    setRetakeCourseData({ id: courseId, title: courseTitle });
    setShowRetakeModal(true);
  };

  const confirmRetake = async () => {
    if (!retakeCourseData || !user || !user.id) {
      showMessage('Unable to process retake request', 'error');
      return;
    }

    try {
      await axios.post(`/courses/retake`, null, {
        params: {
          courseId: retakeCourseData.id,
          studentId: user.id
        }
      });
      
      showMessage('Course retake request submitted successfully!', 'success');
      setShowRetakeModal(false);
      setRetakeCourseData(null);
      fetchData(); // Refresh data to update status
    } catch (error) {
      console.error('Error retaking course:', error);
      showMessage(error.response?.data?.error || 'Failed to submit retake request', 'error');
    }
  };

  const cancelRetake = () => {
    setShowRetakeModal(false);
    setRetakeCourseData(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const getFilteredAssignments = () => {
    if (!assignmentSearchTerm) return allAssignments.sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    
    const searchLower = assignmentSearchTerm.toLowerCase();
    return allAssignments.filter(assignment => 
      assignment.title.toLowerCase().includes(searchLower) ||
      assignment.content?.toLowerCase().includes(searchLower) ||
      assignment.courseName.toLowerCase().includes(searchLower) ||
      assignment.courseCode.toLowerCase().includes(searchLower) ||
      assignment.assignmentType.toLowerCase().includes(searchLower)
    ).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Search filter functions
  const filterEnrolledCourses = () => {
    if (!enrolledSearchTerm) return enrolledCourses;
    return enrolledCourses.filter(enrollment => 
      enrollment.course.title.toLowerCase().includes(enrolledSearchTerm.toLowerCase()) ||
      enrollment.course.courseCode.toLowerCase().includes(enrolledSearchTerm.toLowerCase()) ||
      (enrollment.course.assignedTeacher?.name || '').toLowerCase().includes(enrolledSearchTerm.toLowerCase())
    );
  };

  const filterPendingCourses = () => {
    if (!pendingSearchTerm) return pendingCourses;
    return pendingCourses.filter(enrollment => 
      enrollment.course.title.toLowerCase().includes(pendingSearchTerm.toLowerCase()) ||
      enrollment.course.courseCode.toLowerCase().includes(pendingSearchTerm.toLowerCase()) ||
      (enrollment.course.assignedTeacher?.name || '').toLowerCase().includes(pendingSearchTerm.toLowerCase())
    );
  };

  const filterAvailableCourses = () => {
    if (!availableSearchTerm) return availableCourses;
    return availableCourses.filter(course => 
      course.title.toLowerCase().includes(availableSearchTerm.toLowerCase()) ||
      course.courseCode.toLowerCase().includes(availableSearchTerm.toLowerCase()) ||
      (course.assignedTeacher?.name || '').toLowerCase().includes(availableSearchTerm.toLowerCase())
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
    <Layout user={user} onLogout={handleLogout}>
      {message && (
        <div className={`alert alert-${messageType === 'error' ? 'danger' : messageType} alert-dismissible fade show`} role="alert">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}

      {/* Dashboard Header */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ margin: 0, color: '#1e293b' }}>Welcome back, {user?.name}!</h2>
              <p style={{ margin: '0.25rem 0 0 0', color: '#64748b' }}>
                Here's your learning progress overview
              </p>
            </div>
            <div style={{ 
              background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)', 
              padding: '0.75rem 1.5rem', 
              borderRadius: '12px', 
              color: 'white' 
            }}>
              <span style={{ fontSize: '1.125rem', fontWeight: '600' }}>Student Dashboard</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <div style={{ display: 'flex', gap: '1rem', borderBottom: 'none' }}>
            {[
              { id: 'overview', label: 'Overview', icon: '📊' },
              { id: 'courses', label: 'Courses', icon: '📚' },
              { id: 'feedback', label: 'Faculty Feedback', icon: '⭐' }
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
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="card">
              <div className="card-body" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p className="card-subtitle" style={{ margin: '0 0 0.5rem 0' }}>Enrolled Courses</p>
                    <h3 style={{ margin: 0, color: '#3b82f6' }}>{stats.enrolledCourses}</h3>
                  </div>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '12px', 
                    background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    📚
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p className="card-subtitle" style={{ margin: '0 0 0.5rem 0' }}>Available Courses</p>
                    <h3 style={{ margin: 0, color: '#10b981' }}>{stats.availableCourses}</h3>
                  </div>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '12px', 
                    background: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    🔍
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p className="card-subtitle" style={{ margin: '0 0 0.5rem 0' }}>Faculty Feedback</p>
                    <h3 style={{ margin: 0, color: '#f59e0b' }}>{enrolledCourses.filter(e => e.course.assignedTeacher).length}</h3>
                  </div>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '12px', 
                    background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    ⭐
                  </div>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-body" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <p className="card-subtitle" style={{ margin: '0 0 0.5rem 0' }}>Pending Approvals</p>
                    <h3 style={{ margin: 0, color: '#ef4444' }}>{pendingCourses.length}</h3>
                  </div>
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '12px', 
                    background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: '1.5rem'
                  }}>
                    ⏳
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
              <p className="card-subtitle">Common tasks and shortcuts</p>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-3" style={{ gap: '1rem' }}>
                <button 
                  className="btn btn-primary btn-lg"
                  onClick={() => setActiveTab('courses')}
                  style={{ textAlign: 'left' }}
                >
                  <div>
                    <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>🔍</span>
                    <strong>Browse Courses</strong>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                      Discover new learning opportunities
                    </div>
                  </div>
                </button>
                
                <button 
                  className="btn btn-secondary btn-lg"
                  onClick={() => setActiveTab('feedback')}
                  style={{ textAlign: 'left' }}
                >
                  <div>
                    <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>⭐</span>
                    <strong>Faculty Feedback</strong>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                      Rate your instructors
                    </div>
                  </div>
                </button>
                
                <button 
                  className="btn btn-secondary btn-lg"
                  onClick={() => setActiveTab('assignments')}
                  style={{ textAlign: 'left' }}
                >
                  <div>
                    <span style={{ fontSize: '1.5rem', display: 'block', marginBottom: '0.5rem' }}>📝</span>
                    <strong>Assignments</strong>
                    <div style={{ fontSize: '0.875rem', opacity: 0.8 }}>
                      Track your progress
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Courses Tab - Unified View */}
      {activeTab === 'courses' && (
        <>
          {/* My Enrolled Courses Section */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>📚 My Enrolled Courses</h3>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>
                    {enrolledCourses.length} course{enrolledCourses.length !== 1 ? 's' : ''} enrolled
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Search enrolled courses..."
                    value={enrolledSearchTerm}
                    onChange={(e) => setEnrolledSearchTerm(e.target.value)}
                    className="form-control"
                    style={{ width: '250px' }}
                  />
                  <span>🔍</span>
                </div>
              </div>
            </div>
            <div className="card-body">
              {filterEnrolledCourses().length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>📚</span>
                  <h4>{enrolledSearchTerm ? 'No courses found' : 'No enrolled courses yet'}</h4>
                  <p>{enrolledSearchTerm ? 'Try adjusting your search terms' : 'Browse available courses below to start your learning journey.'}</p>
                  {enrolledSearchTerm && (
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setEnrolledSearchTerm('')}
                      style={{ marginTop: '1rem' }}
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1" style={{ gap: '1rem' }}>
                  {filterEnrolledCourses().map(enrollment => (
                    <div key={enrollment.id} className="card">
                      <div className="card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                              <h4 style={{ margin: 0, color: '#1e293b' }}>
                                {enrollment.course.title}
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
                                {enrollment.course.courseCode}
                              </span>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                background: enrollment.status === 'RETAKING' ? '#fef3c7' : '#dbeafe',
                                color: enrollment.status === 'RETAKING' ? '#92400e' : '#1e40af'
                              }}>
                                {enrollment.status === 'RETAKING' ? 'RETAKING' : 'ENROLLED'}
                              </span>
                            </div>
                            <p style={{ margin: '0 0 1rem 0', color: '#64748b' }}>
                              {enrollment.course.description}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
                              <span>📅 Created: {formatDate(enrollment.course.createdAt)}</span>
                              <span>👨‍🏫 Teacher: {enrollment.course.assignedTeacher?.name || 'Not Assigned'}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => navigate(`/student/${enrollment.course.courseCode}`)}
                            >
                              📖 View Details
                            </button>
                            {enrollment.status === 'APPROVED' && (
                              <button 
                                className="btn btn-warning btn-sm"
                                onClick={() => retakeCourse(enrollment.course.id, enrollment.course.title)}
                              >
                                🔄 Retake
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pending Courses Section */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>📋 Pending Course Approvals</h3>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>
                    {pendingCourses.length} course{pendingCourses.length !== 1 ? 's' : ''} waiting for teacher approval
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Search pending courses..."
                    value={pendingSearchTerm}
                    onChange={(e) => setPendingSearchTerm(e.target.value)}
                    className="form-control"
                    style={{ width: '250px' }}
                  />
                  <span>🔍</span>
                </div>
              </div>
            </div>
            <div className="card-body">
              {filterPendingCourses().length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>⏳</span>
                  <h4>{pendingSearchTerm ? 'No courses found' : 'No pending enrollments'}</h4>
                  <p>{pendingSearchTerm ? 'Try adjusting your search terms' : 'All your course enrollments have been processed.'}</p>
                  {pendingSearchTerm && (
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setPendingSearchTerm('')}
                      style={{ marginTop: '1rem' }}
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1" style={{ gap: '1rem' }}>
                  {filterPendingCourses().map(enrollment => (
                    <div key={enrollment.id} className="card">
                      <div className="card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                              <h4 style={{ margin: 0, color: '#1e293b' }}>
                                {enrollment.course.title}
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
                                {enrollment.course.courseCode}
                              </span>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                background: '#fef3c7',
                                color: '#92400e'
                              }}>
                                PENDING
                              </span>
                            </div>
                            <p style={{ margin: '0 0 1rem 0', color: '#64748b' }}>
                              {enrollment.course.description}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
                              <span>📅 Applied: {enrollment.enrolledAt ? formatDate(enrollment.enrolledAt) : formatDate(enrollment.course.createdAt)}</span>
                              <span>👨‍🏫 Teacher: {enrollment.course.assignedTeacher?.name || 'Not Assigned'}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                            <button className="btn btn-secondary btn-sm" disabled>
                              ⏳ Waiting for Approval
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Available Courses Section */}
          <div className="card" style={{ marginBottom: '2rem' }}>
            <div className="card-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ margin: 0 }}>🔍 Available Courses</h3>
                  <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>
                    {availableCourses.length} course{availableCourses.length !== 1 ? 's' : ''} available for enrollment
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="text"
                    placeholder="Search available courses..."
                    value={availableSearchTerm}
                    onChange={(e) => setAvailableSearchTerm(e.target.value)}
                    className="form-control"
                    style={{ width: '250px' }}
                  />
                  <span>🔍</span>
                </div>
              </div>
            </div>
            <div className="card-body">
              {filterAvailableCourses().length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
                  <span style={{ fontSize: '2rem', display: 'block', marginBottom: '1rem' }}>🎓</span>
                  <h4>{availableSearchTerm ? 'No courses found' : 'No courses available'}</h4>
                  <p>{availableSearchTerm ? 'Try adjusting your search terms' : 'All available courses have been enrolled or are pending approval.'}</p>
                  {availableSearchTerm && (
                    <button 
                      className="btn btn-secondary"
                      onClick={() => setAvailableSearchTerm('')}
                      style={{ marginTop: '1rem' }}
                    >
                      Clear Search
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1" style={{ gap: '1rem' }}>
                  {filterAvailableCourses().map(course => (
                    <div key={course.id} className="card">
                      <div className="card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                              <h4 style={{ margin: 0, color: '#1e293b' }}>
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
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                background: '#dcfce7',
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
                              <span>👨‍🏫 Teacher: {course.assignedTeacher?.name || 'Not Assigned'}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                            <button className="btn btn-primary btn-sm">
                              📖 View Details
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
            </div>
          </div>
        </>
      )}

      {/* Faculty Feedback Tab */}
      {activeTab === 'feedback' && (
        <FacultyFeedbackStudent 
          user={user}
          enrolledCourses={enrolledCourses}
          onShowMessage={showMessage}
        />
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="card-title">My Assignments</h3>
                <p className="card-subtitle">Track your coursework and deadlines</p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="text"
                    placeholder="Search assignments..."
                    value={assignmentSearchTerm}
                    onChange={(e) => setAssignmentSearchTerm(e.target.value)}
                    style={{
                      padding: '0.5rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '6px',
                      fontSize: '0.875rem'
                    }}
                  />
                  {assignmentSearchTerm && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setAssignmentSearchTerm('')}
                    >
                      Clear
                    </button>
                  )}
                </div>
                <span style={{ 
                  padding: '0.5rem 1rem', 
                  backgroundColor: '#f3f4f6', 
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#374151'
                }}>
                  {getFilteredAssignments().length} assignments
                </span>
              </div>
            </div>
          </div>
          <div className="card-body">
            {allAssignments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📝</span>
                <h4>No assignments yet</h4>
                <p>No assignments have been posted in your enrolled courses.</p>
              </div>
            ) : getFilteredAssignments().length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🔍</span>
                <h4>No matching assignments</h4>
                <p>No assignments match your search criteria "{assignmentSearchTerm}".</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {getFilteredAssignments().map(assignment => {
                  const isOverdue = new Date(assignment.deadline) < new Date();
                  const isNearDue = new Date(assignment.deadline) < new Date(Date.now() + 86400000 * 3); // 3 days
                  const canSubmitLate = assignment.lateSubmissionDeadline && new Date(assignment.lateSubmissionDeadline) > new Date();
                  
                  return (
                    <div key={`${assignment.id}-${assignment.courseCode}`} className="card" style={{ 
                      border: '1px solid #e2e8f0',
                      borderLeft: `4px solid ${isOverdue ? '#ef4444' : isNearDue ? '#f59e0b' : '#3b82f6'}`
                    }}>
                      <div className="card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <h5 style={{ margin: 0, color: '#1e293b' }}>{assignment.title}</h5>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                background: assignment.assignmentType === 'EXAM' ? '#fecaca' : 
                                          assignment.assignmentType === 'PROJECT' ? '#ddd6fe' :
                                          assignment.assignmentType === 'QUIZ' ? '#fed7aa' :
                                          assignment.assignmentType === 'LAB' ? '#bbf7d0' : '#e5e7eb',
                                color: assignment.assignmentType === 'EXAM' ? '#dc2626' : 
                                      assignment.assignmentType === 'PROJECT' ? '#7c3aed' :
                                      assignment.assignmentType === 'QUIZ' ? '#ea580c' :
                                      assignment.assignmentType === 'LAB' ? '#059669' : '#374151'
                              }}>
                                {assignment.assignmentType}
                              </span>
                            </div>
                            
                            <div style={{ marginBottom: '0.5rem' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                background: '#f0f9ff',
                                color: '#0369a1',
                                cursor: 'pointer'
                              }}
                              onClick={() => navigate(`/student/${assignment.courseCode}`)}
                              >
                                📚 {assignment.courseName} ({assignment.courseCode})
                              </span>
                            </div>
                            
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
                              <span>👤 Instructor: {assignment.createdByName || 'Course Instructor'}</span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                📅 Due: {formatDate(assignment.deadline)}
                                {isOverdue && <span style={{ color: '#ef4444', fontWeight: '600' }}>(OVERDUE)</span>}
                                {!isOverdue && isNearDue && <span style={{ color: '#f59e0b', fontWeight: '600' }}>(DUE SOON)</span>}
                              </span>
                              <span>📊 Max Marks: {assignment.maxMarks}</span>
                              {assignment.lateSubmissionDeadline && (
                                <span style={{ color: canSubmitLate ? '#059669' : '#ef4444' }}>
                                  📋 Late Until: {formatDate(assignment.lateSubmissionDeadline)}
                                </span>
                              )}
                            </div>
                            
                            {assignment.content && (
                              <p style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '0.875rem', lineHeight: '1.5' }}>
                                {assignment.content.length > 150 ? assignment.content.substring(0, 150) + '...' : assignment.content}
                              </p>
                            )}
                          </div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '1rem', minWidth: '140px' }}>
                            <button 
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                              onClick={() => navigate(`/student/${assignment.courseCode}`)}
                            >
                              📋 View in Course
                            </button>
                            <button 
                              className={`btn btn-sm ${isOverdue && !canSubmitLate ? 'btn-secondary' : 'btn-success'}`}
                              style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                              disabled={isOverdue && !canSubmitLate}
                            >
                              {isOverdue && !canSubmitLate ? '⏰ Closed' : 
                               isOverdue && canSubmitLate ? '📤 Submit Late' : 
                               '📤 Submit'}
                            </button>
                          </div>
                        </div>
                        
                        {/* Status indicators */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '12px',
                              background: '#f0f9ff',
                              color: '#0369a1',
                              fontWeight: '600'
                            }}>
                              📊 Not Submitted
                            </span>
                            {isNearDue && !isOverdue && (
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                background: '#fffbeb',
                                color: '#d97706',
                                fontWeight: '600'
                              }}>
                                ⏰ Due Soon
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            Posted: {formatDate(assignment.createdAt)}
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
      )}

      {/* Retake Confirmation Modal */}
      {showRetakeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
            animation: 'fadeIn 0.3s ease-out'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                backgroundColor: '#fef3c7',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem',
                fontSize: '24px'
              }}>
                🔄
              </div>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
                Retake Course Confirmation
              </h3>
              <p style={{ margin: 0, color: '#64748b' }}>
                Are you sure you want to retake this course?
              </p>
            </div>
            
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              border: '1px solid #e2e8f0'
            }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', fontSize: '1rem' }}>
                📚 {retakeCourseData?.title}
              </h4>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                This will mark you as "retaking" and require teacher approval. Your previous progress will be maintained.
              </p>
            </div>

            <div style={{
              backgroundColor: '#fef9e7',
              border: '1px solid #fde047',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#f59e0b', fontSize: '1.25rem' }}>⚠️</span>
                <div>
                  <h5 style={{ margin: '0 0 0.25rem 0', color: '#92400e', fontSize: '0.875rem' }}>
                    Important Notice:
                  </h5>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#92400e' }}>
                    • You will appear in red on the teacher's dashboard<br/>
                    • Teacher needs to approve your retake request<br/>
                    • This action cannot be undone easily
                  </p>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                className="btn btn-secondary"
                onClick={cancelRetake}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  backgroundColor: '#f9fafb',
                  color: '#374151'
                }}
              >
                ❌ Cancel
              </button>
              <button
                className="btn btn-warning"
                onClick={confirmRetake}
                style={{
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  borderRadius: '8px',
                  border: '1px solid #f59e0b',
                  backgroundColor: '#f59e0b',
                  color: 'white'
                }}
              >
                🔄 Yes, Retake Course
              </button>
            </div>
          </div>
        </div>
      )}

    </Layout>
  );
};

export default ModernStudentDashboard;
