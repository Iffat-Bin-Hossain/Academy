import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';
import Layout from './Layout';
import DiscussionThreads from './DiscussionThreads';
import ResourceManagement from './ResourceManagement';
import StudentAttendanceView from './StudentAttendanceView';

const StudentCourseDetailsPage = () => {
  const { courseCode } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [resources, setResources] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [activeTab, setActiveTab] = useState('announcements');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Submission state
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submittingAssignment, setSubmittingAssignment] = useState(null);
  const [submissionText, setSubmissionText] = useState('');
  const [submissionFile, setSubmissionFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionStatuses, setSubmissionStatuses] = useState({});

  useEffect(() => {
    fetchData();
  }, [courseCode]);

  // Check submission statuses for all assignments
  useEffect(() => {
    if (assignments.length > 0 && user) {
      checkSubmissionStatuses();
    }
  }, [assignments, user]);

  const checkSubmissionStatuses = async () => {
    const statuses = {};
    for (const assignment of assignments) {
      try {
        const response = await axios.get(`/submissions/check?assignmentId=${assignment.id}&studentId=${user.id}`);
        statuses[assignment.id] = response.data.hasSubmitted;
      } catch (error) {
        console.error(`Error checking submission status for assignment ${assignment.id}:`, error);
        statuses[assignment.id] = false;
      }
    }
    setSubmissionStatuses(statuses);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get current user info
      const userResponse = await axios.get('/user/me');
      const currentUser = userResponse.data;
      
      setUser({
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        email: currentUser.email
      });

      // Find course by courseCode
      const coursesResponse = await axios.get('/courses');
      const foundCourse = coursesResponse.data.find(c => c.courseCode === courseCode);
      
      if (!foundCourse) {
        throw new Error('Course not found');
      }

      // Check if student is enrolled in this course
      const enrollmentsResponse = await axios.get(`/courses/student/${currentUser.id}`);
      const enrollment = enrollmentsResponse.data.find(e => 
        e.course.courseCode === courseCode && 
        (e.status === 'APPROVED' || e.status === 'RETAKING')
      );
      
      if (!enrollment) {
        throw new Error('Not enrolled in this course');
      }

      setCourse(foundCourse);

      // Fetch course content
      try {
        // Fetch real assignments for this course
        let realAssignments = [];
        try {
          const assignmentsResponse = await axios.get(`/assignments/course/${foundCourse.id}`);
          
          // Fetch attachments for each assignment
          const assignmentsWithAttachments = await Promise.all(
            assignmentsResponse.data.map(async (assignment) => {
              try {
                const attachmentsResponse = await axios.get(`/assignments/${assignment.id}/files`);
                return {
                  id: assignment.id,
                  title: assignment.title,
                  content: assignment.content,
                  instructions: assignment.instructions,
                  maxMarks: assignment.maxMarks,
                  deadline: assignment.deadline,
                  lateSubmissionDeadline: assignment.lateSubmissionDeadline,
                  assignmentType: assignment.assignmentType,
                  createdAt: assignment.createdAt,
                  createdByName: assignment.createdByName,
                  status: 'ACTIVE', // Default status for students
                  attachments: attachmentsResponse.data || []
                };
              } catch (attachmentError) {
                console.warn(`Could not fetch attachments for assignment ${assignment.id}:`, attachmentError);
                return {
                  id: assignment.id,
                  title: assignment.title,
                  content: assignment.content,
                  instructions: assignment.instructions,
                  maxMarks: assignment.maxMarks,
                  deadline: assignment.deadline,
                  lateSubmissionDeadline: assignment.lateSubmissionDeadline,
                  assignmentType: assignment.assignmentType,
                  createdAt: assignment.createdAt,
                  createdByName: assignment.createdByName,
                  status: 'ACTIVE',
                  attachments: []
                };
              }
            })
          );
          
          realAssignments = assignmentsWithAttachments;
          console.log(`Fetched ${realAssignments.length} assignments for course ${foundCourse.courseCode}`);
        } catch (assignmentError) {
          console.error('Error fetching assignments:', assignmentError);
          realAssignments = [];
        }

        // Fetch real announcements from API
        try {
          const announcementsResponse = await axios.get(`/announcements/course/${foundCourse.id}`);
          setAnnouncements(announcementsResponse.data);
        } catch (announcementsError) {
          console.error('Error fetching announcements:', announcementsError);
          // Fallback to welcome message if API fails
          const welcomeAnnouncement = {
            id: 'welcome-' + foundCourse.id,
            title: 'Welcome to ' + foundCourse.title,
            content: 'Welcome to our course! Please review the syllabus and course materials.',
            createdAt: new Date().toISOString(),
            authorName: foundCourse.assignedTeacher?.name || 'Course Instructor',
            type: 'GENERAL'
          };
          setAnnouncements([welcomeAnnouncement]);
        }

        // Fetch resources for this course
        try {
          const resourcesResponse = await axios.get(`/resources/course/${foundCourse.id}?userId=${currentUser.id}`);
          setResources(resourcesResponse.data);
        } catch (resourcesError) {
          console.error('Error fetching resources:', resourcesError);
          setResources([]);
        }

        setAssignments(realAssignments);

      } catch (contentError) {
        console.error('Error fetching course content:', contentError);
        // Set empty arrays if content fetching fails
        setAnnouncements([]);
        setAssignments([]);
        setResources([]);
        setDiscussions([]);
      }

      // Fetch discussions for this course (separate from other content to avoid being reset by content errors)
      try {
        const discussionsResponse = await axios.get(`/discussions/course/${foundCourse.id}/threads?userId=${currentUser.id}`);
        setDiscussions(discussionsResponse.data);
      } catch (discussionsError) {
        console.error('Error fetching discussions:', discussionsError);
        setDiscussions([]);
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      showMessage(error.message || 'Failed to load course details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  // Submission functions
  const openSubmissionModal = (assignment) => {
    const now = new Date();
    const deadline = new Date(assignment.deadline);
    const lateDeadline = assignment.lateSubmissionDeadline ? new Date(assignment.lateSubmissionDeadline) : null;
    
    // Check if submission is still allowed
    if (now > deadline && (!lateDeadline || now > lateDeadline)) {
      showMessage('Submission deadline has passed', 'error');
      return;
    }

    // Check if already submitted
    if (submissionStatuses[assignment.id]) {
      showMessage('You have already submitted this assignment', 'warning');
      return;
    }

    setSubmittingAssignment(assignment);
    setSubmissionText('');
    setSubmissionFile(null);
    setShowSubmissionModal(true);
  };

  const closeSubmissionModal = () => {
    setShowSubmissionModal(false);
    setSubmittingAssignment(null);
    setSubmissionText('');
    setSubmissionFile(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check if it's a ZIP file
      if (!file.name.toLowerCase().endsWith('.zip')) {
        showMessage('Only ZIP files are allowed for submission', 'error');
        e.target.value = '';
        return;
      }
      
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        showMessage('File size must be less than 50MB', 'error');
        e.target.value = '';
        return;
      }
      
      setSubmissionFile(file);
    }
  };

  const submitAssignment = async () => {
    if (!submissionFile && !submissionText.trim()) {
      showMessage('Please provide either a file upload or text submission', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('assignmentId', submittingAssignment.id);
      formData.append('studentId', user.id);
      
      if (submissionText.trim()) {
        formData.append('submissionText', submissionText.trim());
      }
      
      if (submissionFile) {
        formData.append('file', submissionFile);
      }

      await axios.post('/submissions', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      showMessage('Assignment submitted successfully!', 'success');
      closeSubmissionModal();
      
      // Refresh submission statuses
      checkSubmissionStatuses();
    } catch (error) {
      console.error('Error submitting assignment:', error);
      showMessage(error.response?.data?.error || 'Failed to submit assignment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (filename) => {
    if (!filename) return '📄';
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
      default: return '📄';
    }
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
      showMessage('Failed to download file', 'error');
    }
  };

  const getFilteredContent = (content, searchFields = ['title', 'description', 'content']) => {
    if (!searchTerm) return content;
    
    const searchLower = searchTerm.toLowerCase();
    return content.filter(item => 
      searchFields.some(field => 
        item[field] && item[field].toLowerCase().includes(searchLower)
      )
    );
  };

  const sortByCreationTime = (content) => {
    return [...content].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  if (loading) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="loading">
          <div className="spinner"></div>
          Loading course details...
        </div>
      </Layout>
    );
  }

  if (!course) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="card">
          <div className="card-body">
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>❌</span>
              <h4>Course not found or access denied</h4>
              <p>The course "{courseCode}" was not found or you don't have access to it.</p>
              <button 
                className="btn btn-primary"
                onClick={() => navigate('/student')}
                style={{ marginTop: '1rem' }}
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      {message && (
        <div className={`alert alert-${messageType}`} style={{ marginBottom: '1rem' }}>
          {message}
        </div>
      )}

      {/* Back Button */}
      <div style={{ marginBottom: '2rem' }}>
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/student')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          ← Back to Dashboard
        </button>
      </div>

      {/* Course Header */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                <h1 style={{ margin: 0, color: '#1e293b' }}>{course.title}</h1>
                <span style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  background: '#3b82f6',
                  color: 'white'
                }}>
                  {course.courseCode}
                </span>
              </div>
              <p style={{ margin: '0 0 1rem 0', color: '#64748b', fontSize: '1.1rem' }}>
                {course.description}
              </p>
              <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#64748b' }}>
                <span>👨‍🏫 Instructor: {course.assignedTeacher?.name || 'Not Assigned'}</span>
                <span>📅 Created: {formatDate(course.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-body" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search announcements and assignments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ flex: 1 }}
            />
            {searchTerm && (
              <button 
                className="btn btn-secondary btn-sm"
                onClick={() => setSearchTerm('')}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header" style={{ padding: 0 }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
            <button
              className={`tab-button ${activeTab === 'announcements' ? 'active' : ''}`}
              onClick={() => setActiveTab('announcements')}
              style={{
                flex: 1,
                padding: '1rem',
                border: 'none',
                background: activeTab === 'announcements' ? '#f8fafc' : 'transparent',
                borderBottom: activeTab === 'announcements' ? '2px solid #3b82f6' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: activeTab === 'announcements' ? '600' : '400',
                color: activeTab === 'announcements' ? '#3b82f6' : '#64748b'
              }}
            >
              📢 Announcements ({getFilteredContent(announcements).length})
            </button>
            <button
              className={`tab-button ${activeTab === 'assignments' ? 'active' : ''}`}
              onClick={() => setActiveTab('assignments')}
              style={{
                flex: 1,
                padding: '1rem',
                border: 'none',
                background: activeTab === 'assignments' ? '#f8fafc' : 'transparent',
                borderBottom: activeTab === 'assignments' ? '2px solid #3b82f6' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: activeTab === 'assignments' ? '600' : '400',
                color: activeTab === 'assignments' ? '#3b82f6' : '#64748b'
              }}
            >
              📝 Assignments ({getFilteredContent(assignments).length})
            </button>
            <button
              className={`tab-button ${activeTab === 'resources' ? 'active' : ''}`}
              onClick={() => setActiveTab('resources')}
              style={{
                flex: 1,
                padding: '1rem',
                border: 'none',
                background: activeTab === 'resources' ? '#f8fafc' : 'transparent',
                borderBottom: activeTab === 'resources' ? '2px solid #3b82f6' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: activeTab === 'resources' ? '600' : '400',
                color: activeTab === 'resources' ? '#3b82f6' : '#64748b'
              }}
            >
              📁 Resources ({resources.length})
            </button>
            <button
              className={`tab-button ${activeTab === 'discussions' ? 'active' : ''}`}
              onClick={() => setActiveTab('discussions')}
              style={{
                flex: 1,
                padding: '1rem',
                border: 'none',
                background: activeTab === 'discussions' ? '#f8fafc' : 'transparent',
                borderBottom: activeTab === 'discussions' ? '2px solid #3b82f6' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: activeTab === 'discussions' ? '600' : '400',
                color: activeTab === 'discussions' ? '#3b82f6' : '#64748b'
              }}
            >
              💬 Discussions ({discussions.length})
            </button>
            <button
              className={`tab-button ${activeTab === 'attendance' ? 'active' : ''}`}
              onClick={() => setActiveTab('attendance')}
              style={{
                flex: 1,
                padding: '1rem',
                border: 'none',
                background: activeTab === 'attendance' ? '#f8fafc' : 'transparent',
                borderBottom: activeTab === 'attendance' ? '2px solid #3b82f6' : '2px solid transparent',
                cursor: 'pointer',
                fontWeight: activeTab === 'attendance' ? '600' : '400',
                color: activeTab === 'attendance' ? '#3b82f6' : '#64748b'
              }}
            >
              📋 Attendance
            </button>
          </div>
        </div>

        <div className="card-body">
          {/* Announcements Tab */}
          {activeTab === 'announcements' && (
            <div>
              {getFilteredContent(sortByCreationTime(announcements)).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📢</span>
                  <h4>No announcements found</h4>
                  <p>
                    {searchTerm 
                      ? `No announcements match "${searchTerm}"`
                      : 'No announcements have been posted for this course yet.'
                    }
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {getFilteredContent(sortByCreationTime(announcements)).map(announcement => (
                    <div key={announcement.id} className="card" style={{ border: '1px solid #e2e8f0' }}>
                      <div className="card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <h5 style={{ margin: 0, color: '#1e293b' }}>{announcement.title}</h5>
                          <span style={{ fontSize: '0.875rem', color: '#64748b' }}>
                            {formatDate(announcement.createdAt)}
                          </span>
                        </div>
                        <p style={{ margin: '0.5rem 0', color: '#64748b', fontSize: '0.875rem' }}>
                          By {announcement.authorName}
                        </p>
                        <p style={{ margin: '1rem 0 0 0', color: '#374151' }}>
                          {announcement.content}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Assignments Tab */}
          {activeTab === 'assignments' && (
            <div>
              {getFilteredContent(sortByCreationTime(assignments), ['title', 'content', 'instructions']).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📝</span>
                  <h4>No assignments found</h4>
                  <p>
                    {searchTerm 
                      ? `No assignments match "${searchTerm}"`
                      : 'No assignments have been posted for this course yet.'
                    }
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {getFilteredContent(sortByCreationTime(assignments), ['title', 'content', 'instructions']).map(assignment => {
                    const isOverdue = new Date(assignment.deadline) < new Date();
                    const isNearDue = new Date(assignment.deadline) < new Date(Date.now() + 86400000 * 3); // 3 days
                    const canSubmitLate = assignment.lateSubmissionDeadline && new Date(assignment.lateSubmissionDeadline) > new Date();
                    
                    return (
                      <div key={assignment.id} className="card" style={{ 
                        border: '1px solid #e2e8f0',
                        borderLeft: `4px solid ${isOverdue ? '#ef4444' : isNearDue ? '#f59e0b' : '#3b82f6'}`
                      }}>
                        <div className="card-body">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <h5 style={{ margin: 0, color: '#1e293b' }}>{assignment.title}</h5>
                                <span style={{
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '12px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  background: assignment.assignmentType === 'EXAM' ? '#fecaca' : 
                                            assignment.assignmentType === 'PROJECT' ? '#ddd6fe' :
                                            assignment.assignmentType === 'QUIZ' ? '#fed7aa' :
                                            assignment.assignmentType === 'LAB' ? '#bbf7d0' : '#e5e7eb',
                                  color: assignment.assignmentType === 'EXAM' ? '#dc2626' : 
                                        assignment.assignmentType === 'PROJECT' ? '#7c3aed' :
                                        assignment.assignmentType === 'QUIZ' ? '#ea580c' :
                                        assignment.assignmentType === 'LAB' ? '#059669' : '#374151'
                                }}>
                                  {assignment.assignmentType}
                                </span>
                              </div>
                              
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
                                <span>👤 Instructor: {assignment.createdByName || 'Course Instructor'}</span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                  📅 Due: {formatDate(assignment.deadline)}
                                  {isOverdue && <span style={{ color: '#ef4444', fontWeight: '600' }}>(OVERDUE)</span>}
                                  {!isOverdue && isNearDue && <span style={{ color: '#f59e0b', fontWeight: '600' }}>(DUE SOON)</span>}
                                </span>
                                <span>📊 Max Marks: {assignment.maxMarks}</span>
                                {assignment.lateSubmissionDeadline && (
                                  <span style={{ color: canSubmitLate ? '#059669' : '#ef4444' }}>
                                    📋 Late Until: {formatDate(assignment.lateSubmissionDeadline)}
                                  </span>
                                )}
                                <span style={{ color: '#64748b' }}>
                                  📝 Posted: {formatDate(assignment.createdAt)}
                                </span>
                              </div>
                              
                              {assignment.content && (
                                <div style={{ marginBottom: '1rem' }}>
                                  <h6 style={{ margin: '0 0 0.5rem 0', color: '#374151', fontSize: '0.875rem', fontWeight: '600' }}>Description:</h6>
                                  <p style={{ margin: 0, color: '#374151', fontSize: '0.875rem', lineHeight: '1.5' }}>
                                    {assignment.content}
                                  </p>
                                </div>
                              )}
                              
                              {assignment.instructions && (
                                <div style={{ marginBottom: '1rem' }}>
                                  <h6 style={{ margin: '0 0 0.5rem 0', color: '#374151', fontSize: '0.875rem', fontWeight: '600' }}>Instructions:</h6>
                                  <p style={{ margin: 0, color: '#374151', fontSize: '0.875rem', lineHeight: '1.5' }}>
                                    {assignment.instructions}
                                  </p>
                                </div>
                              )}

                              {assignment.attachments && assignment.attachments.length > 0 && (
                                <div style={{ marginBottom: '1rem', padding: '1rem', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #0ea5e9' }}>
                                  <h6 style={{ margin: '0 0 0.75rem 0', color: '#0c4a6e', fontSize: '0.875rem', fontWeight: '600' }}>
                                    📎 Attachments ({assignment.attachments.length}):
                                  </h6>
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
                                                file.url.length > 40 ? file.url.substring(0, 40) + '...' : file.url :
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
                                            🔗 Open
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
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '1rem', minWidth: '120px' }}>
                              <button 
                                className="btn btn-primary btn-sm"
                                style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                              >
                                📋 View Details
                              </button>
                              <button 
                                className={`btn btn-sm ${
                                  submissionStatuses[assignment.id] ? 'btn-success' :
                                  isOverdue && !canSubmitLate ? 'btn-secondary' : 
                                  isOverdue && canSubmitLate ? 'btn-warning' : 'btn-success'
                                }`}
                                style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                                disabled={isOverdue && !canSubmitLate}
                                onClick={() => openSubmissionModal(assignment)}
                              >
                                {submissionStatuses[assignment.id] ? '✅ Submitted' :
                                 isOverdue && !canSubmitLate ? '⏰ Closed' : 
                                 isOverdue && canSubmitLate ? '📤 Submit Late' : 
                                 '📤 Submit'}
                              </button>
                              {assignment.assignmentType === 'EXAM' && (
                                <button 
                                  className="btn btn-warning btn-sm"
                                  style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                                >
                                  🎯 Take Exam
                                </button>
                              )}
                            </div>
                          </div>
                          
                          {/* Status indicators */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.75rem' }}>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                background: submissionStatuses[assignment.id] ? 
                                  (isOverdue ? '#fee2e2' : '#dcfce7') : '#f0f9ff',
                                color: submissionStatuses[assignment.id] ? 
                                  (isOverdue ? '#dc2626' : '#16a34a') : '#0369a1',
                                fontWeight: '600'
                              }}>
                                {submissionStatuses[assignment.id] ? 
                                  (isOverdue ? '📤 Submitted Late' : '✅ Submitted On Time') : 
                                  '❌ Not Submitted'}
                              </span>
                              {isNearDue && !isOverdue && !submissionStatuses[assignment.id] && (
                                <span style={{
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '12px',
                                  background: '#fffbeb',
                                  color: '#d97706',
                                  fontWeight: '600'
                                }}>
                                  ⏰ Due Soon
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              Assignment ID: {assignment.id}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div>
              <ResourceManagement 
                courseId={course.id}
                user={user}
                onShowMessage={showMessage}
              />
            </div>
          )}

          {/* Discussions Tab */}
          {activeTab === 'discussions' && (
            <div>
              <DiscussionThreads 
                courseId={course.id}
                user={user}
                onShowMessage={showMessage}
              />
            </div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <div>
              <StudentAttendanceView 
                courseId={course.id}
                user={user}
                onShowMessage={showMessage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Assignment Submission Modal */}
      {showSubmissionModal && submittingAssignment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '2rem',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>Submit Assignment</h3>
              <button 
                onClick={closeSubmissionModal}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  color: '#64748b'
                }}
                disabled={isSubmitting}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#374151' }}>{submittingAssignment.title}</h4>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                <span style={{ marginRight: '1rem' }}>📅 Due: {formatDate(submittingAssignment.deadline)}</span>
                <span>📊 Max Marks: {submittingAssignment.maxMarks}</span>
              </div>
              {submittingAssignment.lateSubmissionDeadline && (
                <div style={{ fontSize: '0.875rem', color: '#dc2626', marginTop: '0.5rem' }}>
                  📋 Late submission allowed until: {formatDate(submittingAssignment.lateSubmissionDeadline)}
                </div>
              )}
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                Submission Text (Optional)
              </label>
              <textarea
                value={submissionText}
                onChange={(e) => setSubmissionText(e.target.value)}
                placeholder="Enter any additional notes or comments about your submission..."
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  resize: 'vertical'
                }}
                disabled={isSubmitting}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151' }}>
                Upload File <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <input
                type="file"
                accept=".zip"
                onChange={handleFileSelect}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '0.875rem'
                }}
                disabled={isSubmitting}
              />
              <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.5rem' }}>
                📦 Only ZIP files are allowed (Max 50MB)
              </div>
              {submissionFile && (
                <div style={{ 
                  marginTop: '0.75rem', 
                  padding: '0.75rem', 
                  background: '#f0f9ff', 
                  borderRadius: '6px',
                  border: '1px solid #3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ fontSize: '1.2rem' }}>📦</span>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                      {submissionFile.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      {(submissionFile.size / (1024 * 1024)).toFixed(2)} MB
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submission time indicator */}
            <div style={{ 
              marginBottom: '1.5rem',
              padding: '1rem',
              borderRadius: '8px',
              background: new Date() > new Date(submittingAssignment.deadline) ? '#fef2f2' : '#f0f9ff',
              border: `1px solid ${new Date() > new Date(submittingAssignment.deadline) ? '#fecaca' : '#bae6fd'}`
            }}>
              <div style={{ 
                fontSize: '0.875rem',
                fontWeight: '600',
                color: new Date() > new Date(submittingAssignment.deadline) ? '#dc2626' : '#0369a1',
                marginBottom: '0.5rem'
              }}>
                {new Date() > new Date(submittingAssignment.deadline) ? 
                  '⚠️ Late Submission' : 
                  '✅ On-Time Submission'
                }
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                {new Date() > new Date(submittingAssignment.deadline) ? 
                  'This submission will be marked as late.' : 
                  'You are submitting before the deadline.'
                }
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button 
                onClick={closeSubmissionModal}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: '1px solid #d1d5db',
                  background: 'white',
                  color: '#374151',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  cursor: 'pointer'
                }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button 
                onClick={submitAssignment}
                style={{
                  padding: '0.75rem 1.5rem',
                  border: 'none',
                  background: isSubmitting ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
                disabled={isSubmitting || (!submissionFile && !submissionText.trim())}
              >
                {isSubmitting ? (
                  <>⏳ Submitting...</>
                ) : (
                  <>📤 Submit Assignment</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default StudentCourseDetailsPage;
