import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';
import DiscussionThreadDetail from './DiscussionThreadDetail';
import './DiscussionThreads.css';

const DiscussionThreads = ({ courseId, user, onShowMessage }) => {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null);
  
  // Form states
  const [newThread, setNewThread] = useState({
    title: '',
    description: '',
    assignmentId: '',
    resourceName: '',
    isPinned: false
  });

  useEffect(() => {
    fetchThreads();
    fetchAssignments(); // Both teachers and students need to see assignment names
  }, [courseId]);

  const fetchThreads = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/discussions/course/${courseId}/threads?userId=${user.id}`);
      setThreads(response.data);
    } catch (error) {
      console.error('Error fetching discussion threads:', error);
      onShowMessage('Failed to load discussion threads', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async () => {
    try {
      const response = await axios.get(`/assignments/course/${courseId}`);
      setAssignments(response.data);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const handleCreateThread = async (e) => {
    e.preventDefault();
    
    if (!newThread.title.trim()) {
      onShowMessage('Thread title is required', 'error');
      return;
    }

    try {
      const threadData = {
        ...newThread,
        courseId: courseId,
        assignmentId: newThread.assignmentId || null
      };

      await axios.post(`/discussions/threads?teacherId=${user.id}`, threadData);
      
      onShowMessage('Discussion thread created successfully!', 'success');
      setShowCreateModal(false);
      setNewThread({
        title: '',
        description: '',
        assignmentId: '',
        resourceName: '',
        isPinned: false
      });
      fetchThreads();
    } catch (error) {
      console.error('Error creating thread:', error);
      onShowMessage(error.response?.data?.error || 'Failed to create discussion thread', 'error');
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchThreads();
      return;
    }

    try {
      const response = await axios.get(`/discussions/course/${courseId}/search?q=${encodeURIComponent(searchTerm)}&userId=${user.id}`);
      setThreads(response.data);
    } catch (error) {
      console.error('Error searching threads:', error);
      onShowMessage('Failed to search threads', 'error');
    }
  };

  const openThreadDetails = (thread) => {
    setSelectedThread(thread);
  };

  const closeThreadDetails = () => {
    setSelectedThread(null);
    fetchThreads(); // Refresh to get updated post counts
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAssignmentTitle = (assignmentId) => {
    if (!assignmentId) return null;
    const assignment = assignments.find(a => a.id === assignmentId);
    console.log('Looking for assignment:', assignmentId, 'in assignments:', assignments);
    return assignment ? assignment.title : 'Unknown Assignment';
  };

  if (loading) {
    return (
      <div className="discussion-loading">
        <div className="spinner"></div>
        <p>Loading discussions...</p>
      </div>
    );
  }

  if (selectedThread) {
    return (
      <DiscussionThreadDetail 
        thread={selectedThread}
        user={user}
        onBack={closeThreadDetails}
        onShowMessage={onShowMessage}
      />
    );
  }

  return (
    <div className="discussion-threads">
      {/* Header */}
      <div className="discussion-header">
        <div className="header-content">
          <h3>💬 Discussion Threads</h3>
          <p>Engage in course discussions and Q&A</p>
        </div>
        
        {user.role === 'TEACHER' && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            ➕ New Thread
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="discussion-search">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search discussions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="search-input"
          />
          <button onClick={handleSearch} className="search-btn">
            🔍
          </button>
        </div>
      </div>

      {/* Threads List */}
      <div className="threads-container">
        {threads.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">💬</span>
            <h4>No discussions yet</h4>
            <p>
              {user.role === 'TEACHER' 
                ? 'Create the first discussion thread to get conversations started!'
                : 'Your teacher hasn\'t created any discussion threads yet.'
              }
            </p>
          </div>
        ) : (
          <div className="threads-list">
            {threads.map(thread => (
              <div 
                key={thread.id} 
                className={`thread-card ${thread.isPinned ? 'pinned' : ''}`}
                onClick={() => openThreadDetails(thread)}
              >
                <div className="thread-header">
                  <div className="thread-title">
                    {thread.isPinned && <span className="pin-icon">📌</span>}
                    <h4>{thread.title}</h4>
                  </div>
                  <div className="thread-meta">
                    <span className="author">
                      👨‍🏫 {thread.createdByName}
                    </span>
                    <span className="date">
                      {formatDate(thread.createdAt)}
                    </span>
                  </div>
                </div>

                {thread.description && (
                  <p className="thread-description">{thread.description}</p>
                )}

                <div className="thread-tags">
                  {thread.assignmentId && (
                    <span className="tag assignment-tag">
                      📝 {getAssignmentTitle(thread.assignmentId)}
                    </span>
                  )}
                  {thread.resourceName && (
                    <span className="tag resource-tag">
                      📁 {thread.resourceName}
                    </span>
                  )}
                </div>

                <div className="thread-stats">
                  <span className="post-count">
                    💬 {thread.postCount} post{thread.postCount !== 1 ? 's' : ''}
                  </span>
                  <span className="last-activity">
                    🕒 Last activity: {formatDate(thread.lastActivityAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Thread Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Discussion Thread</h3>
              <button 
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateThread} className="thread-form">
              <div className="form-group">
                <label htmlFor="title">Thread Title *</label>
                <input
                  id="title"
                  type="text"
                  value={newThread.title}
                  onChange={(e) => setNewThread({...newThread, title: e.target.value})}
                  placeholder="Enter thread title..."
                  required
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  value={newThread.description}
                  onChange={(e) => setNewThread({...newThread, description: e.target.value})}
                  placeholder="Describe what this thread is about..."
                  rows="4"
                  className="form-control"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="assignment">Related Assignment</label>
                  <select
                    id="assignment"
                    value={newThread.assignmentId}
                    onChange={(e) => setNewThread({...newThread, assignmentId: e.target.value})}
                    className="form-control"
                  >
                    <option value="">-- No assignment --</option>
                    {assignments.map(assignment => (
                      <option key={assignment.id} value={assignment.id}>
                        {assignment.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="resource">Related Resource</label>
                  <input
                    id="resource"
                    type="text"
                    value={newThread.resourceName}
                    onChange={(e) => setNewThread({...newThread, resourceName: e.target.value})}
                    placeholder="e.g., Chapter 5, Lecture Notes..."
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newThread.isPinned}
                    onChange={(e) => setNewThread({...newThread, isPinned: e.target.checked})}
                  />
                  📌 Pin this thread (appears at top)
                </label>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Thread
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscussionThreads;
