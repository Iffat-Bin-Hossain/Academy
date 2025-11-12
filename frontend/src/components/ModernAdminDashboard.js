import React, { useEffect, useState, useCallback } from 'react';
import axios from '../api/axiosInstance';
import Layout from './Layout';
import CourseManagement from './CourseManagement';
import UserManagement from './UserManagement';
import { useTabSync } from '../utils/useTabSync';

const ModernAdminDashboard = () => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0
  });
  const [pendingUsers, setPendingUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [newCourse, setNewCourse] = useState({
    title: '',
    courseCode: '',
    description: '',
    level: '',
    term: ''
  });
  const [editCourse, setEditCourse] = useState({
    title: '',
    courseCode: '',
    description: '',
    level: '',
    term: ''
  });
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [modalError, setModalError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editModalError, setEditModalError] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showCourseManagement, setShowCourseManagement] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('🔄 fetchData called - starting data fetch...');
      setLoading(true);

      // First get current user info
      console.log('📡 Making API call to /user/me...');
      const userResponse = await axios.get('/user/me');
      console.log('✅ /user/me response received:', userResponse.data);
      const currentUser = userResponse.data;

      console.log('🔄 Setting user state with ID:', currentUser.id);
      setUser({
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        email: currentUser.email
      });
      console.log('✅ User state set successfully');

      const [pendingResponse, coursesResponse, allUsersResponse, statsResponse] = await Promise.all([
        axios.get('/admin/pending'),
        axios.get('/courses'),
        axios.get('/admin/users'),
        axios.get('/admin/statistics') // New statistics endpoint
      ]);

      console.log('Pending users:', pendingResponse.data);
      console.log('Courses:', coursesResponse.data);
      console.log('All users:', allUsersResponse.data);
      console.log('Admin statistics:', statsResponse.data);

      setPendingUsers(pendingResponse.data);
      setCourses(coursesResponse.data);

      // Use the real statistics from backend
      setStats(statsResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
        showMessage(`Failed to load data: ${error.response.data.error || error.response.statusText}`, 'error');
      } else {
        showMessage('Failed to load data: Network error', 'error');
      }
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
      // Token updated in another tab, refresh page
      window.location.reload();
    }
    // Token removal is handled by the hook itself
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

  const approveUser = async (id) => {
    try {
      await axios.post(`/admin/approve/${id}`);
      showMessage('User approved successfully!', 'success');
      fetchData();
    } catch (error) {
      console.error('Error approving user:', error);
      showMessage('Failed to approve user', 'error');
    }
  };

  const rejectUser = async (id) => {
    try {
      await axios.post(`/admin/reject/${id}`);
      showMessage('User request rejected', 'success');
      fetchData();
    } catch (error) {
      console.error('Error rejecting user:', error);
      showMessage('Failed to reject user', 'error');
    }
  };

  const createCourse = async () => {
    if (!newCourse.title || !newCourse.courseCode || !newCourse.description || !newCourse.level || !newCourse.term) {
      setModalError('Please fill in all required fields');
      return;
    }

    setIsCreating(true);
    setModalError('');

    try {
      const response = await axios.post('/courses', newCourse);
      console.log('Create response:', response.data);
      showMessage('Course created successfully!', 'success');
      setShowCreateModal(false);
      setNewCourse({ title: '', courseCode: '', description: '', level: '', term: '' });
      setModalError('');
      fetchData();
    } catch (error) {
      console.error('Error creating course:', error);
      let errorMessage = 'Failed to create course';

      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.response && error.response.statusText) {
        errorMessage = `Failed to create course: ${error.response.statusText}`;
      } else if (error.message) {
        errorMessage = `Network error: ${error.message}`;
      }

      setModalError(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const openEditModal = (course) => {
    setSelectedCourse(course);
    setEditCourse({
      title: course.title,
      courseCode: course.courseCode,
      description: course.description,
      level: course.level || '',
      term: course.term || ''
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedCourse(null);
    setEditCourse({ title: '', courseCode: '', description: '', level: '', term: '' });
    setEditModalError('');
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewCourse({ title: '', courseCode: '', description: '', level: '', term: '' });
    setModalError('');
  };

  const updateCourse = async () => {
    console.log('🚀 updateCourse function called');
    console.log('📝 Current editCourse state:', editCourse);
    console.log('🎯 Selected course ID:', selectedCourse?.id);
    
    if (!editCourse.title || !editCourse.courseCode || !editCourse.description || !editCourse.level || !editCourse.term) {
      console.log('❌ Validation failed - missing required fields');
      setEditModalError('Please fill in all required fields');
      return;
    }

    setIsUpdating(true);
    setEditModalError('');

    try {
      console.log('📡 Sending PUT request to:', `/courses/${selectedCourse.id}`);
      console.log('📦 Request payload:', editCourse);
      
      const response = await axios.put(`/courses/${selectedCourse.id}`, editCourse);
      console.log('✅ Update response:', response.data);
      showMessage('Course updated successfully!', 'success');
      closeEditModal();
      fetchData();
    } catch (error) {
      console.error('❌ Error updating course:', error);
      let errorMessage = 'Failed to update course';

      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.response && error.response.statusText) {
        errorMessage = `Failed to update course: ${error.response.statusText}`;
      } else if (error.message) {
        errorMessage = `Network error: ${error.message}`;
      }

      setEditModalError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteCourse = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) {
      return;
    }

    try {
      const response = await axios.delete(`/courses/${id}`);
      console.log('Delete response:', response.data);
      showMessage('Course deleted successfully!', 'success');
      fetchData();
    } catch (error) {
      console.error('Error deleting course:', error);
      if (error.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        console.error('Error status:', status);
        console.error('Error data:', errorData);

        // Handle specific error cases
        if (status === 401) {
          showMessage('Authentication failed. Please login again.', 'error');
          // Clear invalid token and redirect to login
          localStorage.removeItem('token');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else if (status === 403) {
          showMessage('Access denied. You don\'t have permission to delete courses.', 'error');
        } else if (status === 400 && errorData.error && errorData.error.includes('foreign key')) {
          showMessage('Cannot delete course: This course has enrollments. Please remove all enrollments first.', 'error');
        } else if (status === 404) {
          showMessage('Course not found. It may have been already deleted.', 'error');
          // Refresh the data to show current state
          fetchData();
        } else {
          const errorMessage = errorData.error || errorData.message || error.response.statusText || 'Unknown error';
          showMessage(`Failed to delete course: ${errorMessage}`, 'error');
        }
      } else if (error.request) {
        showMessage('Failed to delete course: Unable to connect to server. Please check your internet connection.', 'error');
      } else {
        showMessage('Failed to delete course: An unexpected error occurred.', 'error');
      }
    }
  };

  const clearAllCourses = async () => {
    if (!window.confirm(`⚠️ WARNING: This will permanently delete ALL ${courses.length} courses and their related data (enrollments, assignments, etc.). This action cannot be undone. Are you absolutely sure?`)) {
      return;
    }

    if (!window.confirm('This is your final confirmation. Type YES to proceed with deleting ALL courses.') ||
      !prompt('Type "DELETE ALL" to confirm (case sensitive):') === 'DELETE ALL') {
      showMessage('Course deletion cancelled', 'info');
      return;
    }

    try {
      const response = await axios.delete('/courses/clear-all');
      console.log('Clear all courses response:', response.data);
      showMessage(response.data.message || 'All courses cleared successfully!', 'success');
      fetchData(); // Refresh the data
    } catch (error) {
      console.error('Error clearing all courses:', error);
      let errorMessage = 'Failed to clear courses';

      if (error.response && error.response.data && error.response.data.error) {
        errorMessage = error.response.data.error;
      } else if (error.response && error.response.statusText) {
        errorMessage = `Failed to clear courses: ${error.response.statusText}`;
      } else if (error.message) {
        errorMessage = `Network error: ${error.message}`;
      }

      showMessage(errorMessage, 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const openCourseManagement = (courseId) => {
    setSelectedCourseId(courseId);
    setShowCourseManagement(true);
  };

  const closeCourseManagement = () => {
    setShowCourseManagement(false);
    setSelectedCourseId(null);
    // Refresh data when coming back from course management
    fetchData();
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', dateString, error);
      return 'Invalid Date';
    }
  };

  // Filter functions for search
  const filteredPendingUsers = pendingUsers.filter(user => {
    if (!userSearchTerm) return true;
    const searchLower = userSearchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower) ||
      formatDate(user.createdAt).toLowerCase().includes(searchLower)
    );
  }).sort((a, b) => {
    // Define role order: ADMIN first, then TEACHER, then STUDENT
    const roleOrder = { 'ADMIN': 1, 'TEACHER': 2, 'STUDENT': 3 };
    
    // First sort by role
    const roleA = roleOrder[a.role] || 999;
    const roleB = roleOrder[b.role] || 999;
    
    if (roleA !== roleB) {
      return roleA - roleB;
    }
    
    // If roles are the same, sort alphabetically by name
    return a.name.localeCompare(b.name);
  });

  const filteredCourses = courses.filter(course => {
    if (!courseSearchTerm) return true;
    const searchLower = courseSearchTerm.toLowerCase();

    // Create search fields array to avoid duplicates
    const searchFields = [
      course.title?.toLowerCase() || '',
      course.courseCode?.toLowerCase() || '',
      course.description?.toLowerCase() || '',
      course.level?.toLowerCase() || '',
      course.term?.toLowerCase() || '',
      course.assignedTeacher?.name?.toLowerCase() || '',
      course.id?.toString() || '',
      course.createdAt ? formatDate(course.createdAt).toLowerCase() : ''
    ];

    // Check if any field contains the search term
    return searchFields.some(field => field.includes(searchLower));
  }).sort((a, b) => {
    // Sort by level first (ascending)
    const levelA = parseInt(a.level) || 0;
    const levelB = parseInt(b.level) || 0;
    if (levelA !== levelB) {
      return levelA - levelB;
    }
    
    // Then sort by term (ascending)
    const termA = parseInt(a.term) || 0;
    const termB = parseInt(b.term) || 0;
    if (termA !== termB) {
      return termA - termB;
    }
    
    // Finally sort by course code (ascending)
    const codeA = a.courseCode || '';
    const codeB = b.courseCode || '';
    return codeA.localeCompare(codeB);
  });

  // Handle tab change and clear search
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    // Clear search terms when switching tabs
    if (tabId !== 'users') setUserSearchTerm('');
    if (tabId !== 'courses') setCourseSearchTerm('');
  };

  // Show Course Management view if selected
  if (showCourseManagement && selectedCourseId) {
    return (
      <CourseManagement
        courseId={selectedCourseId}
        onBack={closeCourseManagement}
      />
    );
  }

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
      pageTitle="Admin Dashboard"
      pageSubtitle="Manage users, courses, and system settings"
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
              { id: 'users', label: 'User Management', icon: '👥' },
              { id: 'courses', label: 'Courses', icon: '📚' },
              { id: 'settings', label: 'Settings', icon: '⚙️' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
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
              <span className="stat-icon">👥</span>
              <div className="stat-value">{stats.totalUsers}</div>
              <div className="stat-label">Total Users</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">⏳</span>
              <div className="stat-value">{stats.pendingUsers}</div>
              <div className="stat-label">Pending Approvals</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">📚</span>
              <div className="stat-value">{stats.totalCourses}</div>
              <div className="stat-label">Total Courses</div>
            </div>
            <div className="stat-card">
              <span className="stat-icon">📋</span>
              <div className="stat-value">{stats.totalEnrollments}</div>
              <div className="stat-label">Enrollments</div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Quick Actions</h3>
              <p className="card-subtitle">Common administrative tasks</p>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-2">
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => handleTabChange('users')}
                >
                  <span style={{ marginRight: '0.5rem' }}>👥</span>
                  Review Pending Users ({stats.pendingUsers})
                </button>
                <button
                  className="btn btn-secondary btn-lg"
                  onClick={() => handleTabChange('courses')}
                >
                  <span style={{ marginRight: '0.5rem' }}>📚</span>
                  Manage Courses
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <UserManagement />
      )}

      {/* Courses Tab */}
      {activeTab === 'courses' && (
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <h3 className="card-title">Course Management</h3>
                <p className="card-subtitle">
                  {filteredCourses.length} of {courses.length} courses {courseSearchTerm && '(filtered)'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="🔍 Search courses by title, code, level, term, description..."
                  value={courseSearchTerm}
                  onChange={(e) => setCourseSearchTerm(e.target.value)}
                  style={{ fontSize: '0.875rem', minWidth: '300px' }}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  <span style={{ marginRight: '0.5rem' }}>➕</span>
                  Create New Course
                </button>
                <button
                  className="btn btn-danger"
                  onClick={clearAllCourses}
                  style={{ whiteSpace: 'nowrap' }}
                  disabled={courses.length === 0}
                >
                  <span style={{ marginRight: '0.5rem' }}>🗑️</span>
                  Clear All Courses
                </button>
              </div>
            </div>
          </div>
          <div className="card-body">
            {filteredCourses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                {courses.length === 0 ? (
                  <>
                    <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📚</span>
                    <h4>No courses yet</h4>
                    <p>Click "Create New Course" to add your first course.</p>
                  </>
                ) : (
                  <>
                    <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🔍</span>
                    <h4>No courses found</h4>
                    <p>No courses match your search criteria. Try different keywords.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1">
                {filteredCourses.map(course => (
                  <div key={course.id} className="card">
                    <div className="card-body">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
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
                            {course.level && (
                              <span style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                background: '#10b981',
                                color: 'white'
                              }}>
                                {course.level}
                              </span>
                            )}
                            {course.term && (
                              <span style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                background: '#f59e0b',
                                color: 'white'
                              }}>
                                {course.term}
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '0 0 1rem 0', color: '#64748b' }}>
                            {course.description}
                          </p>
                          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#64748b', flexWrap: 'wrap' }}>
                            <span>📅 Created: {course.createdAt ? formatDate(course.createdAt) : 'Unknown'}</span>
                            <span>👨‍🏫 Teacher: {course.assignedTeacher ? course.assignedTeacher.name : 'Not Assigned'}</span>
                            {course.level && <span>🎓 Level: {course.level}</span>}
                            {course.term && <span>📚 Term: {course.term}</span>}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => openCourseManagement(course.id)}
                            title="Manage course details, teachers, and enrollments"
                          >
                            ⚙️ Manage
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEditModal(course)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => deleteCourse(course.id)}
                          >
                            🗑️ Delete
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
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">System Settings</h3>
            <p className="card-subtitle">Configure system preferences</p>
          </div>
          <div className="card-body">
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>⚙️</span>
              <h4>Settings Coming Soon</h4>
              <p>System configuration options will be available here.</p>
            </div>
          </div>
        </div>
      )}

      {/* Course Creation Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Course</h3>
              <button
                className="modal-close"
                onClick={closeCreateModal}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {/* Error message inside modal */}
              {modalError && (
                <div className="alert alert-error" style={{
                  marginBottom: '1rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#dc2626',
                  fontSize: '0.875rem'
                }}>
                  <strong>⚠️ Error:</strong> {modalError}
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); createCourse(); }}>
                <div className="form-group">
                  <label htmlFor="courseTitle">Course Title *</label>
                  <input
                    id="courseTitle"
                    type="text"
                    className="form-control"
                    placeholder="Enter course title"
                    value={newCourse.title}
                    onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="courseCode">Course Code *</label>
                  <input
                    id="courseCode"
                    type="text"
                    className="form-control"
                    placeholder="e.g., CS101, MATH201"
                    value={newCourse.courseCode}
                    onChange={(e) => {
                      setNewCourse({ ...newCourse, courseCode: e.target.value });
                      if (modalError) setModalError(''); // Clear error when user types
                    }}
                    required
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Course code must be unique. Examples: CS101, MATH201, PHY301
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="courseDescription">Description *</label>
                  <textarea
                    id="courseDescription"
                    className="form-control"
                    placeholder="Enter course description"
                    rows="4"
                    value={newCourse.description}
                    onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="courseLevel">Level *</label>
                    <select
                      id="courseLevel"
                      className="form-control"
                      value={newCourse.level}
                      onChange={(e) => setNewCourse({ ...newCourse, level: e.target.value })}
                      required
                    >
                      <option value="">Select Level</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </select>
                  </div>

                                    <div className="form-group">
                    <label htmlFor="courseTerm">Term *</label>
                    <select
                      id="courseTerm"
                      className="form-control"
                      value={newCourse.term}
                      onChange={(e) => setNewCourse({ ...newCourse, term: e.target.value })}
                      required
                    >
                      <option value="">Select Term</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </select>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeCreateModal}
                    disabled={isCreating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isCreating}
                  >
                    {isCreating ? (
                      <>
                        <span style={{ marginRight: '0.5rem' }}>⏳</span>
                        Creating...
                      </>
                    ) : (
                      <>
                        <span style={{ marginRight: '0.5rem' }}>➕</span>
                        Create Course
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Course Edit Modal */}
      {showEditModal && selectedCourse && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Course</h3>
              <button
                className="modal-close"
                onClick={closeEditModal}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {/* Error message inside edit modal */}
              {editModalError && (
                <div className="alert alert-error" style={{
                  marginBottom: '1rem',
                  padding: '0.75rem 1rem',
                  backgroundColor: '#fee2e2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  color: '#dc2626',
                  fontSize: '0.875rem'
                }}>
                  <strong>⚠️ Error:</strong> {editModalError}
                </div>
              )}

              <form onSubmit={(e) => { 
                try {
                  e.preventDefault(); 
                  console.log('📝 Edit form submitted!');
                  console.log('🎯 Form event:', e);
                  updateCourse(); 
                } catch (error) {
                  console.error('❌ Error in form submission:', error);
                }
              }}>
                <div className="form-group">
                  <label htmlFor="editCourseTitle">Course Title *</label>
                  <input
                    id="editCourseTitle"
                    type="text"
                    className="form-control"
                    placeholder="Enter course title"
                    value={editCourse.title}
                    onChange={(e) => setEditCourse({ ...editCourse, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="editCourseCode">Course Code *</label>
                  <input
                    id="editCourseCode"
                    type="text"
                    className="form-control"
                    placeholder="e.g., CS101, MATH201"
                    value={editCourse.courseCode}
                    onChange={(e) => {
                      setEditCourse({ ...editCourse, courseCode: e.target.value });
                      if (editModalError) setEditModalError(''); // Clear error when user types
                    }}
                    required
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Course code must be unique. Examples: CS101, MATH201, PHY301
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="editCourseDescription">Description *</label>
                  <textarea
                    id="editCourseDescription"
                    className="form-control"
                    placeholder="Enter course description"
                    rows="4"
                    value={editCourse.description}
                    onChange={(e) => setEditCourse({ ...editCourse, description: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="editCourseLevel">Level *</label>
                    <select
                      id="editCourseLevel"
                      className="form-control"
                      value={editCourse.level}
                      onChange={(e) => setEditCourse({ ...editCourse, level: e.target.value })}
                      required
                    >
                      <option value="">Select Level</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="editCourseTerm">Term *</label>
                    <select
                      id="editCourseTerm"
                      className="form-control"
                      value={editCourse.term}
                      onChange={(e) => setEditCourse({ ...editCourse, term: e.target.value })}
                      required
                    >
                      <option value="">Select Term</option>
                      <option value="1">1</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                    </select>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeEditModal}
                    disabled={isUpdating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isUpdating}
                    onClick={(e) => {
                      console.log('🔘 Update button clicked directly!');
                      // Don't prevent default - let form submission handle it
                    }}
                  >
                    {isUpdating ? (
                      <>
                        <span style={{ marginRight: '0.5rem' }}>⏳</span>
                        Updating...
                      </>
                    ) : (
                      <>
                        <span style={{ marginRight: '0.5rem' }}>💾</span>
                        Update Course
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default ModernAdminDashboard;
