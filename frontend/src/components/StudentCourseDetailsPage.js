import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';
import Layout from './Layout';

const StudentCourseDetailsPage = () => {
  const { courseCode } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [course, setCourse] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [activeTab, setActiveTab] = useState('announcements');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [courseCode]);

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
          realAssignments = assignmentsResponse.data.map(assignment => ({
            id: assignment.id,
            title: assignment.title,
            content: assignment.content,
            instructions: assignment.instructions,
            maxMarks: assignment.maxMarks,
            deadline: assignment.deadline,
            lateSubmissionDeadline: assignment.lateSubmissionDeadline,
            assignmentType: assignment.assignmentType,
            createdAt: assignment.createdAt,
            status: 'ACTIVE' // Default status for students
          }));
          console.log(`Fetched ${realAssignments.length} assignments for course ${foundCourse.courseCode}`);
        } catch (assignmentError) {
          console.error('Error fetching assignments:', assignmentError);
          realAssignments = [];
        }

        // Mock announcements - replace with actual API call when available
        const mockAnnouncements = [
          {
            id: 1,
            title: 'Welcome to ' + foundCourse.title,
            content: 'Welcome to our course! Please review the syllabus and course materials.',
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
            author: foundCourse.assignedTeacher?.name || 'Course Instructor',
            type: 'ANNOUNCEMENT'
          }
        ];

        // If there are assignments, add an announcement about them
        if (realAssignments.length > 0) {
          const latestAssignment = realAssignments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
          mockAnnouncements.unshift({
            id: 2,
            title: `New Assignment: ${latestAssignment.title}`,
            content: `A new assignment "${latestAssignment.title}" has been posted. Please check the assignments section for details.`,
            createdAt: latestAssignment.createdAt,
            author: foundCourse.assignedTeacher?.name || 'Course Instructor',
            type: 'ANNOUNCEMENT'
          });
        }

        // Mock resources
        const mockResources = [
          {
            id: 1,
            title: 'Course Syllabus',
            description: 'Complete course syllabus and schedule',
            type: 'PDF',
            url: '#',
            createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
            size: '2.5 MB'
          },
          {
            id: 2,
            title: 'Lecture Notes - Week 1',
            description: 'Comprehensive notes for the first week of lectures',
            type: 'PDF',
            url: '#',
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
            size: '1.8 MB'
          },
          {
            id: 3,
            title: 'Reference Materials',
            description: 'Additional reading materials and references',
            type: 'ZIP',
            url: '#',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            size: '15.2 MB'
          }
        ];

        setAnnouncements(mockAnnouncements);
        setAssignments(realAssignments);
        setResources(mockResources);

      } catch (contentError) {
        console.error('Error fetching course content:', contentError);
        // Set empty arrays if content fetching fails
        setAnnouncements([]);
        setAssignments([]);
        setResources([]);
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

  const formatDate = (dateString) => {
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
              placeholder="Search announcements, assignments, and resources..."
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
              📁 Resources ({getFilteredContent(resources).length})
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
                          By {announcement.author}
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
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '1rem', minWidth: '120px' }}>
                              <button 
                                className="btn btn-primary btn-sm"
                                style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                              >
                                📋 View Details
                              </button>
                              <button 
                                className={`btn btn-sm ${isOverdue && !canSubmitLate ? 'btn-secondary' : 'btn-success'}`}
                                style={{ fontSize: '0.75rem', padding: '0.5rem 0.75rem' }}
                                disabled={isOverdue && !canSubmitLate}
                              >
                                {isOverdue && !canSubmitLate ? '⏰ Closed' : 
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
                                background: '#f0f9ff',
                                color: '#0369a1',
                                fontWeight: '600'
                              }}>
                                � Not Submitted
                              </span>
                              {isNearDue && !isOverdue && (
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
              {getFilteredContent(sortByCreationTime(resources)).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📁</span>
                  <h4>No resources found</h4>
                  <p>
                    {searchTerm 
                      ? `No resources match "${searchTerm}"`
                      : 'No resources have been uploaded for this course yet.'
                    }
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {getFilteredContent(sortByCreationTime(resources)).map(resource => (
                    <div key={resource.id} className="card" style={{ border: '1px solid #e2e8f0' }}>
                      <div className="card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                              <span style={{ fontSize: '1.5rem' }}>
                                {resource.type === 'PDF' ? '📄' : 
                                 resource.type === 'ZIP' ? '📦' : 
                                 resource.type === 'DOC' ? '📝' : '📁'}
                              </span>
                              <h5 style={{ margin: 0, color: '#1e293b' }}>{resource.title}</h5>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                background: '#f3f4f6',
                                color: '#374151'
                              }}>
                                {resource.type}
                              </span>
                            </div>
                            <p style={{ margin: '0.5rem 0', color: '#64748b' }}>
                              {resource.description}
                            </p>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
                              <span>📅 Added: {formatDate(resource.createdAt)}</span>
                              <span>💾 Size: {resource.size}</span>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                            <button className="btn btn-primary btn-sm">
                              👁️ View
                            </button>
                            <button className="btn btn-secondary btn-sm">
                              💾 Download
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StudentCourseDetailsPage;
