import React from 'react';
import './Dashboard.css';

const Dashboard = ({ user, onLogout, children }) => {
  const getDashboardTitle = () => {
    switch (user?.role) {
      case 'ADMIN':
        return 'Admin Dashboard';
      case 'TEACHER':
        return 'Teacher Portal';
      case 'STUDENT':
        return 'Student Portal';
      default:
        return 'Dashboard';
    }
  };

  const getNavItems = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          { label: 'Overview', path: '/admin/overview', icon: '📊' },
          { label: 'Manage Users', path: '/admin/users', icon: '👥' },
          { label: 'Manage Courses', path: '/admin/courses', icon: '📚' },
          { label: 'System Settings', path: '/admin/settings', icon: '⚙️' }
        ];
      case 'TEACHER':
        return [
          { label: 'My Courses', path: '/teacher/courses', icon: '📖' },
          { label: 'Students', path: '/teacher/students', icon: '👨‍🎓' },
          { label: 'Enrollments', path: '/teacher/enrollments', icon: '📝' },
          { label: 'Profile', path: '/teacher/profile', icon: '👤' }
        ];
      case 'STUDENT':
        return [
          { label: 'My Courses', path: '/student/courses', icon: '📚' },
          { label: 'Browse Courses', path: '/student/browse', icon: '🔍' },
          { label: 'Enrollments', path: '/student/enrollments', icon: '📋' },
          { label: 'Profile', path: '/student/profile', icon: '👤' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="dashboard-container">
      {/* Grid Overlay - same as landing page */}
      <div className="grid-overlay"></div>
      
      {/* Top Navigation Bar */}
      <nav className="dashboard-navbar">
        <div className="navbar-content">
          {/* Logo Section */}
          <div className="navbar-logo">
            <div className="navbar-logo-container">
              <svg className="navbar-logo-svg" viewBox="0 0 400 80">
                <defs>
                  <path id="curve" d="M 50 50 Q 200 20 350 50" />
                </defs>
                <text className="navbar-logo-text">
                  <textPath href="#curve" startOffset="50%">
                    ACADEMY
                  </textPath>
                </text>
              </svg>
              <div className="navbar-graduation-cap">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5,13.18V17.18L12,21L19,17.18V13.18L12,17L5,13.18M12,3L1,9L12,15L21,11V17H23V9L12,3Z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="navbar-nav">
            {getNavItems().map((item, index) => (
              <a key={index} href={item.path} className="nav-item">
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </a>
            ))}
          </div>

          {/* User Info & Logout */}
          <div className="navbar-user">
            <div className="user-info">
              <div className="user-avatar">
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="user-details">
                <div className="user-name">{user?.name}</div>
                <div className="user-role">{user?.role}</div>
              </div>
            </div>
            <button onClick={onLogout} className="logout-btn">
              <span>🚪</span>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="dashboard-main">
        <div className="dashboard-content">
          <div className="content-header">
            <h1 className="dashboard-title">{getDashboardTitle()}</h1>
            <div className="welcome-message">
              Welcome back, <span className="user-name-highlight">{user?.name}</span>!
            </div>
          </div>
          
          <div className="content-body">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
