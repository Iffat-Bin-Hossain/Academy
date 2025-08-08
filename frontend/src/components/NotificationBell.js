import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';
import './NotificationBell.css';

  const NotificationBell = ({ user }) => {
  console.log('🔔 NotificationBell component rendering, user:', user);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  console.log('🔔 NotificationBell state - unreadCount:', unreadCount, 'showDropdown:', showDropdown);

  useEffect(() => {
    console.log('🔔 NotificationBell useEffect triggered, user:', user);
    if (user) {
      console.log('🔔 Starting notification fetch for user:', user.id);
      fetchUnreadCount();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        console.log('🔔 Polling for notifications...');
        fetchUnreadCount();
      }, 30000);
      return () => {
        console.log('🔔 Cleaning up notification interval');
        clearInterval(interval);
      };
    } else {
      console.log('🔔 No user found, skipping notification fetch');
    }
  }, [user]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUnreadCount = async () => {
    if (!user?.id) {
      console.log('🔔 fetchUnreadCount skipped - user or user.id missing:', { user, userId: user?.id });
      return;
    }
    
    try {
      console.log('🔔 Fetching unread count for user:', user.id, 'user object:', user);
      const response = await axios.get(`/notifications/unread/count?userId=${user.id}`);
      console.log('🔔 Unread count response:', response.data);
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('🔔 Error fetching unread count:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        url: error.config?.url
      });
    }
  };

  const fetchNotifications = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('Fetching notifications for user:', user.id);
      const response = await axios.get(`/notifications?userId=${user.id}`);
      console.log('Notifications response:', response.data);
      setNotifications(response.data.slice(0, 10)); // Show only last 10 notifications
    } catch (error) {
      console.error('Error fetching notifications:', error.response?.status, error.response?.data, error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBellClick = async () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown && notifications.length === 0) {
      await fetchNotifications();
    }
  };

  const getNotificationRoute = (notification) => {
    const { type, relatedCourse } = notification;
    const isTeacher = user.role === 'TEACHER';
    const isStudent = user.role === 'STUDENT';
    const isAdmin = user.role === 'ADMIN';
    
    if (isAdmin) {
      // For admins: signup requests go to user management
      switch (type) {
        case 'NEW_SIGNUP_REQUEST':
          return '/admin/users';
        default:
          return '/admin';
      }
    } else if (isStudent) {
      // For students: resource, assignment, and discussion notifications go to specific course
      switch (type) {
        case 'NEW_RESOURCE':
        case 'NEW_ASSIGNMENT':
        case 'NEW_DISCUSSION_THREAD':
        case 'DISCUSSION_REPLY':
        case 'ASSIGNMENT_GRADED':
          return relatedCourse?.courseCode 
            ? `/student/${relatedCourse.courseCode}` 
            : '/student';
        
        case 'NEW_COURSE_CREATED':
          return '/student';
        
        case 'ENROLLMENT_APPROVED':
        case 'ENROLLMENT_REJECTED':
        default:
          return '/student';
      }
    } else if (isTeacher) {
      // For teachers: discussion post and submission go to specific course
      switch (type) {
        case 'DISCUSSION_POST':
        case 'ASSIGNMENT_SUBMISSION':
          return relatedCourse?.courseCode 
            ? `/teacher/${relatedCourse.courseCode}` 
            : '/teacher';
        
        case 'STUDENT_ENROLLMENT_REQUEST':
        case 'TEACHER_COURSE_ASSIGNMENT':
        default:
          return '/teacher';
      }
    }
    
    // Fallback
    return '/';
  };

  const handleNotificationClick = async (notification) => {
    if (!user?.id) return;
    
    try {
      console.log('Handling notification click:', notification);
      // Mark as read if not already read
      if (!notification.isRead) {
        console.log('Marking notification as read:', notification.id);
        await axios.put(`/notifications/${notification.id}/read?userId=${user.id}`);
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
      }

      // Close dropdown
      setShowDropdown(false);

      // Navigate to the appropriate route
      const route = getNotificationRoute(notification);
      console.log('Navigating to route:', route);
      navigate(route);
    } catch (error) {
      console.error('Error handling notification click:', error.response?.status, error.response?.data, error.message);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;
    
    try {
      await axios.put(`/notifications/read-all?userId=${user.id}`);
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatTimeAgo = (dateString) => {
    if (!dateString) return 'Unknown time';
    
    try {
      const now = new Date();
      let notificationDate;
      
      // Handle different date formats from backend
      if (typeof dateString === 'string') {
        // Handle ISO string format (e.g., "2025-08-08T10:30:00")
        if (dateString.includes('T')) {
          notificationDate = new Date(dateString);
        } 
        // Handle LocalDateTime array format [2025,8,8,10,30,0] 
        else if (dateString.includes('[')) {
          notificationDate = new Date(dateString.replace(/\[.*\]/, '').replace(' ', 'T'));
        }
        // Handle space-separated format "2025-08-08 10:30:00"
        else if (dateString.includes(' ')) {
          notificationDate = new Date(dateString.replace(' ', 'T'));
        }
        // Default case
        else {
          notificationDate = new Date(dateString);
        }
      } else if (Array.isArray(dateString)) {
        // Handle LocalDateTime array format directly
        const [year, month, day, hour = 0, minute = 0, second = 0] = dateString;
        notificationDate = new Date(year, month - 1, day, hour, minute, second);
      } else {
        notificationDate = new Date(dateString);
      }
      
      if (isNaN(notificationDate.getTime())) {
        console.warn('Invalid date format:', dateString);
        return 'Invalid date';
      }
      
      const diffInSeconds = Math.floor((now - notificationDate) / 1000);

      if (diffInSeconds < 0) return 'Just now'; // Handle future dates
      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      
      // For older notifications, show actual date
      return notificationDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: notificationDate.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error parsing date:', dateString, error);
      return 'Invalid date';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'NEW_SIGNUP_REQUEST': return '🔔';
      case 'TEACHER_COURSE_ASSIGNMENT': return '👨‍🏫';
      case 'STUDENT_ENROLLMENT_REQUEST': return '📝';
      case 'ASSIGNMENT_SUBMISSION': return '📋';
      case 'DISCUSSION_POST': return '💬';
      case 'ENROLLMENT_APPROVED': return '✅';
      case 'ENROLLMENT_REJECTED': return '❌';
      case 'NEW_ASSIGNMENT': return '📝';
      case 'NEW_RESOURCE': return '📚';
      case 'NEW_DISCUSSION_THREAD': return '💬';
      case 'NEW_COURSE_CREATED': return '📚';
      case 'DISCUSSION_REPLY': return '💬';
      case 'ASSIGNMENT_GRADED': return '🎓';
      case 'COURSE_ANNOUNCEMENT': return '📢';
      default: return '🔔';
    }
  };

  if (!user) return null;

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button 
        className="bell-button"
        onClick={handleBellClick}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <span className="bell-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="unread-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h4>Notifications</h4>
            <div className="header-actions">
              <button 
                className="refresh-btn" 
                onClick={fetchNotifications}
                title="Refresh notifications"
                disabled={loading}
              >
                🔄
              </button>
              {unreadCount > 0 && (
                <button className="mark-all-read" onClick={markAllAsRead}>
                  Mark all read
                </button>
              )}
            </div>
          </div>

          <div className="notification-list">
            {loading ? (
              <div className="notification-loading">
                <div className="spinner"></div>
                <span>Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="no-notifications">
                <span className="no-notifications-icon">🔔</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="notification-content">
                    <div className="notification-title">{notification.title}</div>
                    <div className="notification-message">{notification.message}</div>
                    <div className="notification-meta">
                      <div className="notification-time">{formatTimeAgo(notification.createdAt)}</div>
                      {notification.relatedCourse && (
                        <div className="notification-course">
                          📚 {notification.relatedCourse.courseCode}
                        </div>
                      )}
                    </div>
                  </div>
                  {!notification.isRead && <div className="unread-dot"></div>}
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              <button 
                className="view-all-notifications"
                onClick={() => {
                  setShowDropdown(false);
                  // Could navigate to a full notifications page
                }}
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
