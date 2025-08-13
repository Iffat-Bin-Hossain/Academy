import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';

const AssignmentManagement = ({ user, courses, onShowMessage }) => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Local message state for modal errors
  const [modalMessage, setModalMessage] = useState('');
  const [modalMessageType, setModalMessageType] = useState('');
  
  // Assignment form data
  const [assignmentForm, setAssignmentForm] = useState({
    title: '',
    content: '',
    maxMarks: '',
    courseId: '',
    deadline: '',
    lateSubmissionDeadline: '',
    instructions: '',
    assignmentType: 'HOMEWORK'
  });

  // File upload state
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // URL attachment state
  const [urlAttachments, setUrlAttachments] = useState([]);
  
  // Edit mode file management state
  const [existingFiles, setExistingFiles] = useState([]);
  const [filesToDelete, setFilesToDelete] = useState([]);

  // Date validation state
  const [dateErrors, setDateErrors] = useState({
    deadline: '',
    lateSubmissionDeadline: ''
  });

  // Submission viewing state
  const [showSubmissionsModal, setShowSubmissionsModal] = useState(false);
  const [viewingAssignment, setViewingAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, [courses, selectedCourse]);

  // Helper function to show modal messages
  const showModalMessage = (text, type = 'info') => {
    setModalMessage(text);
    setModalMessageType(type);
    setTimeout(() => {
      setModalMessage('');
      setModalMessageType('');
    }, 5000);
  };

  // Helper function to clear modal messages
  const clearModalMessage = () => {
    setModalMessage('');
    setModalMessageType('');
  };

  // Helper functions to close modals and clear messages
  const closeCreateModal = () => {
    setShowCreateModal(false);
    clearModalMessage();
    resetForm();
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingAssignment(null);
    clearModalMessage();
    resetForm();
  };

  const openCreateModal = () => {
    clearModalMessage(); // Clear any existing modal messages
    resetForm(); // Reset form to default values
    setShowCreateModal(true);
  };

  // Helper function to format date for datetime-local input (no timezone conversion)
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    // Simply format the date without any timezone adjustments
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Helper function to convert datetime-local input to ISO string (no timezone conversion)
  const convertInputDateToISO = (inputDateString) => {
    if (!inputDateString) return null;
    // Keep the exact datetime as entered
    return new Date(inputDateString).toISOString();
  };

  // Date validation functions
  const validateDeadlineDate = (deadlineValue, lateDeadlineValue = assignmentForm.lateSubmissionDeadline) => {
    const errors = { ...dateErrors };
    
    if (deadlineValue) {
      const deadlineDate = new Date(deadlineValue);
      const now = new Date();
      
      if (deadlineDate <= now) {
        errors.deadline = 'Deadline must be in the future';
      } else {
        errors.deadline = '';
      }
      
      // Check against late submission deadline
      if (lateDeadlineValue) {
        const lateDate = new Date(lateDeadlineValue);
        if (lateDate <= deadlineDate) {
          errors.lateSubmissionDeadline = 'Late submission deadline must be after main deadline';
        } else {
          errors.lateSubmissionDeadline = '';
        }
      }
    } else {
      errors.deadline = '';
    }
    
    setDateErrors(errors);
    return !errors.deadline && !errors.lateSubmissionDeadline;
  };

  const validateLateDeadlineDate = (lateDeadlineValue, deadlineValue = assignmentForm.deadline) => {
    const errors = { ...dateErrors };
    
    if (lateDeadlineValue && deadlineValue) {
      const deadlineDate = new Date(deadlineValue);
      const lateDate = new Date(lateDeadlineValue);
      
      if (lateDate <= deadlineDate) {
        errors.lateSubmissionDeadline = 'Late submission deadline must be after main deadline';
      } else {
        errors.lateSubmissionDeadline = '';
      }
    } else {
      errors.lateSubmissionDeadline = '';
    }
    
    setDateErrors(errors);
    return !errors.deadline && !errors.lateSubmissionDeadline;
  };

  // File upload functions
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const removeSelectedFile = (index) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileDownload = async (fileId, filename) => {
    try {
      const response = await axios.get(`/assignments/files/${fileId}/download`, {
        responseType: 'blob',
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      showModalMessage('Failed to download file', 'error');
    }
  };

  // URL attachment functions
  const addUrlAttachment = () => {
    setUrlAttachments([...urlAttachments, { url: '', title: '', description: '' }]);
  };

  const removeUrlAttachment = (index) => {
    const newUrls = urlAttachments.filter((_, i) => i !== index);
    setUrlAttachments(newUrls);
  };

  const updateUrlAttachment = (index, field, value) => {
    const newUrls = [...urlAttachments];
    newUrls[index][field] = value;
    setUrlAttachments(newUrls);
  };

  // File management functions for edit mode
  const markFileForDeletion = (fileId) => {
    if (!filesToDelete.includes(fileId)) {
      setFilesToDelete([...filesToDelete, fileId]);
    }
  };

  const unmarkFileForDeletion = (fileId) => {
    setFilesToDelete(filesToDelete.filter(id => id !== fileId));
  };

  const isFileMarkedForDeletion = (fileId) => {
    return filesToDelete.includes(fileId);
  };

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf': return '📄';
      case 'doc':
      case 'docx': return '📝';
      case 'txt': return '📃';
      case 'zip':
      case 'rar': return '📦';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'bmp': return '🖼️';
      case 'java':
      case 'py':
      case 'js':
      case 'html':
      case 'css':
      case 'cpp':
      case 'c':
      case 'cs': return '💻';
      default: return '📎';
    }
  };

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      let allAssignments = [];

      if (selectedCourse) {
        // Fetch assignments for specific course (teachers see all assignments)
        const response = await axios.get(`/assignments/course/${selectedCourse}`);
        allAssignments = response.data || [];
      } else {
        // Fetch assignments for all teacher's courses (teachers see all assignments)
        const promises = courses.map(course => 
          axios.get(`/assignments/course/${course.id}`)
            .then(response => response.data?.map(assignment => ({
              ...assignment,
              courseName: course.title,
              courseCode: course.courseCode
            })) || [])
            .catch(error => {
              console.error(`Error fetching assignments for course ${course.id}:`, error);
              return [];
            })
        );
        
        const results = await Promise.all(promises);
        allAssignments = results.flat();
      }

      // Fetch attachments for each assignment
      const assignmentsWithAttachments = await Promise.all(
        allAssignments.map(async (assignment) => {
          try {
            const attachmentsResponse = await axios.get(`/assignments/${assignment.id}/files`);
            return {
              ...assignment,
              attachments: attachmentsResponse.data || []
            };
          } catch (attachmentError) {
            console.warn(`Could not fetch attachments for assignment ${assignment.id}:`, attachmentError);
            return {
              ...assignment,
              attachments: []
            };
          }
        })
      );

      setAssignments(assignmentsWithAttachments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      onShowMessage('Failed to load assignments', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    clearModalMessage(); // Clear any previous error messages
    
    if (!assignmentForm.title || !assignmentForm.content || !assignmentForm.maxMarks || 
        !assignmentForm.courseId || !assignmentForm.deadline) {
      showModalMessage('Please fill in all required fields', 'error');
      return;
    }

    // Validate dates
    if (!validateDeadlineDate(assignmentForm.deadline, assignmentForm.lateSubmissionDeadline)) {
      showModalMessage('Please fix the date validation errors', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const deadline = new Date(assignmentForm.deadline);
      const lateDeadline = assignmentForm.lateSubmissionDeadline 
        ? new Date(assignmentForm.lateSubmissionDeadline)
        : new Date(deadline.getTime() + 2 * 24 * 60 * 60 * 1000); // Default: 2 days after main deadline

      const data = {
        title: assignmentForm.title,
        content: assignmentForm.content,
        maxMarks: parseInt(assignmentForm.maxMarks),
        courseId: parseInt(assignmentForm.courseId),
        deadline: convertInputDateToISO(assignmentForm.deadline),
        lateSubmissionDeadline: assignmentForm.lateSubmissionDeadline ? 
          convertInputDateToISO(assignmentForm.lateSubmissionDeadline) : 
          lateDeadline.toISOString(),
        instructions: assignmentForm.instructions || '',
        assignmentType: assignmentForm.assignmentType
      };

      const response = await axios.post(`/assignments?teacherId=${user.id}`, data);
      const assignmentId = response.data.id;

      // Upload files if any are selected
      if (selectedFiles.length > 0) {
        setIsUploading(true);
        try {
          const formData = new FormData();
          selectedFiles.forEach(file => {
            formData.append('files', file);
          });

          await axios.post(`/assignments/${assignmentId}/files?teacherId=${user.id}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } catch (uploadError) {
          console.error('Error uploading files:', uploadError);
          showModalMessage('Assignment created but some files failed to upload', 'warning');
        } finally {
          setIsUploading(false);
        }
      }

      // Add URL attachments if any
      if (urlAttachments.length > 0) {
        try {
          for (const urlAttachment of urlAttachments) {
            if (urlAttachment.url.trim()) {
              const urlData = new URLSearchParams();
              urlData.append('url', urlAttachment.url);
              urlData.append('title', urlAttachment.title || 'Link');
              urlData.append('description', urlAttachment.description || '');
              urlData.append('teacherId', user.id);

              await axios.post(`/assignments/${assignmentId}/url`, urlData);
            }
          }
        } catch (urlError) {
          console.error('Error adding URL attachments:', urlError);
          showModalMessage('Assignment created but some URLs failed to attach', 'warning');
        }
      }
      
      onShowMessage('Assignment created successfully!', 'success');
      closeCreateModal();
      fetchAssignments();
    } catch (error) {
      console.error('Error creating assignment:', error);
      showModalMessage(error.response?.data?.error || 'Failed to create assignment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAssignment = async (e) => {
    e.preventDefault();
    clearModalMessage(); // Clear any previous error messages
    
    if (!assignmentForm.title || !assignmentForm.content || !assignmentForm.maxMarks || 
        !assignmentForm.deadline) {
      showModalMessage('Please fill in all required fields', 'error');
      return;
    }

    // Validate dates
    if (!validateDeadlineDate(assignmentForm.deadline, assignmentForm.lateSubmissionDeadline)) {
      showModalMessage('Please fix the date validation errors', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const deadline = new Date(assignmentForm.deadline);
      const lateDeadline = assignmentForm.lateSubmissionDeadline 
        ? new Date(assignmentForm.lateSubmissionDeadline)
        : new Date(deadline.getTime() + 2 * 24 * 60 * 60 * 1000);

      const data = {
        title: assignmentForm.title,
        content: assignmentForm.content,
        maxMarks: parseInt(assignmentForm.maxMarks),
        deadline: convertInputDateToISO(assignmentForm.deadline),
        lateSubmissionDeadline: assignmentForm.lateSubmissionDeadline ? 
          convertInputDateToISO(assignmentForm.lateSubmissionDeadline) : 
          lateDeadline.toISOString(),
        instructions: assignmentForm.instructions || '',
        assignmentType: assignmentForm.assignmentType
      };

      await axios.put(`/assignments/${editingAssignment.id}?teacherId=${user.id}`, data);

      // Handle file attachments update if there are changes
      if (selectedFiles.length > 0 || filesToDelete.length > 0 || urlAttachments.length > 0) {
        try {
          const formData = new FormData();
          
          // Add new files
          selectedFiles.forEach(file => {
            formData.append('newFiles', file);
          });

          // Add files to delete
          filesToDelete.forEach(fileId => {
            formData.append('filesToDelete', fileId);
          });

          // Add URL attachments
          const validUrls = urlAttachments.filter(url => url.url.trim());
          if (validUrls.length > 0) {
            validUrls.forEach(url => {
              formData.append('urlsToAdd', url.url);
              formData.append('urlTitles', url.title || 'Link');
              formData.append('urlDescriptions', url.description || '');
            });
          }

          formData.append('teacherId', user.id);

          await axios.put(`/assignments/${editingAssignment.id}/files`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } catch (fileError) {
          console.error('Error updating files:', fileError);
          showModalMessage('Assignment updated but some file changes failed', 'warning');
        }
      }
      
      onShowMessage('Assignment updated successfully!', 'success');
      closeEditModal();
      fetchAssignments();
    } catch (error) {
      console.error('Error updating assignment:', error);
      showModalMessage(error.response?.data?.error || 'Failed to update assignment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to delete this assignment? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`/assignments/${assignmentId}?teacherId=${user.id}`);
      onShowMessage('Assignment deleted successfully!', 'success');
      fetchAssignments();
    } catch (error) {
      console.error('Error deleting assignment:', error);
      onShowMessage(error.response?.data?.error || 'Failed to delete assignment', 'error');
    }
  };

  // Submission viewing functions
  const openSubmissionsModal = async (assignment) => {
    setViewingAssignment(assignment);
    setLoadingSubmissions(true);
    setShowSubmissionsModal(true);
    
    try {
      const response = await axios.get(`/submissions/assignment/${assignment.id}?teacherId=${user.id}`);
      setSubmissions(response.data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      onShowMessage('Failed to load submissions', 'error');
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  const closeSubmissionsModal = () => {
    setShowSubmissionsModal(false);
    setViewingAssignment(null);
    setSubmissions([]);
  };

  const handleSubmissionFileDownload = async (fileId, filename) => {
    try {
      const response = await axios.get(`/submissions/files/${fileId}/download`, {
        responseType: 'blob',
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading submission file:', error);
      onShowMessage('Failed to download submission file', 'error');
    }
  };

  const openEditModal = async (assignment) => {
    clearModalMessage(); // Clear any existing modal messages
    setDateErrors({ deadline: '', lateSubmissionDeadline: '' }); // Clear date errors
    setEditingAssignment(assignment);
    setAssignmentForm({
      title: assignment.title,
      content: assignment.content,
      maxMarks: assignment.maxMarks.toString(),
      courseId: assignment.courseId?.toString() || '',
      deadline: formatDateForInput(assignment.deadline),
      lateSubmissionDeadline: formatDateForInput(assignment.lateSubmissionDeadline),
      instructions: assignment.instructions || '',
      assignmentType: assignment.assignmentType || 'HOMEWORK'
    });

    // Load existing files for editing
    try {
      const filesResponse = await axios.get(`/assignments/${assignment.id}/files`);
      setExistingFiles(filesResponse.data || []);
      setFilesToDelete([]);
      setSelectedFiles([]);
      setUrlAttachments([]);
    } catch (error) {
      console.error('Error loading assignment files:', error);
      setExistingFiles([]);
    }

    setShowEditModal(true);
  };

  const resetForm = () => {
    setAssignmentForm({
      title: '',
      content: '',
      maxMarks: '',
      courseId: '',
      deadline: '',
      lateSubmissionDeadline: '',
      instructions: '',
      assignmentType: 'HOMEWORK'
    });
    setSelectedFiles([]);
    setUrlAttachments([]);
    setExistingFiles([]);
    setFilesToDelete([]);
    setDateErrors({
      deadline: '',
      lateSubmissionDeadline: ''
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    // Display date exactly as stored without any timezone conversion
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDetailedDateTime = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const isAssignmentDeadlinePassed = (assignment) => {
    const now = new Date();
    const effectiveDeadline = assignment.lateSubmissionDeadline ? 
                             new Date(assignment.lateSubmissionDeadline) : 
                             new Date(assignment.deadline);
    return now > effectiveDeadline;
  };

  const handleCopyCheckerClick = (assignment) => {
    if (!isAssignmentDeadlinePassed(assignment)) {
      const effectiveDeadline = assignment.lateSubmissionDeadline ? 
                               assignment.lateSubmissionDeadline : 
                               assignment.deadline;
      const deadlineType = assignment.lateSubmissionDeadline ? 'late submission deadline' : 'main deadline';
      
      onShowMessage(
        `⚠️ Copy Checker Not Available Yet\n\nThe copy checker can only be run after the assignment ${deadlineType} has passed.\n\n📅 ${deadlineType.charAt(0).toUpperCase() + deadlineType.slice(1)}: ${formatDetailedDateTime(effectiveDeadline)}\n\nPlease wait until after this time to run plagiarism detection.`, 
        'warning'
      );
      return;
    }
    
    // Create URL-safe assignment name
    const assignmentName = assignment.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    navigate(`/teacher/assignment/${assignment.id}/${assignmentName}/plagiarism`);
  };

  const getFilteredAssignments = () => {
    if (!searchTerm) return assignments;
    
    return assignments.filter(assignment => 
      assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.courseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.courseCode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const getAssignmentStats = () => {
    const now = new Date();
    const upcoming = assignments.filter(a => new Date(a.deadline) > now).length;
    const overdue = assignments.filter(a => new Date(a.deadline) < now).length;
    const total = assignments.length;
    
    return { total, upcoming, overdue };
  };

  const stats = getAssignmentStats();
  const filteredAssignments = getFilteredAssignments();

  if (loading) {
    return (
      <div className="card">
        <div className="card-body">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="spinner"></div>
            <p>Loading assignments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Assignment Stats */}
      <div className="stats-grid" style={{ marginBottom: '2rem' }}>
        <div className="stat-card">
          <span className="stat-icon">📝</span>
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">Total Assignments</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⏰</span>
          <div className="stat-value">{stats.upcoming}</div>
          <div className="stat-label">Upcoming</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⚠️</span>
          <div className="stat-value">{stats.overdue}</div>
          <div className="stat-label">Overdue</div>
        </div>
      </div>

      {/* Main Assignment Management Card */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <h3 className="card-title">Assignment Management</h3>
              <p className="card-subtitle">
                {filteredAssignments.length} of {assignments.length} assignments {searchTerm && '(filtered)'}
              </p>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <select
                className="form-control"
                value={selectedCourse}
                onChange={(e) => setSelectedCourse(e.target.value)}
                style={{ minWidth: '150px' }}
              >
                <option value="">All Courses</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.courseCode} - {course.title}
                  </option>
                ))}
              </select>
              <input
                type="text"
                className="form-control"
                placeholder="🔍 Search assignments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: '0.875rem', minWidth: '250px' }}
              />
              <button 
                className="btn btn-primary"
                onClick={openCreateModal}
                style={{ whiteSpace: 'nowrap' }}
              >
                <span style={{ marginRight: '0.5rem' }}>➕</span>
                Create Assignment
              </button>
            </div>
          </div>
        </div>
        <div className="card-body">
          {filteredAssignments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              {assignments.length === 0 ? (
                <>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📝</span>
                  <h4>No assignments yet</h4>
                  <p>Create your first assignment to get started.</p>
                </>
              ) : (
                <>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>🔍</span>
                  <h4>No assignments found</h4>
                  <p>No assignments match your search criteria.</p>
                </>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredAssignments.map(assignment => {
                const deadline = new Date(assignment.deadline);
                const isOverdue = deadline < new Date();
                const lateDeadline = assignment.lateSubmissionDeadline ? new Date(assignment.lateSubmissionDeadline) : null;
                const isLateAllowed = lateDeadline && lateDeadline > new Date();
                
                return (
                  <div 
                    key={assignment.id} 
                    className="card" 
                    style={{ 
                      border: isOverdue ? '1px solid #ef4444' : '1px solid #e2e8f0',
                      background: isOverdue ? '#fef2f2' : 'white'
                    }}
                  >
                    <div className="card-body" style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                            <h4 style={{ margin: 0, color: '#1e293b' }}>
                              {assignment.title}
                            </h4>
                            <span style={{
                              padding: '0.25rem 0.75rem',
                              borderRadius: '12px',
                              fontSize: '0.75rem',
                              fontWeight: '600',
                              background: assignment.assignmentType === 'EXAM' ? '#fecaca' :
                                        assignment.assignmentType === 'PROJECT' ? '#a7f3d0' : '#fef3c7',
                              color: assignment.assignmentType === 'EXAM' ? '#dc2626' :
                                    assignment.assignmentType === 'PROJECT' ? '#065f46' : '#92400e'
                            }}>
                              {assignment.assignmentType}
                            </span>
                            {(assignment.courseName || assignment.courseCode) && (
                              <span style={{
                                padding: '0.25rem 0.5rem',
                                borderRadius: '6px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                background: '#3b82f6',
                                color: 'white'
                              }}>
                                {assignment.courseCode || `Course ${assignment.courseId}`}
                              </span>
                            )}
                          </div>
                          <p style={{ margin: '0 0 1rem 0', color: '#64748b' }}>
                            {assignment.content}
                          </p>
                          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#64748b', flexWrap: 'wrap' }}>
                            <span>� Created by: {assignment.createdByName || 'Unknown'}</span>
                            <span>�📊 Max Marks: {assignment.maxMarks}</span>
                            <span style={{ color: isOverdue ? '#dc2626' : '#64748b' }}>
                              📅 Due: {formatDate(assignment.deadline)}
                            </span>
                            {assignment.lateSubmissionDeadline && (
                              <span style={{ color: isLateAllowed ? '#059669' : '#dc2626' }}>
                                ⏰ Late Until: {formatDate(assignment.lateSubmissionDeadline)}
                              </span>
                            )}
                            <span>📝 Created: {formatDate(assignment.createdAt)}</span>
                          </div>
                          {assignment.instructions && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                              <strong style={{ fontSize: '0.875rem', color: '#374151' }}>Instructions:</strong>
                              <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                                {assignment.instructions}
                              </p>
                            </div>
                          )}
                          {assignment.attachments && assignment.attachments.length > 0 && (
                            <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #0ea5e9' }}>
                              <strong style={{ fontSize: '0.875rem', color: '#0c4a6e' }}>
                                📎 Attachments ({assignment.attachments.length}):
                              </strong>
                              <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {assignment.attachments.map(file => (
                                  <div key={file.id} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.5rem',
                                    background: 'white',
                                    borderRadius: '4px',
                                    border: '1px solid #bae6fd'
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                      <span style={{ fontSize: '1rem' }}>
                                        {file.attachmentType === 'URL' ? '🔗' : getFileIcon(file.originalFilename || 'file')}
                                      </span>
                                      <div>
                                        <div style={{ fontSize: '0.875rem', color: '#0c4a6e', fontWeight: '500' }}>
                                          {file.attachmentType === 'URL' ? (file.urlTitle || 'Link') : file.originalFilename}
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                          {file.attachmentType === 'URL' ? 
                                            file.url.length > 50 ? file.url.substring(0, 50) + '...' : file.url :
                                            formatFileSize(file.fileSize)
                                          }
                                        </div>
                                        {file.attachmentType === 'URL' && file.urlDescription && (
                                          <div style={{ fontSize: '0.75rem', color: '#64748b', fontStyle: 'italic' }}>
                                            {file.urlDescription}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {file.attachmentType === 'URL' ? (
                                      <button
                                        type="button"
                                        onClick={() => window.open(file.url, '_blank', 'noopener,noreferrer')}
                                        style={{
                                          padding: '0.25rem 0.75rem',
                                          border: '1px solid #3b82f6',
                                          background: '#3b82f6',
                                          color: 'white',
                                          borderRadius: '4px',
                                          fontSize: '0.75rem',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.25rem'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.target.style.background = '#2563eb';
                                          e.target.style.borderColor = '#2563eb';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.background = '#3b82f6';
                                          e.target.style.borderColor = '#3b82f6';
                                        }}
                                      >
                                        🔗 Open Link
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => handleFileDownload(file.id, file.originalFilename)}
                                        style={{
                                          padding: '0.25rem 0.75rem',
                                          border: '1px solid #0ea5e9',
                                          background: '#0ea5e9',
                                          color: 'white',
                                          borderRadius: '4px',
                                          fontSize: '0.75rem',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.25rem'
                                        }}
                                        onMouseEnter={(e) => {
                                          e.target.style.background = '#0284c7';
                                          e.target.style.borderColor = '#0284c7';
                                        }}
                                        onMouseLeave={(e) => {
                                          e.target.style.background = '#0ea5e9';
                                          e.target.style.borderColor = '#0ea5e9';
                                        }}
                                      >
                                        ⬇️ Download
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                          <button 
                            className={`btn btn-sm ${isAssignmentDeadlinePassed(assignment) ? 'btn-warning' : 'btn-secondary'}`}
                            onClick={() => handleCopyCheckerClick(assignment)}
                            style={{ fontSize: '0.75rem' }}
                            title={isAssignmentDeadlinePassed(assignment) ? 
                              "Smart Copy Checker - Detect plagiarism in submissions" : 
                              `Copy checker will be available after: ${formatDetailedDateTime(assignment.lateSubmissionDeadline || assignment.deadline)}`}
                            disabled={!isAssignmentDeadlinePassed(assignment)}
                          >
                            {isAssignmentDeadlinePassed(assignment) ? '🔍 Smart Copy Check' : '� Copy Check (Locked)'}
                          </button>
                          <button 
                            className="btn btn-info btn-sm"
                            onClick={() => openSubmissionsModal(assignment)}
                            style={{ fontSize: '0.75rem' }}
                          >
                            📋 View Submissions
                          </button>
                          <button 
                            className="btn btn-secondary btn-sm"
                            onClick={() => openEditModal(assignment)}
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteAssignment(assignment.id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create New Assignment</h3>
              <button 
                className="modal-close"
                onClick={closeCreateModal}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateAssignment}>
              <div className="modal-body">
                {/* Modal Message Alert */}
                {modalMessage && (
                  <div className={`alert alert-${modalMessageType}`} style={{ marginBottom: '1rem' }}>
                    {modalMessage}
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="course">Course *</label>
                  <select
                    id="course"
                    className="form-control"
                    value={assignmentForm.courseId}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, courseId: e.target.value })}
                    required
                  >
                    <option value="">Select a course</option>
                    {courses.map(course => (
                      <option key={course.id} value={course.id}>
                        {course.courseCode} - {course.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="title">Assignment Title *</label>
                  <input
                    id="title"
                    type="text"
                    className="form-control"
                    placeholder="Enter assignment title"
                    value={assignmentForm.title}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="content">Description *</label>
                  <textarea
                    id="content"
                    className="form-control"
                    placeholder="Enter assignment description"
                    rows="4"
                    value={assignmentForm.content}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, content: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="maxMarks">Maximum Marks *</label>
                    <input
                      id="maxMarks"
                      type="number"
                      className="form-control"
                      placeholder="e.g., 100"
                      value={assignmentForm.maxMarks}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, maxMarks: e.target.value })}
                      min="1"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="assignmentType">Assignment Type</label>
                    <select
                      id="assignmentType"
                      className="form-control"
                      value={assignmentForm.assignmentType}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, assignmentType: e.target.value })}
                    >
                      <option value="HOMEWORK">Homework</option>
                      <option value="PROJECT">Project</option>
                      <option value="EXAM">Exam</option>
                      <option value="QUIZ">Quiz</option>
                      <option value="LAB">Lab Work</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="deadline">Deadline *</label>
                    <input
                      id="deadline"
                      type="datetime-local"
                      className={`form-control ${dateErrors.deadline ? 'error' : ''}`}
                      value={assignmentForm.deadline}
                      onChange={(e) => {
                        setAssignmentForm({ ...assignmentForm, deadline: e.target.value });
                        validateDeadlineDate(e.target.value, assignmentForm.lateSubmissionDeadline);
                      }}
                      required
                    />
                    {dateErrors.deadline && (
                      <small style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        {dateErrors.deadline}
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="lateDeadline">Late Submission Deadline</label>
                    <input
                      id="lateDeadline"
                      type="datetime-local"
                      className={`form-control ${dateErrors.lateSubmissionDeadline ? 'error' : ''}`}
                      value={assignmentForm.lateSubmissionDeadline}
                      onChange={(e) => {
                        setAssignmentForm({ ...assignmentForm, lateSubmissionDeadline: e.target.value });
                        validateLateDeadlineDate(e.target.value, assignmentForm.deadline);
                      }}
                    />
                    {dateErrors.lateSubmissionDeadline && (
                      <small style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        {dateErrors.lateSubmissionDeadline}
                      </small>
                    )}
                    <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      Optional: Leave empty for 2 days after main deadline
                    </small>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="instructions">Additional Instructions</label>
                  <textarea
                    id="instructions"
                    className="form-control"
                    placeholder="Enter any additional instructions or requirements"
                    rows="3"
                    value={assignmentForm.instructions}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, instructions: e.target.value })}
                  />
                </div>

                {/* File Upload Section */}
                <div className="form-group">
                  <label htmlFor="files">Attach Files (Optional)</label>
                  <input
                    id="files"
                    type="file"
                    multiple
                    className="form-control"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif,.bmp,.java,.py,.js,.html,.css,.cpp,.c,.cs"
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                    Supported files: PDF, DOC, TXT, ZIP, Images, Code files (Max 50MB each)
                  </small>
                  
                  {selectedFiles.length > 0 && (
                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <h6 style={{ margin: '0 0 0.5rem 0', color: '#374151', fontSize: '0.875rem', fontWeight: '600' }}>
                        Selected Files ({selectedFiles.length}):
                      </h6>
                      {selectedFiles.map((file, index) => (
                        <div key={index} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          padding: '0.5rem',
                          background: 'white',
                          borderRadius: '4px',
                          marginBottom: '0.5rem',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1rem' }}>{getFileIcon(file.name)}</span>
                            <div>
                              <div style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
                                {file.name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                {formatFileSize(file.size)}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(index)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              border: 'none',
                              background: '#fee2e2',
                              color: '#dc2626',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* URL Attachments Section */}
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label>URL Attachments (Optional)</label>
                    <button
                      type="button"
                      onClick={addUrlAttachment}
                      style={{
                        padding: '0.25rem 0.75rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      + Add URL
                    </button>
                  </div>
                  
                  {urlAttachments.map((urlAttachment, index) => (
                    <div key={index} style={{ 
                      padding: '1rem', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px', 
                      marginBottom: '1rem',
                      background: '#fafafa'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                          URL #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeUrlAttachment(index)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className="form-group">
                        <label>URL *</label>
                        <input
                          type="url"
                          className="form-control"
                          placeholder="https://example.com"
                          value={urlAttachment.url}
                          onChange={(e) => updateUrlAttachment(index, 'url', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Title</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Link title (optional)"
                          value={urlAttachment.title}
                          onChange={(e) => updateUrlAttachment(index, 'title', e.target.value)}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                          className="form-control"
                          placeholder="Brief description (optional)"
                          rows="2"
                          value={urlAttachment.description}
                          onChange={(e) => updateUrlAttachment(index, 'description', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeCreateModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting || isUploading}
                >
                  {isSubmitting || isUploading ? (
                    <>
                      <span style={{ marginRight: '0.5rem' }}>⏳</span>
                      {isUploading ? 'Uploading files...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      <span style={{ marginRight: '0.5rem' }}>➕</span>
                      Create Assignment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Assignment Modal */}
      {showEditModal && editingAssignment && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Assignment</h3>
              <button 
                className="modal-close"
                onClick={closeEditModal}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEditAssignment}>
              <div className="modal-body">
                {/* Modal Message Alert */}
                {modalMessage && (
                  <div className={`alert alert-${modalMessageType}`} style={{ marginBottom: '1rem' }}>
                    {modalMessage}
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="editTitle">Assignment Title *</label>
                  <input
                    id="editTitle"
                    type="text"
                    className="form-control"
                    placeholder="Enter assignment title"
                    value={assignmentForm.title}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="editContent">Description *</label>
                  <textarea
                    id="editContent"
                    className="form-control"
                    placeholder="Enter assignment description"
                    rows="4"
                    value={assignmentForm.content}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, content: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="editMaxMarks">Maximum Marks *</label>
                    <input
                      id="editMaxMarks"
                      type="number"
                      className="form-control"
                      placeholder="e.g., 100"
                      value={assignmentForm.maxMarks}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, maxMarks: e.target.value })}
                      min="1"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="editAssignmentType">Assignment Type</label>
                    <select
                      id="editAssignmentType"
                      className="form-control"
                      value={assignmentForm.assignmentType}
                      onChange={(e) => setAssignmentForm({ ...assignmentForm, assignmentType: e.target.value })}
                    >
                      <option value="HOMEWORK">Homework</option>
                      <option value="PROJECT">Project</option>
                      <option value="EXAM">Exam</option>
                      <option value="QUIZ">Quiz</option>
                      <option value="LAB">Lab Work</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label htmlFor="editDeadline">Deadline *</label>
                    <input
                      id="editDeadline"
                      type="datetime-local"
                      className={`form-control ${dateErrors.deadline ? 'error' : ''}`}
                      value={assignmentForm.deadline}
                      onChange={(e) => {
                        setAssignmentForm({ ...assignmentForm, deadline: e.target.value });
                        validateDeadlineDate(e.target.value, assignmentForm.lateSubmissionDeadline);
                      }}
                      required
                    />
                    {dateErrors.deadline && (
                      <small style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        {dateErrors.deadline}
                      </small>
                    )}
                  </div>

                  <div className="form-group">
                    <label htmlFor="editLateDeadline">Late Submission Deadline</label>
                    <input
                      id="editLateDeadline"
                      type="datetime-local"
                      className={`form-control ${dateErrors.lateSubmissionDeadline ? 'error' : ''}`}
                      value={assignmentForm.lateSubmissionDeadline}
                      onChange={(e) => {
                        setAssignmentForm({ ...assignmentForm, lateSubmissionDeadline: e.target.value });
                        validateLateDeadlineDate(e.target.value, assignmentForm.deadline);
                      }}
                    />
                    {dateErrors.lateSubmissionDeadline && (
                      <small style={{ color: '#dc2626', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                        {dateErrors.lateSubmissionDeadline}
                      </small>
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="editInstructions">Additional Instructions</label>
                  <textarea
                    id="editInstructions"
                    className="form-control"
                    placeholder="Enter any additional instructions or requirements"
                    rows="3"
                    value={assignmentForm.instructions}
                    onChange={(e) => setAssignmentForm({ ...assignmentForm, instructions: e.target.value })}
                  />
                </div>

                {/* Existing Files Management */}
                {existingFiles.length > 0 && (
                  <div className="form-group">
                    <label>Current Attachments</label>
                    <div style={{ marginTop: '0.5rem' }}>
                      {existingFiles.map(file => (
                        <div key={file.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '0.75rem',
                          background: isFileMarkedForDeletion(file.id) ? '#fee2e2' : '#f0f9ff',
                          borderRadius: '8px',
                          marginBottom: '0.5rem',
                          border: isFileMarkedForDeletion(file.id) ? '1px solid #dc2626' : '1px solid #0ea5e9',
                          opacity: isFileMarkedForDeletion(file.id) ? 0.6 : 1
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1rem' }}>
                              {file.attachmentType === 'URL' ? '🔗' : getFileIcon(file.originalFilename || 'file')}
                            </span>
                            <div>
                              <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                                {file.attachmentType === 'URL' ? (file.urlTitle || 'Link') : file.originalFilename}
                              </div>
                              {file.attachmentType === 'URL' ? (
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                  {file.url}
                                </div>
                              ) : (
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                  {formatFileSize(file.fileSize)}
                                </div>
                              )}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {file.attachmentType === 'FILE' && (
                              <button
                                type="button"
                                onClick={() => handleFileDownload(file.id, file.originalFilename)}
                                style={{
                                  padding: '0.25rem 0.75rem',
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                              >
                                Download
                              </button>
                            )}
                            {file.attachmentType === 'URL' && (
                              <button
                                type="button"
                                onClick={() => window.open(file.url, '_blank')}
                                style={{
                                  padding: '0.25rem 0.75rem',
                                  background: '#3b82f6',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                              >
                                Open Link
                              </button>
                            )}
                            {isFileMarkedForDeletion(file.id) ? (
                              <button
                                type="button"
                                onClick={() => unmarkFileForDeletion(file.id)}
                                style={{
                                  padding: '0.25rem 0.75rem',
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                              >
                                Keep
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => markFileForDeletion(file.id)}
                                style={{
                                  padding: '0.25rem 0.75rem',
                                  background: '#dc2626',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  fontSize: '0.75rem',
                                  cursor: 'pointer'
                                }}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add New Files */}
                <div className="form-group">
                  <label htmlFor="editFiles">Add New Files (Optional)</label>
                  <input
                    id="editFiles"
                    type="file"
                    multiple
                    className="form-control"
                    onChange={handleFileSelect}
                    accept=".pdf,.doc,.docx,.txt,.zip,.rar,.jpg,.jpeg,.png,.gif,.bmp,.java,.py,.js,.html,.css,.cpp,.c,.cs"
                  />
                  <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                    Supported files: PDF, DOC, TXT, ZIP, Images, Code files (Max 50MB each)
                  </small>
                  
                  {selectedFiles.length > 0 && (
                    <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <h6 style={{ margin: '0 0 0.5rem 0', color: '#374151', fontSize: '0.875rem', fontWeight: '600' }}>
                        New Files to Upload ({selectedFiles.length}):
                      </h6>
                      {selectedFiles.map((file, index) => (
                        <div key={index} style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          padding: '0.5rem',
                          background: 'white',
                          borderRadius: '4px',
                          marginBottom: '0.5rem',
                          border: '1px solid #e5e7eb'
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '1rem' }}>{getFileIcon(file.name)}</span>
                            <div>
                              <div style={{ fontSize: '0.875rem', color: '#374151', fontWeight: '500' }}>
                                {file.name}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                {formatFileSize(file.size)}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(index)}
                            style={{
                              padding: '0.25rem 0.5rem',
                              border: 'none',
                              background: '#fee2e2',
                              color: '#dc2626',
                              borderRadius: '4px',
                              fontSize: '0.75rem',
                              cursor: 'pointer'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Add New URL Attachments */}
                <div className="form-group">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <label>Add New URL Attachments (Optional)</label>
                    <button
                      type="button"
                      onClick={addUrlAttachment}
                      style={{
                        padding: '0.25rem 0.75rem',
                        background: '#3b82f6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        cursor: 'pointer'
                      }}
                    >
                      + Add URL
                    </button>
                  </div>
                  
                  {urlAttachments.map((urlAttachment, index) => (
                    <div key={index} style={{ 
                      padding: '1rem', 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '8px', 
                      marginBottom: '1rem',
                      background: '#fafafa'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                          New URL #{index + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeUrlAttachment(index)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: 'pointer'
                          }}
                        >
                          Remove
                        </button>
                      </div>
                      
                      <div className="form-group">
                        <label>URL *</label>
                        <input
                          type="url"
                          className="form-control"
                          placeholder="https://example.com"
                          value={urlAttachment.url}
                          onChange={(e) => updateUrlAttachment(index, 'url', e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Title</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Link title (optional)"
                          value={urlAttachment.title}
                          onChange={(e) => updateUrlAttachment(index, 'title', e.target.value)}
                        />
                      </div>
                      
                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                          className="form-control"
                          placeholder="Brief description (optional)"
                          rows="2"
                          value={urlAttachment.description}
                          onChange={(e) => updateUrlAttachment(index, 'description', e.target.value)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-actions">
                <button 
                  type="button"
                  className="btn btn-secondary"
                  onClick={closeEditModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span style={{ marginRight: '0.5rem' }}>⏳</span>
                      Updating...
                    </>
                  ) : (
                    <>
                      <span style={{ marginRight: '0.5rem' }}>💾</span>
                      Update Assignment
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions View Modal */}
      {showSubmissionsModal && viewingAssignment && (
        <div className="modal-overlay" onClick={closeSubmissionsModal}>
          <div className="modal-content" style={{ maxWidth: '1000px', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Submissions for "{viewingAssignment.title}"
              </h3>
              <button 
                className="modal-close"
                onClick={closeSubmissionsModal}
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {loadingSubmissions ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <div className="spinner"></div>
                  <p>Loading submissions...</p>
                </div>
              ) : submissions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📝</span>
                  <h4>No submissions yet</h4>
                  <p>No students have submitted this assignment yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Assignment Info Header */}
                  <div style={{ 
                    padding: '1rem', 
                    background: '#f8fafc', 
                    borderRadius: '8px', 
                    border: '1px solid #e2e8f0',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h5 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>
                          Assignment Details
                        </h5>
                        <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                          <span style={{ marginRight: '2rem' }}>📅 Due: {formatDate(viewingAssignment.deadline)}</span>
                          <span style={{ marginRight: '2rem' }}>📊 Max Marks: {viewingAssignment.maxMarks}</span>
                          <span>👥 Total Submissions: {submissions.length}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          background: '#dcfce7',
                          color: '#16a34a',
                          fontWeight: '600'
                        }}>
                          ✅ On Time: {submissions.filter(s => !s.isLate).length}
                        </span>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          background: '#fee2e2',
                          color: '#dc2626',
                          fontWeight: '600'
                        }}>
                          ⏰ Late: {submissions.filter(s => s.isLate).length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Submissions List */}
                  {submissions.map(submission => (
                    <div key={submission.id} className="card" style={{ 
                      border: '1px solid #e2e8f0',
                      borderLeft: `4px solid ${submission.isLate ? '#ef4444' : '#10b981'}`
                    }}>
                      <div className="card-body" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                              <h5 style={{ margin: 0, color: '#1e293b' }}>
                                {submission.studentName}
                              </h5>
                              <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                                ({submission.studentEmail})
                              </span>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                background: submission.isLate ? '#fee2e2' : '#dcfce7',
                                color: submission.isLate ? '#dc2626' : '#16a34a'
                              }}>
                                {submission.isLate ? '⏰ Late Submission' : '✅ On Time'}
                              </span>
                            </div>

                            <div style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
                              <span style={{ marginRight: '2rem' }}>
                                📅 Submitted: {formatDate(submission.submittedAt)}
                              </span>
                              <span>📋 Status: {submission.submissionStatus}</span>
                            </div>

                            {submission.submissionText && (
                              <div style={{ 
                                marginBottom: '1rem', 
                                padding: '1rem', 
                                background: '#f8fafc', 
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0'
                              }}>
                                <h6 style={{ margin: '0 0 0.5rem 0', color: '#374151', fontSize: '0.875rem', fontWeight: '600' }}>
                                  Student Notes:
                                </h6>
                                <p style={{ margin: 0, color: '#374151', fontSize: '0.875rem', lineHeight: '1.5' }}>
                                  {submission.submissionText}
                                </p>
                              </div>
                            )}

                            {submission.files && submission.files.length > 0 && (
                              <div style={{ marginBottom: '1rem' }}>
                                <h6 style={{ margin: '0 0 0.75rem 0', color: '#374151', fontSize: '0.875rem', fontWeight: '600' }}>
                                  📎 Submitted Files ({submission.files.length}):
                                </h6>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                  {submission.files.map(file => (
                                    <div key={file.id} style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      padding: '0.75rem',
                                      background: '#f0f9ff',
                                      borderRadius: '6px',
                                      border: '1px solid #0ea5e9'
                                    }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{ fontSize: '1.5rem' }}>📦</span>
                                        <div>
                                          <div style={{ fontSize: '0.875rem', color: '#0c4a6e', fontWeight: '500' }}>
                                            {file.originalFilename}
                                          </div>
                                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                            {formatFileSize(file.fileSize)} • Uploaded: {formatDate(file.uploadedAt)}
                                          </div>
                                        </div>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleSubmissionFileDownload(file.id, file.originalFilename)}
                                        style={{
                                          padding: '0.5rem 1rem',
                                          border: '1px solid #0ea5e9',
                                          background: '#0ea5e9',
                                          color: 'white',
                                          borderRadius: '6px',
                                          fontSize: '0.875rem',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '0.5rem'
                                        }}
                                      >
                                        ⬇️ Download
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button 
                type="button"
                className="btn btn-secondary"
                onClick={closeSubmissionsModal}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AssignmentManagement;
