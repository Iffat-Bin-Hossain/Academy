import React, { useState, useEffect } from 'react';

const ResourceEditModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  resource,
  topics = [],
  weeks = []
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    resourceType: 'FILE',
    topic: '',
    week: '',
    tags: '',
    url: '',
    noteContent: '',
    isVisible: true,
    isActive: true
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [replaceFile, setReplaceFile] = useState(false);
  const [resourceTypeChanged, setResourceTypeChanged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (resource && isOpen) {
      setFormData({
        title: resource.title || '',
        description: resource.description || '',
        resourceType: resource.resourceType || 'FILE',
        topic: resource.topic || '',
        week: resource.week || '',
        tags: resource.tags || '',
        url: resource.url || '',
        noteContent: resource.noteContent || '',
        isVisible: resource.isVisible !== false,
        isActive: resource.isActive !== false
      });
      setReplaceFile(false);
      setResourceTypeChanged(false);
      setSelectedFile(null);
      setErrors({});
    }
  }, [resource, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    // Check if resource type is being changed
    if (name === 'resourceType' && value !== resource?.resourceType) {
      setResourceTypeChanged(true);
      // Reset file-related states when type changes
      setSelectedFile(null);
      setReplaceFile(false);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    if (errors.file) {
      setErrors(prev => ({
        ...prev,
        file: ''
      }));
    }
  };

  const handleReplaceFileChange = (e) => {
    setReplaceFile(e.target.checked);
    if (!e.target.checked) {
      setSelectedFile(null);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    // Use current form data resource type for validation
    if (formData.resourceType === 'FILE' && (resourceTypeChanged || replaceFile) && !selectedFile) {
      newErrors.file = 'Please select a file';
    }

    if (formData.resourceType === 'LINK' && !formData.url.trim()) {
      newErrors.url = 'URL is required for link resources';
    }

    if (formData.resourceType === 'NOTE' && !formData.noteContent.trim()) {
      newErrors.noteContent = 'Note content is required';
    }

    // Validate URL format if provided
    if (formData.url && formData.resourceType === 'LINK') {
      const urlPattern = /^https?:\/\/.+/;
      if (!urlPattern.test(formData.url)) {
        newErrors.url = 'Please enter a valid URL (starting with http:// or https://)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        replaceFile: replaceFile,
        resourceTypeChanged: resourceTypeChanged
      };

      await onSubmit(resource.id, submitData, selectedFile, replaceFile || resourceTypeChanged);
      
      handleClose();
    } catch (error) {
      console.error('Error updating resource:', error);
      setErrors({ submit: 'Failed to update resource. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      resourceType: 'FILE',
      topic: '',
      week: '',
      tags: '',
      url: '',
      noteContent: '',
      isVisible: true,
      isActive: true
    });
    setSelectedFile(null);
    setReplaceFile(false);
    setResourceTypeChanged(false);
    setErrors({});
    onClose();
  };

  const getResourceTypeIcon = (type) => {
    switch (type) {
      case 'FILE': return '📁';
      case 'LINK': return '🔗';
      case 'NOTE': return '📝';
      default: return '📄';
    }
  };

  if (!isOpen || !resource) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content resource-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{getResourceTypeIcon(resource.resourceType)} Edit Resource</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="resource-form">
          {errors.submit && (
            <div className="submit-error">{errors.submit}</div>
          )}

          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={errors.title ? 'error' : ''}
              placeholder="Enter resource title"
            />
            {errors.title && <span className="error-message">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="resourceType">Resource Type *</label>
            <select
              id="resourceType"
              name="resourceType"
              value={formData.resourceType}
              onChange={handleInputChange}
              className="form-select"
            >
              <option value="FILE">📁 File Upload</option>
              <option value="LINK">🔗 External Link</option>
              <option value="NOTE">📝 Text Note</option>
            </select>
            {resourceTypeChanged && (
              <small className="type-change-info" style={{ color: '#f39c12', fontSize: '0.85rem' }}>
                ⚠️ Changing resource type will replace all current content
              </small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter resource description"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="topic">Topic</label>
              <select
                id="topic"
                name="topic"
                value={formData.topic}
                onChange={handleInputChange}
              >
                <option value="">Select topic</option>
                {topics.map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="week">Week</label>
              <select
                id="week"
                name="week"
                value={formData.week}
                onChange={handleInputChange}
              >
                <option value="">Select week</option>
                {weeks.map(week => (
                  <option key={week} value={week}>{week}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="tags">Tags</label>
            <input
              type="text"
              id="tags"
              name="tags"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="Enter tags separated by commas"
            />
          </div>

                    {/* Resource Type Specific Fields */}
          {formData.resourceType === 'FILE' && (
            <div className="form-section">
              <h3>File Resource</h3>
              
              {!resourceTypeChanged && resource.resourceType === 'FILE' && (
                <div className="current-file-info">
                  <h4>Current File</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>📎</span>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{resource.originalFilename}</div>
                      <div style={{ fontSize: '0.9rem', color: '#666' }}>
                        Size: {Math.round(resource.fileSize / 1024)} KB
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={replaceFile}
                        onChange={handleReplaceFileChange}
                      />
                      Replace current file
                    </label>
                  </div>
                </div>
              )}

              {(resourceTypeChanged || replaceFile || resource.resourceType !== 'FILE') && (
                <div className="form-group">
                  <label htmlFor="file">Select File *</label>
                  <input
                    type="file"
                    id="file"
                    onChange={handleFileChange}
                    className={errors.file ? 'error' : ''}
                    accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.mp4,.avi,.mov"
                  />
                  {errors.file && <span className="error-message">{errors.file}</span>}
                  <small className="file-info">
                    Supported formats: PDF, DOC, PPT, Images, Videos (Max 50MB)
                  </small>
                </div>
              )}
            </div>
          )}

          {formData.resourceType === 'LINK' && (
            <div className="form-section">
              <h3>Link Resource</h3>
              <div className="form-group">
                <label htmlFor="url">URL *</label>
                <input
                  type="url"
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  className={errors.url ? 'error' : ''}
                  placeholder="https://example.com"
                />
                {errors.url && <span className="error-message">{errors.url}</span>}
              </div>
            </div>
          )}

          {formData.resourceType === 'NOTE' && (
            <div className="form-section">
              <h3>Note Resource</h3>
              <div className="form-group">
                <label htmlFor="noteContent">Note Content *</label>
                <textarea
                  id="noteContent"
                  name="noteContent"
                  value={formData.noteContent}
                  onChange={handleInputChange}
                  className={errors.noteContent ? 'error' : ''}
                  placeholder="Enter your note content here..."
                  rows="8"
                />
                {errors.noteContent && <span className="error-message">{errors.noteContent}</span>}
              </div>
            </div>
          )}

          <div className="form-section">
            <h3>Visibility Settings</h3>
            <div className="form-row">
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="isVisible"
                    checked={formData.isVisible}
                    onChange={handleInputChange}
                  />
                  Visible to students
                </label>
              </div>

              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleInputChange}
                  />
                  Active resource
                </label>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Updating...' : 'Update Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourceEditModal;
