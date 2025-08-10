import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import MessageIcon from './MessageIcon';
import './Navbar.css';

const Navbar = ({ user, onLogout }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    onLogout?.();
    navigate('/login');
  };

  // Simplified navbar - no navigation items needed

  // Simplified active check - not needed for minimal navbar

  return (
    <>
      {/* Background overlay for mobile menu */}
      {isMenuOpen && (
        <div 
          className="navbar-overlay"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      <nav className="academy-navbar">
        <div className="navbar-container">
          {/* Logo Section */}
          <Link to="/" className="navbar-brand">
            <div className="brand-icon">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3L1 9L12 15L21 9V16H23V9L12 3Z" />
                <path d="M5 13.18V17.18C5 17.97 5.53 18.65 6.4 19.2C7.27 19.75 8.55 20 10 20H14C15.45 20 16.73 19.75 17.6 19.2C18.47 18.65 19 17.97 19 17.18V13.18L12 17L5 13.18Z" />
              </svg>
            </div>
            <span className="brand-text">ACADEMY</span>
            <div className="brand-tagline">STAY LINKED, STAY LOCAL</div>
          </Link>

          {/* User Section (when logged in) */}
          {user && (
            <div className="navbar-user desktop-user">
              <div className="navbar-icons">
                <MessageIcon userId={user.id} />
                <NotificationBell user={user} />
              </div>
              <div className="user-info">
                <Link to={`/${user.role.toLowerCase()}/profile`} className="profile-link">
                  <div className="user-avatar">
                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="user-details">
                    <div className="user-name">{user.name}</div>
                    <div className="user-role">{user.role}</div>
                  </div>
                </Link>
              </div>
              <button onClick={handleLogout} className="logout-btn">
                <span className="logout-icon">🚪</span>
                <span className="logout-text">Logout</span>
              </button>
            </div>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <div className={`hamburger ${isMenuOpen ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`mobile-nav ${isMenuOpen ? 'mobile-nav-open' : ''}`}>
          <div className="mobile-nav-content">
            {user && (
              <>
                <div className="mobile-user-info">
                  <Link to={`/${user.role.toLowerCase()}/profile`} className="mobile-profile-link">
                    <div className="mobile-user-avatar">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="mobile-user-details">
                      <div className="mobile-user-name">{user.name}</div>
                      <div className="mobile-user-role">{user.role}</div>
                    </div>
                  </Link>
                </div>
                <div className="mobile-notification-section">
                  <MessageIcon userId={user.id} />
                  <NotificationBell user={user} />
                </div>
                <button onClick={handleLogout} className="mobile-logout-btn">
                  <span className="mobile-logout-icon">🚪</span>
                  <span className="mobile-logout-text">Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
