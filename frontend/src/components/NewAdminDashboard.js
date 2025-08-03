import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import axios from '../api/axiosInstance';

const AdminDashboard = ({ user, onLogout }) => {
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
        pendingApprovals: usersRes.data.filter(u => !u.approved).length,
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
      {/* Stats Cards */}
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-icon">👥</div>
            <h3 className="card-title">Users</h3>
          </div>
          <div className="card-content">
            <span className="stat-number">{stats.totalUsers}</span>
            <span className="stat-label">Total Users</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-icon">⏳</div>
            <h3 className="card-title">Pending</h3>
          </div>
          <div className="card-content">
            <span className="stat-number">{stats.pendingApprovals}</span>
            <span className="stat-label">Awaiting Approval</span>
          </div>
        </div>

        <div className="dashboard-card">
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

      {/* Management Sections */}
      <div className="admin-sections">
        {/* User Management */}
        <div className="admin-section">
          <h2 className="section-title">🔧 User Management</h2>
          <div className="section-content">
            {stats.pendingApprovals > 0 && (
              <div className="pending-users">
                <h3>Pending Approvals ({stats.pendingApprovals})</h3>
                <div className="user-list">
                  {users.filter(u => !u.approved).map(user => (
                    <div key={user.id} className="user-card">
                      <div className="user-info">
                        <div className="user-avatar">{user.name.charAt(0)}</div>
                        <div>
                          <div className="user-name">{user.name}</div>
                          <div className="user-email">{user.email}</div>
                          <div className="user-role-badge">{user.role}</div>
                        </div>
                      </div>
                      <button 
                        className="approve-btn"
                        onClick={() => handleApproveUser(user.id)}
                      >
                        ✅ Approve
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Course Management */}
        <div className="admin-section">
          <h2 className="section-title">📚 Course Management</h2>
          <div className="section-content">
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
        </div>
      </div>
    </Dashboard>
  );
};

export default AdminDashboard;
