import React from 'react';
import { 
  FiFileText, 
  FiFolder, 
  FiLink, 
  FiFile, 
  FiTag, 
  FiCalendar, 
  FiEdit3, 
  FiTrash2, 
  FiDownload, 
  FiEye, 
  FiUser, 
  FiExternalLink 
} from 'react-icons/fi';

const ResourceCard = ({ 
  resource, 
  user, 
  onEdit, 
  onDelete, 
  onDownload, 
  onView,
  viewMode = 'grid' 
}) => {
  const handleCardClick = () => {
    if (onView) {
      onView(resource);
    }
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    if (onDownload) {
      onDownload(resource);
    }
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(resource);
    }
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(resource);
    }
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'FILE':
        return <FiFile style={{ fontSize: '1.5rem', color: '#3b82f6' }} />;
      case 'LINK':
        return <FiLink style={{ fontSize: '1.5rem', color: '#10b981' }} />;
      case 'NOTE':
        return <FiFileText style={{ fontSize: '1.5rem', color: '#f59e0b' }} />;
      default:
        return <FiFile style={{ fontSize: '1.5rem', color: '#64748b' }} />;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isTeacher = user?.role === 'TEACHER';
  const cardClassName = viewMode === 'list' ? 'resource-card-list' : 'resource-card-grid';

  return (
    <div className={`resource-card ${cardClassName}`} onClick={handleCardClick}>
      <div className="resource-card-header">
        <div className="resource-icon">
          {getResourceIcon(resource.resourceType)}
        </div>
        <div className="resource-meta">
          <h3 className="resource-title">{resource.title}</h3>
          <div className="resource-info">
            <span className="resource-type">{resource.resourceType}</span>
            {resource.topic && <span className="resource-topic" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><FiTag /> {resource.topic}</span>}
            {resource.week && <span className="resource-week" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><FiCalendar /> Week {resource.week}</span>}
          </div>
        </div>
        {isTeacher && (
          <div className="resource-actions">
            <button 
              className="action-btn edit-btn" 
              onClick={handleEdit}
              title="Edit Resource"
            >
              <FiEdit3 />
            </button>
            <button 
              className="action-btn delete-btn" 
              onClick={handleDelete}
              title="Delete Resource"
            >
              <FiTrash2 />
            </button>
          </div>
        )}
      </div>

      <div className="resource-content">
        {resource.description && (
          <p className="resource-description">{resource.description}</p>
        )}
        
        {resource.resourceType === 'FILE' && resource.fileSize && (
          <div className="file-info">
            <span className="file-size">{formatFileSize(resource.fileSize)}</span>
            {resource.originalFilename && (
              <span className="file-name">{resource.originalFilename}</span>
            )}
          </div>
        )}

        {resource.resourceType === 'LINK' && resource.url && (
          <div className="link-info">
            <a 
              href={resource.url} 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="resource-link"
            >
              Open Link
            </a>
          </div>
        )}

        {resource.resourceType === 'NOTE' && resource.noteContent && (
          <div className="note-preview">
            <p className="note-content">
              {resource.noteContent.length > 150 
                ? `${resource.noteContent.substring(0, 150)}...` 
                : resource.noteContent
              }
            </p>
          </div>
        )}

        {resource.tags && (
          <div className="resource-tags">
            {resource.tags.split(',').map((tag, index) => (
              <span key={index} className="tag">
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="resource-footer">
        <div className="resource-stats">
          <span className="stat" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><FiEye /> {resource.viewCount || 0}</span>
          {resource.resourceType === 'FILE' && (
            <span className="stat" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><FiDownload /> {resource.downloadCount || 0}</span>
          )}
          <span className="stat" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}><FiCalendar /> {formatDate(resource.createdAt)}</span>
        </div>
        
        {resource.resourceType === 'FILE' && (
          <button 
            className="download-btn"
            onClick={handleDownload}
            title="Download File"
          >
            Download
          </button>
        )}
      </div>

      {resource.uploadedBy && (
        <div className="resource-author">
          {resource.uploadedBy.firstName} {resource.uploadedBy.lastName}
        </div>
      )}
    </div>
  );
};

export default ResourceCard;
