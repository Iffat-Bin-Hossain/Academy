import React, { useState } from 'react';

const ResourceCreateModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  courseId,
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
    visibleFrom: '',
    visibleUntil: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (formData.resourceType === 'FILE' && !selectedFile) {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        courseId: parseInt(courseId)
      };

      await onSubmit(submitData, selectedFile);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        resourceType: 'FILE',
        topic: '',
        week: '',
        tags: '',
        url: '',
        noteContent: '',
        visibleFrom: '',
        visibleUntil: ''
      });
      setSelectedFile(null);
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error creating resource:', error);
      setErrors({ submit: 'Failed to create resource. Please try again.' });
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
      visibleFrom: '',
      visibleUntil: ''
    });
    setSelectedFile(null);
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content resource-create-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Resource</h2>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="resource-form">
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
              <option value="FILE">File Upload</option>
              <option value="LINK">External Link</option>
              <option value="NOTE">Text Note</option>
            </select>
          </div>

          {formData.resourceType === 'FILE' && (
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

          {formData.resourceType === 'LINK' && (
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
          )}

          {formData.resourceType === 'NOTE' && (
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
          )}

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Brief description of the resource"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="topic">Topic</label>
              <input
                type="text"
                id="topic"
                name="topic"
                value={formData.topic}
                onChange={handleInputChange}
                placeholder="e.g., Introduction, Advanced Concepts"
                list="topics-list"
              />
              <datalist id="topics-list">
                {topics.map((topic, index) => (
                  <option key={index} value={topic} />
                ))}
              </datalist>
            </div>

            <div className="form-group">
              <label htmlFor="week">Week</label>
              <input
                type="text"
                id="week"
                name="week"
                value={formData.week}
                onChange={handleInputChange}
                placeholder="e.g., 1, 2, 3"
                list="weeks-list"
              />
              <datalist id="weeks-list">
                {weeks.map((week, index) => (
                  <option key={index} value={week} />
                ))}
              </datalist>
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
              placeholder="Comma-separated tags (e.g., important, homework, tutorial)"
            />
          </div>

          <div className="form-section">
            <h3>Visibility Settings (Optional)</h3>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="visibleFrom">Available From</label>
                <input
                  type="datetime-local"
                  id="visibleFrom"
                  name="visibleFrom"
                  value={formData.visibleFrom}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label htmlFor="visibleUntil">Available Until</label>
                <input
                  type="datetime-local"
                  id="visibleUntil"
                  name="visibleUntil"
                  value={formData.visibleUntil}
                  onChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          {errors.submit && (
            <div className="error-message submit-error">{errors.submit}</div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={handleClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Resource'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResourceCreateModal;
