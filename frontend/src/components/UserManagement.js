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
  
  // Bulk operations state
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);
  
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

  // Helper function to determine if current filter supports bulk operations
  const supportsBulkOperations = () => {
    return ['PENDING', 'ACTIVE', 'DISABLED'].includes(filter);
  };

  // Clear selections when switching to a filter that doesn't support bulk operations
  useEffect(() => {
    if (!supportsBulkOperations()) {
      setSelectedUsers([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleToggleStatus = async (userId) => {
    try {
      const user = users.find(u => u.id === userId);
      const currentStatus = user?.status;
      
      await axios.post(`/admin/users/${userId}/toggle-status`);
      
      // Determine the new status for the message
      if (currentStatus === 'ACTIVE') {
        showMessage(`User "${user.name}" has been disabled successfully`, 'success');
      } else if (currentStatus === 'DISABLED') {
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

  // Bulk operations
  const handleSelectUser = (userId) => {
    // Don't allow selection of rejected users
    const user = users.find(u => u.id === userId);
    if (user && user.status === 'REJECTED') {
      return;
    }
    
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    // Only select non-rejected users
    const selectableUsers = filteredUsers.filter(user => user.status !== 'REJECTED');
    const allIds = selectableUsers.map(user => user.id);
    setSelectedUsers(allIds);
  };

  const handleClearSelection = () => {
    setSelectedUsers([]);
  };

  // Helper function to get the status of selected users
  const getSelectedUsersStatus = () => {
    const selectedUserObjects = users.filter(user => selectedUsers.includes(user.id));
    const statuses = [...new Set(selectedUserObjects.map(user => user.status))];
    
    if (statuses.length === 1) {
      return statuses[0]; // All selected users have the same status
    }
    return 'MIXED'; // Mixed statuses
  };

  const handleBulkApprove = async () => {
    if (selectedUsers.length === 0) {
      showMessage('Please select users to approve', 'error');
      return;
    }

    // Only allow bulk approve for PENDING users
    const validUserIds = selectedUsers.filter(userId => {
      const user = users.find(u => u.id === userId);
      return user && user.status === 'PENDING';
    });

    if (validUserIds.length === 0) {
      showMessage('No pending users selected for approval', 'error');
      return;
    }

    if (validUserIds.length !== selectedUsers.length) {
      showMessage('Only pending users can be approved in bulk', 'warning');
      setSelectedUsers(validUserIds);
      return;
    }

    if (!window.confirm(`Are you sure you want to approve ${validUserIds.length} pending users?`)) {
      return;
    }

    setBulkOperationLoading(true);
    try {
      const response = await axios.post('/admin/bulk-approve', {
        userIds: validUserIds
      });

      const { message: responseMessage, successCount, failedCount, successful, failed } = response.data;
      
      if (failedCount > 0) {
        showMessage(`${responseMessage} Failed: ${failed.join(', ')}`, 'warning');
      } else {
        showMessage(`Successfully approved ${successCount} users: ${successful.join(', ')}`, 'success');
      }

      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error('Error in bulk approve:', error);
      const errorMessage = error.response?.data?.error || 'Error processing bulk approval';
      showMessage(errorMessage, 'error');
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedUsers.length === 0) {
      showMessage('Please select users to reject', 'error');
      return;
    }

    // Only allow bulk reject for PENDING users
    const validUserIds = selectedUsers.filter(userId => {
      const user = users.find(u => u.id === userId);
      return user && user.status === 'PENDING';
    });

    if (validUserIds.length === 0) {
      showMessage('No pending users selected for rejection', 'error');
      return;
    }

    if (validUserIds.length !== selectedUsers.length) {
      showMessage('Only pending users can be rejected in bulk', 'warning');
      setSelectedUsers(validUserIds);
      return;
    }

    if (!window.confirm(`Are you sure you want to reject ${validUserIds.length} pending users? This action cannot be undone.`)) {
      return;
    }

    setBulkOperationLoading(true);
    try {
      const response = await axios.post('/admin/bulk-reject', {
        userIds: validUserIds
      });

      const { message: responseMessage, successCount, failedCount, successful, failed } = response.data;
      
      if (failedCount > 0) {
        showMessage(`${responseMessage} Failed: ${failed.join(', ')}`, 'warning');
      } else {
        showMessage(`Successfully rejected ${successCount} users: ${successful.join(', ')}`, 'success');
      }

      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error('Error in bulk reject:', error);
      const errorMessage = error.response?.data?.error || 'Error processing bulk rejection';
      showMessage(errorMessage, 'error');
    } finally {
      setBulkOperationLoading(false);
    }
  };

  // New bulk disable function
  const handleBulkDisable = async () => {
    if (selectedUsers.length === 0) {
      showMessage('Please select users to disable', 'error');
      return;
    }

    // Only allow bulk disable for ACTIVE users (excluding ADMIN role)
    const validUserIds = selectedUsers.filter(userId => {
      const user = users.find(u => u.id === userId);
      return user && user.status === 'ACTIVE' && user.role !== 'ADMIN';
    });

    if (validUserIds.length === 0) {
      showMessage('No active non-admin users selected for disabling', 'error');
      return;
    }

    if (validUserIds.length !== selectedUsers.length) {
      showMessage('Only active non-admin users can be disabled in bulk', 'warning');
      setSelectedUsers(validUserIds);
      return;
    }

    if (!window.confirm(`Are you sure you want to disable ${validUserIds.length} active users?`)) {
      return;
    }

    setBulkOperationLoading(true);
    try {
      // Use individual toggle-status calls for bulk disable
      let successCount = 0;
      let failedCount = 0;
      const failed = [];

      for (const userId of validUserIds) {
        try {
          await axios.post(`/admin/users/${userId}/toggle-status`);
          successCount++;
        } catch (error) {
          failedCount++;
          const user = users.find(u => u.id === userId);
          failed.push(user?.name || `ID ${userId}`);
        }
      }

      if (failedCount > 0) {
        showMessage(`Bulk disable completed. ${successCount} successful, ${failedCount} failed. Failed: ${failed.join(', ')}`, 'warning');
      } else {
        showMessage(`Successfully disabled ${successCount} users`, 'success');
      }

      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error('Error in bulk disable:', error);
      showMessage('Error processing bulk disable', 'error');
    } finally {
      setBulkOperationLoading(false);
    }
  };

  // New bulk enable function
  const handleBulkEnable = async () => {
    if (selectedUsers.length === 0) {
      showMessage('Please select users to enable', 'error');
      return;
    }

    // Only allow bulk enable for DISABLED users
    const validUserIds = selectedUsers.filter(userId => {
      const user = users.find(u => u.id === userId);
      return user && user.status === 'DISABLED';
    });

    if (validUserIds.length === 0) {
      showMessage('No disabled users selected for enabling', 'error');
      return;
    }

    if (validUserIds.length !== selectedUsers.length) {
      showMessage('Only disabled users can be enabled in bulk', 'warning');
      setSelectedUsers(validUserIds);
      return;
    }

    if (!window.confirm(`Are you sure you want to enable ${validUserIds.length} disabled users?`)) {
      return;
    }

    setBulkOperationLoading(true);
    try {
      // Use individual toggle-status calls for bulk enable
      let successCount = 0;
      let failedCount = 0;
      const failed = [];

      for (const userId of validUserIds) {
        try {
          await axios.post(`/admin/users/${userId}/toggle-status`);
          successCount++;
        } catch (error) {
          failedCount++;
          const user = users.find(u => u.id === userId);
          failed.push(user?.name || `ID ${userId}`);
        }
      }

      if (failedCount > 0) {
        showMessage(`Bulk enable completed. ${successCount} successful, ${failedCount} failed. Failed: ${failed.join(', ')}`, 'warning');
      } else {
        showMessage(`Successfully enabled ${successCount} users`, 'success');
      }

      setSelectedUsers([]);
      fetchUsers();
    } catch (error) {
      console.error('Error in bulk enable:', error);
      showMessage('Error processing bulk enable', 'error');
    } finally {
      setBulkOperationLoading(false);
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

      {/* Bulk Operations Controls - Only show for specific filters */}
      {selectedUsers.length > 0 && supportsBulkOperations() && (
        <div className="bulk-operations">
          <div className="bulk-info">
            <span className="selected-count">{selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected</span>
            <button 
              className="btn btn-sm btn-secondary"
              onClick={handleClearSelection}
            >
              Clear Selection
            </button>
          </div>
          <div className="bulk-actions">
            {(() => {
              const selectedStatus = getSelectedUsersStatus();
              
              if (selectedStatus === 'PENDING') {
                return (
                  <>
                    <button
                      className="btn btn-sm btn-success"
                      onClick={handleBulkApprove}
                      disabled={bulkOperationLoading}
                    >
                      {bulkOperationLoading ? '⏳ Processing...' : '✅ Approve Selected'}
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={handleBulkReject}
                      disabled={bulkOperationLoading}
                    >
                      {bulkOperationLoading ? '⏳ Processing...' : '❌ Reject Selected'}
                    </button>
                  </>
                );
              } else if (selectedStatus === 'ACTIVE') {
                return (
                  <button
                    className="btn btn-sm btn-warning"
                    onClick={handleBulkDisable}
                    disabled={bulkOperationLoading}
                  >
                    {bulkOperationLoading ? '⏳ Processing...' : '🔒 Disable Selected'}
                  </button>
                );
              } else if (selectedStatus === 'DISABLED') {
                return (
                  <button
                    className="btn btn-sm btn-info"
                    onClick={handleBulkEnable}
                    disabled={bulkOperationLoading}
                  >
                    {bulkOperationLoading ? '⏳ Processing...' : '🔓 Enable Selected'}
                  </button>
                );
              } else {
                return (
                  <span className="bulk-mixed-status">
                    Mixed user statuses - no bulk actions available
                  </span>
                );
              }
            })()}
          </div>
        </div>
      )}

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

      {/* Bulk Selection Controls - Only show for specific filters */}
      {supportsBulkOperations() && (
        <div className="selection-controls">
          <button
            className="btn btn-sm btn-secondary"
            onClick={handleSelectAll}
            disabled={filteredUsers.length === 0}
          >
            Select All Selectable ({filteredUsers.filter(user => user.status !== 'REJECTED').length})
          </button>
          <button
            className="btn btn-sm btn-secondary"
            onClick={handleClearSelection}
            disabled={selectedUsers.length === 0}
          >
            Clear All ({selectedUsers.length})
          </button>
          {filteredUsers.filter(user => user.status === 'REJECTED').length > 0 && (
            <small className="selection-note">
              * Rejected users ({filteredUsers.filter(user => user.status === 'REJECTED').length}) cannot be selected
            </small>
          )}
        </div>
      )}

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
              <th>
                {supportsBulkOperations() ? (
                  <input
                    type="checkbox"
                    onChange={(e) => {
                      if (e.target.checked) {
                        handleSelectAll();
                      } else {
                        handleClearSelection();
                      }
                    }}
                    checked={filteredUsers.length > 0 && selectedUsers.length === filteredUsers.filter(user => user.status !== 'REJECTED').length}
                  />
                ) : (
                  <span style={{ width: '16px', display: 'inline-block' }}></span>
                )}
              </th>
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
                <td>
                  {supportsBulkOperations() ? (
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={() => handleSelectUser(user.id)}
                      disabled={user.status === 'REJECTED'}
                      title={user.status === 'REJECTED' ? 'Rejected users cannot be selected for bulk operations' : ''}
                    />
                  ) : (
                    <span style={{ width: '16px', display: 'inline-block' }}></span>
                  )}
                </td>
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
                  {user.status === 'REJECTED' ? (
                    // No actions available for rejected users
                    <span className="no-actions" title="No actions available for rejected users">
                      —
                    </span>
                  ) : (
                    <>
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
                    </>
                  )}
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
