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

      // Fetch course content (using mock data for now since API endpoints might not exist)
      // In a real application, these would be separate API calls
      try {
        // Mock announcements - replace with actual API call
        const mockAnnouncements = [
          {
            id: 1,
            title: 'Welcome to ' + foundCourse.title,
            content: 'Welcome to our course! Please review the syllabus and course materials.',
            createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
            author: foundCourse.assignedTeacher?.name || 'Course Instructor',
            type: 'ANNOUNCEMENT'
          },
          {
            id: 2,
            title: 'Assignment 1 Posted',
            content: 'The first assignment has been posted. Please check the assignments section for details.',
            createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
            author: foundCourse.assignedTeacher?.name || 'Course Instructor',
            type: 'ANNOUNCEMENT'
          }
        ];

        // Mock assignments
        const mockAssignments = [
          {
            id: 1,
            title: 'Assignment 1: Introduction to ' + foundCourse.title,
            description: 'Complete the introductory exercises and submit your responses.',
            dueDate: new Date(Date.now() + 86400000 * 7).toISOString(), // 7 days from now
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            status: 'ACTIVE',
            maxPoints: 100
          },
          {
            id: 2,
            title: 'Assignment 2: Advanced Topics',
            description: 'Work on the advanced problems provided in the course materials.',
            dueDate: new Date(Date.now() + 86400000 * 14).toISOString(), // 14 days from now
            createdAt: new Date(Date.now() - 86400000 * 0.5).toISOString(),
            status: 'ACTIVE',
            maxPoints: 150
          }
        ];

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
        setAssignments(mockAssignments);
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
              {getFilteredContent(sortByCreationTime(assignments)).length === 0 ? (
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
                  {getFilteredContent(sortByCreationTime(assignments)).map(assignment => (
                    <div key={assignment.id} className="card" style={{ border: '1px solid #e2e8f0' }}>
                      <div className="card-body">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                          <div style={{ flex: 1 }}>
                            <h5 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>{assignment.title}</h5>
                            <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
                              <span>📅 Due: {formatDate(assignment.dueDate)}</span>
                              <span>📊 Points: {assignment.maxPoints}</span>
                              <span style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '12px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                background: assignment.status === 'ACTIVE' ? '#dcfce7' : '#fef3c7',
                                color: assignment.status === 'ACTIVE' ? '#166534' : '#92400e'
                              }}>
                                {assignment.status}
                              </span>
                            </div>
                            <p style={{ margin: 0, color: '#374151' }}>
                              {assignment.description}
                            </p>
                          </div>
                          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
                            <button className="btn btn-primary btn-sm">
                              📋 View Details
                            </button>
                            <button className="btn btn-success btn-sm">
                              📤 Submit
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
