import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import UserManagement from './UserManagement';
import axios from '../api/axiosInstance';

const AdminDashboard = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, users, courses
  const [stats, setStats] = useState({
    totalUsers: 0,
    pendingApprovals: 0,
    totalCourses: 0,
    activeEnrollments: 0
  });
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      const [usersRes, coursesRes] = await Promise.all([
        axios.get('/admin/users'),
        axios.get('/courses')
      ]);
      
      setUsers(usersRes.data);
      setCourses(coursesRes.data);
      
      setStats({
        totalUsers: usersRes.data.length,
        pendingApprovals: usersRes.data.filter(u => u.status === 'PENDING' || !u.approved).length,
        totalCourses: coursesRes.data.length,
        activeEnrollments: 0 // TODO: Add enrollment count
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching admin data:', error);
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      await axios.post(`/admin/approve/${userId}`);
      fetchAdminData(); // Refresh data
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  if (loading) {
    return (
      <Dashboard user={user} onLogout={onLogout}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading admin dashboard...</p>
        </div>
      </Dashboard>
    );
  }

  return (
    <Dashboard user={user} onLogout={onLogout}>
      {/* Navigation Tabs */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 User Management
        </button>
        <button 
          className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
          onClick={() => setActiveTab('courses')}
        >
          📚 Course Management
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Cards */}
          <div className="dashboard-cards">
            <div className="dashboard-card" onClick={() => setActiveTab('users')}>
              <div className="card-header">
                <div className="card-icon">👥</div>
                <h3 className="card-title">Users</h3>
              </div>
              <div className="card-content">
                <span className="stat-number">{stats.totalUsers}</span>
                <span className="stat-label">Total Users</span>
              </div>
            </div>

        <div className="dashboard-card" onClick={() => setActiveTab('users')}>
          <div className="card-header">
            <div className="card-icon">⏳</div>
            <h3 className="card-title">Pending</h3>
          </div>
          <div className="card-content">
            <span className="stat-number">{stats.pendingApprovals}</span>
            <span className="stat-label">Awaiting Approval</span>
          </div>
        </div>

        <div className="dashboard-card" onClick={() => setActiveTab('courses')}>
          <div className="card-header">
            <div className="card-icon">📚</div>
            <h3 className="card-title">Courses</h3>
          </div>
          <div className="card-content">
            <span className="stat-number">{stats.totalCourses}</span>
            <span className="stat-label">Available Courses</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-icon">📈</div>
            <h3 className="card-title">Enrollments</h3>
          </div>
          <div className="card-content">
            <span className="stat-number">{stats.activeEnrollments}</span>
            <span className="stat-label">Active Enrollments</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button 
          className="quick-action-btn users"
          onClick={() => setActiveTab('users')}
        >
          👥 Manage Users
        </button>
        <button 
          className="quick-action-btn courses"
          onClick={() => setActiveTab('courses')}
        >
          📚 Manage Courses
        </button>
      </div>
        </>
      )}

      {/* User Management Tab */}
      {activeTab === 'users' && (
        <UserManagement />
      )}

      {/* Course Management Tab */}
      {activeTab === 'courses' && (
        <div className="course-management">
          <h2>📚 Course Management</h2>
          <div className="course-actions">
            <button className="action-btn primary">➕ Create New Course</button>
            <button className="action-btn">📊 View All Courses</button>
          </div>
          
          <div className="recent-courses">
            <h3>Recent Courses</h3>
            <div className="course-grid">
              {courses.slice(0, 6).map(course => (
                <div key={course.id} className="course-card">
                  <div className="course-header">
                    <h4>{course.title}</h4>
                    <span className="course-code">{course.courseCode}</span>
                  </div>
                  <p className="course-description">{course.description}</p>
                  <div className="course-footer">
                    <span className="teacher-info">
                      👨‍🏫 {course.assignedTeacher?.name || 'No teacher assigned'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Dashboard>
  );
};

export default AdminDashboard;
