import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';
import {
  FiBell,
  FiUserPlus,
  FiUserCheck,
  FiFileText,
  FiClipboard,
  FiMessageSquare,
  FiCheckCircle,
  FiXCircle,
  FiBookOpen,
  FiTag,
  FiAlertTriangle,
  FiUser,
  FiRefreshCw,
  FiUsers
} from 'react-icons/fi';
import { FaGraduationCap } from 'react-icons/fa6';
import './NotificationBell.css';

const NotificationBell = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;

    try {
      const response = await axios.get(`/notifications/unread/count?userId=${user.id}`);
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(() => {
        fetchUnreadCount();
      }, 30000);
      return () => {
        clearInterval(interval);
      };
    }
  }, [user, fetchUnreadCount]);

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

  const fetchNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const response = await axios.get(`/notifications?userId=${user.id}`);
      setNotifications(response.data.slice(0, 10)); // Show only last 10 notifications
    } catch (error) {
      console.error('Error fetching notifications:', error);
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
    const isTeacher = user?.role === 'TEACHER';
    const isStudent = user?.role === 'STUDENT';
    const isAdmin = user?.role === 'ADMIN';

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
        case 'DISCUSSION_TAG':
        case 'ASSIGNMENT_GRADED':
          return relatedCourse?.courseCode
            ? `/student/${relatedCourse.courseCode}`
            : '/student';

        case 'NEW_COURSE_CREATED':
          return '/student';

        case 'ENROLLMENT_APPROVED':
        case 'ENROLLMENT_REJECTED':
        case 'USER_PROFILE_UPDATED':
        case 'USER_STATUS_CHANGED':
        case 'USER_ROLE_CHANGED':
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
        case 'USER_PROFILE_UPDATED':
        case 'USER_STATUS_CHANGED':
        case 'USER_ROLE_CHANGED':
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
      // Mark as read if not already read
      if (!notification.isRead) {
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
      navigate(route);
    } catch (error) {
      console.error('Error handling notification click:', error);
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

  const sanitizeText = (text) => {
    if (!text) return '';
    return text
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'NEW_SIGNUP_REQUEST': return <FiUserPlus className="text-blue-500" />;
      case 'TEACHER_COURSE_ASSIGNMENT': return <FiUserCheck className="text-indigo-500" />;
      case 'STUDENT_ENROLLMENT_REQUEST': return <FiFileText className="text-blue-500" />;
      case 'ASSIGNMENT_SUBMISSION': return <FiClipboard className="text-emerald-500" />;
      case 'DISCUSSION_POST': return <FiMessageSquare className="text-blue-500" />;
      case 'ENROLLMENT_APPROVED': return <FiCheckCircle className="text-green-500" />;
      case 'ENROLLMENT_REJECTED': return <FiXCircle className="text-red-500" />;
      case 'NEW_ASSIGNMENT': return <FiFileText className="text-amber-500" />;
      case 'NEW_RESOURCE': return <FiBookOpen className="text-blue-500" />;
      case 'NEW_DISCUSSION_THREAD': return <FiMessageSquare className="text-cyan-500" />;
      case 'NEW_COURSE_CREATED': return <FiBookOpen className="text-blue-600" />;
      case 'DISCUSSION_REPLY': return <FiMessageSquare className="text-blue-500" />;
      case 'DISCUSSION_TAG': return <FiTag className="text-violet-500" />;
      case 'ASSIGNMENT_GRADED': return <FaGraduationCap className="text-emerald-600" />;
      case 'COURSE_ANNOUNCEMENT': return <FiBell className="text-blue-500" />;
      case 'PLAGIARISM_DETECTED': return <FiAlertTriangle className="text-rose-500" />;
      case 'USER_PROFILE_UPDATED': return <FiUser className="text-blue-500" />;
      case 'USER_STATUS_CHANGED': return <FiRefreshCw className="text-amber-500" />;
      case 'USER_ROLE_CHANGED': return <FiUsers className="text-purple-500" />;
      default: return <FiBell className="text-blue-500" />;
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
        <span className="bell-icon"><FiBell size={22} /></span>
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
                <FiRefreshCw size={14} className={loading ? "spin" : ""} />
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
                <span className="no-notifications-icon"><FiBell size={32} /></span>
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
                    <div className="notification-title">{sanitizeText(notification.title)}</div>
                    <div className="notification-message">{sanitizeText(notification.message)}</div>
                    <div className="notification-meta">
                      <div className="notification-time">{formatTimeAgo(notification.createdAt)}</div>
                      {notification.relatedCourse && (
                        <div className="notification-course" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <FiBookOpen size={12} /> {notification.relatedCourse.courseCode}
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
