import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';
import ResourceCard from './ResourceCard';
import ResourceCreateModal from './ResourceCreateModal';
import './ResourceManagement.css';

const ResourceManagement = ({ courseId, user, onShowMessage }) => {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [selectedWeek, setSelectedWeek] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [topics, setTopics] = useState([]);
  const [weeks, setWeeks] = useState([]);
  
  // View modes
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'name', 'mostViewed'

  useEffect(() => {
    fetchResources();
    fetchTopics();
    fetchWeeks();
  }, [courseId, selectedTopic, selectedWeek, selectedType]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      let url = `/resources/course/${courseId}?userId=${user.id}`;
      
      // Add filters if any are selected
      const filters = [];
      if (selectedTopic) filters.push(`topic=${encodeURIComponent(selectedTopic)}`);
      if (selectedWeek) filters.push(`week=${encodeURIComponent(selectedWeek)}`);
      if (selectedType) filters.push(`type=${selectedType}`);
      
      if (filters.length > 0) {
        url = `/resources/course/${courseId}/filter?userId=${user.id}&${filters.join('&')}`;
      }
      
      const response = await axios.get(url);
      setResources(response.data);
    } catch (error) {
      console.error('Error fetching resources:', error);
      onShowMessage('Failed to load resources', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const response = await axios.get(`/resources/course/${courseId}/topics`);
      setTopics(response.data);
    } catch (error) {
      console.error('Error fetching topics:', error);
    }
  };

  const fetchWeeks = async () => {
    try {
      const response = await axios.get(`/resources/course/${courseId}/weeks`);
      setWeeks(response.data);
    } catch (error) {
      console.error('Error fetching weeks:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchResources();
      return;
    }

    try {
      setLoading(true);
      const response = await axios.get(`/resources/course/${courseId}/search?userId=${user.id}&q=${encodeURIComponent(searchTerm)}`);
      setResources(response.data);
    } catch (error) {
      console.error('Error searching resources:', error);
      onShowMessage('Failed to search resources', 'error');
    } finally {
      setLoading(false);
    }
  };

  const createResource = async (resourceData, file) => {
    try {
      let response;
      
      if (resourceData.resourceType === 'FILE' && file) {
        // Create form data for file upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', resourceData.title);
        formData.append('courseId', resourceData.courseId);
        formData.append('teacherId', user.id);
        formData.append('description', resourceData.description || '');
        formData.append('topic', resourceData.topic || '');
        formData.append('week', resourceData.week || '');
        formData.append('tags', resourceData.tags || '');
        formData.append('isVisible', resourceData.isVisible !== false);
        if (resourceData.visibleFrom) formData.append('visibleFrom', resourceData.visibleFrom);
        if (resourceData.visibleUntil) formData.append('visibleUntil', resourceData.visibleUntil);
        
        response = await axios.post('/resources/file', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else if (resourceData.resourceType === 'LINK') {
        // Create link resource
        const linkData = {
          ...resourceData,
        };
        response = await axios.post(`/resources/link?teacherId=${user.id}`, linkData);
      } else if (resourceData.resourceType === 'NOTE') {
        // Create note resource
        const noteData = {
          ...resourceData,
        };
        response = await axios.post(`/resources/note?teacherId=${user.id}`, noteData);
      }
      
      // Refresh data after successful creation
      fetchResources();
      fetchTopics();
      fetchWeeks();
      onShowMessage('Resource created successfully!', 'success');
      
      return response.data;
    } catch (error) {
      console.error('Error creating resource:', error);
      throw error;
    }
  };

  const handleResourceView = async (resource) => {
    try {
      // Increment view count
      await axios.get(`/resources/${resource.id}?userId=${user.id}`);
      // Refresh resources to update view count
      fetchResources();
    } catch (error) {
      console.error('Error viewing resource:', error);
    }
  };

  const handleResourceDownload = async (resource) => {
    try {
      const response = await axios.get(`/resources/${resource.id}/download?userId=${user.id}`, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', resource.originalFilename || resource.title);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      // Refresh resources to update download count
      fetchResources();
      onShowMessage('File downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error downloading resource:', error);
      onShowMessage('Failed to download file', 'error');
    }
  };

  const handleResourceEdit = (resource) => {
    // TODO: Implement edit functionality
    onShowMessage('Edit functionality coming soon!', 'info');
  };

  const handleResourceDelete = async (resource) => {
    if (window.confirm(`Are you sure you want to delete "${resource.title}"?`)) {
      try {
        await axios.delete(`/resources/${resource.id}?teacherId=${user.id}`);
        fetchResources();
        fetchTopics();
        fetchWeeks();
        onShowMessage('Resource deleted successfully!', 'success');
      } catch (error) {
        console.error('Error deleting resource:', error);
        onShowMessage('Failed to delete resource', 'error');
      }
    }
  };

  const handleResourceCreated = () => {
    setShowCreateModal(false);
    fetchResources();
    fetchTopics();
    fetchWeeks();
    onShowMessage('Resource created successfully!', 'success');
  };

  const handleResourceDeleted = () => {
    fetchResources();
    fetchTopics();
    fetchWeeks();
    onShowMessage('Resource deleted successfully!', 'success');
  };

  const clearFilters = () => {
    setSelectedTopic('');
    setSelectedWeek('');
    setSelectedType('');
    setSearchTerm('');
  };

  const getSortedResources = () => {
    const sorted = [...resources];
    
    switch (sortBy) {
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case 'name':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'mostViewed':
        return sorted.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
      case 'newest':
      default:
        return sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  };

  const getResourceTypeIcon = (type) => {
    switch (type) {
      case 'FILE': return '📁';
      case 'LINK': return '🔗';
      case 'NOTE': return '📝';
      default: return '📄';
    }
  };

  if (loading) {
    return (
      <div className="resource-loading">
        <div className="spinner"></div>
        <p>Loading resources...</p>
      </div>
    );
  }

  const sortedResources = getSortedResources();

  return (
    <div className="resource-management">
      {/* Header */}
      <div className="resource-header">
        <div className="header-content">
          <h3>📚 Learning Resources</h3>
          <p>Access course materials, links, and notes</p>
        </div>
        
        {user.role === 'TEACHER' && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            ➕ Add Resource
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="resource-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search resources..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="search-input"
          />
          <button onClick={handleSearch} className="search-btn">
            🔍
          </button>
        </div>

        <div className="filters-container">
          <select
            value={selectedTopic}
            onChange={(e) => setSelectedTopic(e.target.value)}
            className="filter-select"
          >
            <option value="">All Topics</option>
            {topics.map(topic => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>

          <select
            value={selectedWeek}
            onChange={(e) => setSelectedWeek(e.target.value)}
            className="filter-select"
          >
            <option value="">All Weeks</option>
            {weeks.map(week => (
              <option key={week} value={week}>{week}</option>
            ))}
          </select>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="FILE">📁 Files</option>
            <option value="LINK">🔗 Links</option>
            <option value="NOTE">📝 Notes</option>
          </select>

          {(selectedTopic || selectedWeek || selectedType || searchTerm) && (
            <button onClick={clearFilters} className="clear-filters-btn">
              ✕ Clear
            </button>
          )}
        </div>

        <div className="view-controls">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="sort-select"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name">Name A-Z</option>
            <option value="mostViewed">Most Viewed</option>
          </select>

          <div className="view-mode-toggle">
            <button
              className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              ⚏
            </button>
            <button
              className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Filter Summary */}
      {(selectedTopic || selectedWeek || selectedType || searchTerm) && (
        <div className="filter-summary">
          <span>Filters: </span>
          {searchTerm && <span className="filter-tag">Search: "{searchTerm}"</span>}
          {selectedTopic && <span className="filter-tag">Topic: {selectedTopic}</span>}
          {selectedWeek && <span className="filter-tag">Week: {selectedWeek}</span>}
          {selectedType && (
            <span className="filter-tag">
              Type: {getResourceTypeIcon(selectedType)} {selectedType}
            </span>
          )}
        </div>
      )}

      {/* Resources Grid/List */}
      <div className="resources-container">
        {sortedResources.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📚</span>
            <h4>No resources found</h4>
            <p>
              {(selectedTopic || selectedWeek || selectedType || searchTerm) 
                ? 'Try adjusting your filters or search terms.'
                : user.role === 'TEACHER' 
                  ? 'Add the first learning resource to get started!'
                  : 'Your teacher hasn\'t added any resources yet.'
              }
            </p>
          </div>
        ) : (
          <div className={`resources-${viewMode}`}>
            {sortedResources.map(resource => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                user={user}
                viewMode={viewMode}
                onView={handleResourceView}
                onDownload={handleResourceDownload}
                onEdit={handleResourceEdit}
                onDelete={handleResourceDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Resource Modal */}
      {showCreateModal && (
        <ResourceCreateModal
          isOpen={showCreateModal}
          courseId={courseId}
          onClose={() => setShowCreateModal(false)}
          onSubmit={createResource}
          topics={topics}
          weeks={weeks}
        />
      )}
    </div>
  );
};

export default ResourceManagement;
