import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, PENDING, ACTIVE, DISABLED
  const [searchTerm, setSearchTerm] = useState(''); // Add search functionality
  const [editingUser, setEditingUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // Message system state
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success', 'error', 'info'

  useEffect(() => {
    fetchUsers();
  }, []);

  // Helper function to show messages
  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
    // Auto-hide message after 4 seconds
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 4000);
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/admin/users');
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching users:', error);
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'ACTIVE': return 'status-active';
      case 'PENDING': return 'status-pending';
      case 'DISABLED': return 'status-disabled';
      default: return 'status-unknown';
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'ADMIN': return 'role-admin';
      case 'TEACHER': return 'role-teacher';
      case 'STUDENT': return 'role-student';
      default: return 'role-unknown';
    }
  };

  const filteredUsers = users.filter(user => {
    // First filter by status
    const statusMatch = filter === 'ALL' 
      ? user.status !== 'REJECTED' // Exclude rejected users from ALL view
      : user.status === filter;
    
    // Then filter by search term
    if (!searchTerm) return statusMatch;
    
    const searchLower = searchTerm.toLowerCase();
    const searchMatch = (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.role?.toLowerCase().includes(searchLower) ||
      user.status?.toLowerCase().includes(searchLower)
    );
    
    return statusMatch && searchMatch;
  });

  const handleToggleStatus = async (userId) => {
    try {
      const user = users.find(u => u.id === userId);
      const currentStatus = user?.status;
      
      await axios.post(`/admin/users/${userId}/toggle-status`);
      
      // Determine the new status for the message
      let newStatus;
      if (currentStatus === 'ACTIVE') {
        newStatus = 'DISABLED';
        showMessage(`User "${user.name}" has been disabled successfully`, 'success');
      } else if (currentStatus === 'DISABLED') {
        newStatus = 'ACTIVE';
        showMessage(`User "${user.name}" has been enabled successfully`, 'success');
      } else {
        showMessage(`User "${user.name}" status updated successfully`, 'success');
      }
      
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error toggling user status:', error);
      const errorMessage = error.response?.data?.error || 'Error updating user status';
      showMessage(errorMessage, 'error');
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      const user = users.find(u => u.id === userId);
      await axios.post(`/admin/approve/${userId}`);
      showMessage(`User "${user?.name || 'Unknown'}" has been approved successfully`, 'success');
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error approving user:', error);
      showMessage('Error approving user', 'error');
    }
  };

  const handleRejectUser = async (userId) => {
    const user = users.find(u => u.id === userId);
    if (window.confirm(`Are you sure you want to reject "${user?.name || 'this user'}"? This will permanently delete their account.`)) {
      try {
        await axios.post(`/admin/reject/${userId}`);
        showMessage(`User "${user?.name || 'Unknown'}" has been rejected and removed`, 'success');
        fetchUsers(); // Refresh the list
      } catch (error) {
        console.error('Error rejecting user:', error);
        showMessage('Error rejecting user', 'error');
      }
    }
  };

  const handleEditUser = (user) => {
    setEditingUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
    setShowEditModal(true);
  };

  const handleSaveUser = async () => {
    try {
      await axios.put(`/admin/users/${editingUser.id}`, {
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
        status: editingUser.status
      });
      setShowEditModal(false);
      setEditingUser(null);
      showMessage(`User "${editingUser.name}" has been updated successfully`, 'success');
      fetchUsers(); // Refresh the list
    } catch (error) {
      console.error('Error updating user:', error);
      const errorMessage = error.response?.data?.error || error.message;
      showMessage(`Error updating user: ${errorMessage}`, 'error');
    }
  };

  const getStatusCounts = () => {
    const counts = {
      ALL: users.filter(u => u.status !== 'REJECTED').length, // Exclude rejected users from ALL count
      PENDING: users.filter(u => u.status === 'PENDING').length,
      ACTIVE: users.filter(u => u.status === 'ACTIVE').length,
      DISABLED: users.filter(u => u.status === 'DISABLED').length,
      REJECTED: users.filter(u => u.status === 'REJECTED').length
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="user-management-loading">
        <div className="loading-spinner"></div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <h2>👥 User Management</h2>
        <div className="user-stats">
          <span className="stat">Active Users: {statusCounts.ALL}</span>
          <span className="stat pending">Pending: {statusCounts.PENDING}</span>
          <span className="stat active">Active: {statusCounts.ACTIVE}</span>
          <span className="stat disabled">Disabled: {statusCounts.DISABLED}</span>
          <span className="stat rejected">Rejected: {statusCounts.REJECTED}</span>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`user-management-message ${messageType}`}>
          <div className="message-content">
            <span className="message-icon">
              {messageType === 'success' && '✓'}
              {messageType === 'error' && '⚠'}
              {messageType === 'info' && 'ℹ'}
            </span>
            <span className="message-text">{message}</span>
            <button 
              className="message-close" 
              onClick={() => {setMessage(''); setMessageType('');}}
              aria-label="Close message"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="user-controls">
        <div className="search-container">
          <div className="search-input-wrapper">
            <input
              type="text"
              placeholder="🔍 Search users by name, email, role, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                className="search-clear"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="user-filters">
        {['ALL', 'PENDING', 'ACTIVE', 'DISABLED', 'REJECTED'].map(status => (
          <button
            key={status}
            className={`filter-btn ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
          >
            {status} ({statusCounts[status]})
          </button>
        ))}
      </div>

      {/* Search Results Counter */}
      {searchTerm && (
        <div className="search-results-info">
          <span className="results-count">
            📊 Found {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} matching "{searchTerm}"
          </span>
          {filteredUsers.length === 0 && (
            <span className="no-results">
              Try adjusting your search terms or clearing the search to see all users.
            </span>
          )}
        </div>
      )}

      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.id} className={`user-row ${user.status.toLowerCase()}`}>
                <td className="user-info">
                  <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                  <div className="user-details">
                    <div className="user-name">{user.name}</div>
                    <div className="user-id">ID: {user.id}</div>
                  </div>
                </td>
                <td className="user-email">{user.email}</td>
                <td>
                  <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${getStatusBadgeClass(user.status)}`}>
                    {user.status}
                  </span>
                </td>
                <td className="user-date">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="user-actions">
                  {user.status === 'PENDING' && (
                    <>
                      <button
                        className="action-btn approve"
                        onClick={() => handleApproveUser(user.id)}
                        title="Approve User"
                      >
                        ✅
                      </button>
                      <button
                        className="action-btn reject"
                        onClick={() => handleRejectUser(user.id)}
                        title="Reject User"
                      >
                        ❌
                      </button>
                    </>
                  )}
                  {(user.status === 'ACTIVE' || user.status === 'DISABLED') && (
                    <button
                      className={`action-btn toggle ${user.status === 'ACTIVE' ? 'disable' : 'enable'} ${user.role === 'ADMIN' ? 'disabled' : ''}`}
                      onClick={() => user.role !== 'ADMIN' ? handleToggleStatus(user.id) : null}
                      disabled={user.role === 'ADMIN'}
                      title={
                        user.role === 'ADMIN' 
                          ? 'Admin users cannot be disabled for security reasons' 
                          : (user.status === 'ACTIVE' ? 'Disable User' : 'Enable User')
                      }
                    >
                      {user.role === 'ADMIN' ? '🛡️' : (user.status === 'ACTIVE' ? '🔒' : '🔓')}
                    </button>
                  )}
                  <button
                    className="action-btn edit"
                    onClick={() => handleEditUser(user)}
                    title="Edit User"
                  >
                    ✏️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>Edit User</h3>
              <button
                className="modal-close"
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Role:</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                >
                  <option value="STUDENT">Student</option>
                  <option value="TEACHER">Teacher</option>
                  <option value="ADMIN">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status:</label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({...editingUser, status: e.target.value})}
                >
                  <option value="PENDING">Pending</option>
                  <option value="ACTIVE">Active</option>
                  <option value="DISABLED">Disabled</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-cancel"
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn-save"
                onClick={handleSaveUser}
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
