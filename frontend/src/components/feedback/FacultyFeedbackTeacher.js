import React, { useState, useEffect } from 'react';
import axios from '../../api/axiosInstance';

const FacultyFeedbackTeacher = ({ user, onShowMessage }) => {
  const [feedbackData, setFeedbackData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // newest, oldest, rating-high, rating-low

  useEffect(() => {
    fetchFeedbackData();
    fetchTeacherCourses();
    fetchTeacherStats();
  }, [user.id]);

  const fetchTeacherCourses = async () => {
    try {
      const response = await axios.get(`/courses/teacher/${user.id}`);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching teacher courses:', error);
      onShowMessage('Failed to load courses', 'error');
    }
  };

  const fetchFeedbackData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/faculty-feedback/teacher/${user.id}`);
      setFeedbackData(response.data);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      if (error.response?.status !== 400) {
        onShowMessage('Failed to load feedback data', 'error');
      }
      setFeedbackData([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeacherStats = async () => {
    try {
      const response = await axios.get(`/faculty-feedback/teacher/${user.id}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching teacher stats:', error);
      setStats(null);
    }
  };

  const fetchCourseFeedback = async (courseId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/faculty-feedback/teacher/${user.id}/course/${courseId}`);
      setFeedbackData(response.data);
    } catch (error) {
      console.error('Error fetching course feedback:', error);
      setFeedbackData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCourseFilter = (courseId) => {
    setSelectedCourse(courseId);
    if (courseId === 'all') {
      fetchFeedbackData();
    } else {
      fetchCourseFeedback(courseId);
    }
  };

  const getFilteredFeedback = () => {
    let filtered = feedbackData;
    
    // Filter by course selection
    if (selectedCourse !== 'all') {
      filtered = filtered.filter(feedback => feedback.courseId === parseInt(selectedCourse));
    }
    
    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(feedback => 
        feedback.courseTitle?.toLowerCase().includes(searchLower) ||
        feedback.courseCode?.toLowerCase().includes(searchLower) ||
        feedback.studentName?.toLowerCase().includes(searchLower) ||
        feedback.comments?.toLowerCase().includes(searchLower)
      );
    }
    
    // Sort the results
    switch (sortBy) {
      case 'oldest':
        filtered = filtered.sort((a, b) => new Date(a.submittedAt) - new Date(b.submittedAt));
        break;
      case 'rating-high':
        filtered = filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'rating-low':
        filtered = filtered.sort((a, b) => (a.averageRating || 0) - (b.averageRating || 0));
        break;
      case 'newest':
      default:
        filtered = filtered.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
        break;
    }
    
    return filtered;
  };

  const renderRatingStars = (rating, label) => {
    if (!rating) return null;
    
    return (
      <div style={{ marginBottom: '0.5rem' }}>
        <strong style={{ fontSize: '0.875rem', color: '#374151' }}>{label}:</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
          <div style={{ color: '#fbbf24', fontSize: '1rem' }}>
            {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
          </div>
          <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
            {rating}/5
          </span>
        </div>
      </div>
    );
  };

  const renderStatsCard = () => {
    if (!stats || stats.totalFeedbackCount === 0) {
      return null; // Don't render anything here, let the main logic handle "No Feedback"
    }

    return (
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h4 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📊 Feedback Overview
          </h4>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
            <div style={{ 
              background: '#f0f9ff', 
              padding: '1rem', 
              borderRadius: '8px',
              border: '1px solid #bae6fd' 
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0369a1' }}>
                {stats.totalFeedbackCount}
              </div>
              <div style={{ color: '#0369a1', fontSize: '0.875rem', fontWeight: '600' }}>
                Total Feedback
              </div>
            </div>
            
            <div style={{ 
              background: '#fefce8', 
              padding: '1rem', 
              borderRadius: '8px',
              border: '1px solid #fde047' 
            }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ca8a04' }}>
                {stats.overallAverage ? stats.overallAverage.toFixed(1) : '0.0'}
              </div>
              <div style={{ color: '#ca8a04', fontSize: '0.875rem', fontWeight: '600' }}>
                Overall Rating
              </div>
            </div>
          </div>
          
          <div style={{ marginTop: '1.5rem' }}>
            <h6 style={{ marginBottom: '1rem', color: '#374151' }}>Average Ratings by Category</h6>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
              {renderRatingStars(Math.round(stats.averageTeachingQuality), 'Teaching Quality')}
              {renderRatingStars(Math.round(stats.averageCourseContent), 'Course Content')}
              {renderRatingStars(Math.round(stats.averageResponsiveness), 'Responsiveness')}
              {renderRatingStars(Math.round(stats.averageOverallSatisfaction), 'Overall Satisfaction')}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="spinner-border" role="status">
          <span className="sr-only">Loading...</span>
        </div>
        <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading feedback...</p>
      </div>
    );
  }

  const filteredFeedback = getFilteredFeedback();

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ⭐ Faculty Feedback
        </h3>
        <p style={{ marginTop: '0.5rem', color: '#64748b' }}>
          View feedback from your students to improve your teaching effectiveness
        </p>
      </div>

      {/* Show Stats Card only when there IS feedback AND stats are available */}
      {feedbackData.length > 0 && stats && stats.totalFeedbackCount > 0 && renderStatsCard()}

      {/* Search and Filter Controls - ALWAYS show these controls */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', alignItems: 'end' }}>
            {/* Search Box */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>
                🔍 Search Feedback
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by course, student name, or comments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    paddingRight: '2.5rem',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    fontSize: '0.875rem'
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: '#6b7280',
                      cursor: 'pointer',
                      fontSize: '1.125rem',
                      padding: '0.25rem'
                    }}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>
                📊 Sort By
              </label>
              <select
                className="form-control"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '0.875rem' }}
              >
                <option value="newest">📅 Newest First</option>
                <option value="oldest">📅 Oldest First</option>
                <option value="rating-high">⭐ Highest Rating</option>
                <option value="rating-low">⭐ Lowest Rating</option>
              </select>
            </div>

            {/* Course Filter - show when there are multiple courses OR when courses exist */}
            {courses.length > 0 && (
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>
                  📚 Filter by Course
                </label>
                <select 
                  className="form-control" 
                  value={selectedCourse}
                  onChange={(e) => handleCourseFilter(e.target.value)}
                  style={{ borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '0.875rem' }}
                >
                  <option value="all">All Courses ({feedbackData.length})</option>
                  {courses.map(course => {
                    const courseFeedbackCount = feedbackData.filter(f => f.courseId === course.id).length;
                    return (
                      <option key={course.id} value={course.id}>
                        {course.title} ({courseFeedbackCount})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* Results Summary - always show when feedback exists */}
            {feedbackData.length > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  background: filteredFeedback.length === feedbackData.length ? '#f0f9ff' : '#fef3c7',
                  color: filteredFeedback.length === feedbackData.length ? '#0369a1' : '#ca8a04',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontSize: '0.875rem'
                }}>
                  📋 Showing {filteredFeedback.length} of {feedbackData.length} feedback{feedbackData.length !== 1 ? 's' : ''}
                  {(searchTerm || selectedCourse !== 'all') && ' (filtered)'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Remove old course filter since it's now integrated above */}

      {/* Feedback List or No Feedback Message */}
      {filteredFeedback.length === 0 ? (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '3rem' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>
              {feedbackData.length === 0 ? '⭐' : searchTerm ? '🔍' : selectedCourse !== 'all' ? '📚' : '📝'}
            </span>
            <h4>
              {feedbackData.length === 0 
                ? 'No Feedback Yet' 
                : searchTerm 
                  ? 'No Search Results' 
                  : selectedCourse !== 'all' 
                    ? 'No Feedback for Selected Course'
                    : 'No Feedback Available'
              }
            </h4>
            <p style={{ color: '#64748b', marginBottom: 0 }}>
              {feedbackData.length === 0 
                ? "Students haven't submitted feedback for your courses yet."
                : searchTerm 
                  ? `No feedback found matching "${searchTerm}". Try different keywords.`
                  : selectedCourse !== 'all' 
                    ? "No feedback available for the selected course."
                    : "No feedback available with current filters."
              }
            </p>
            {(searchTerm || selectedCourse !== 'all') && feedbackData.length > 0 && (
              <button
                className="btn btn-outline-primary"
                style={{ marginTop: '1rem' }}
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCourse('all');
                }}
              >
                🔄 Clear All Filters
              </button>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {filteredFeedback.map((feedback, index) => {
              const averageRating = feedback.averageRating || 0;
              const ratingColor = averageRating >= 4 ? '#059669' : averageRating >= 3 ? '#d97706' : '#dc2626';
              
              return (
                <div key={feedback.id || index} className="card" style={{ 
                  border: `2px solid ${averageRating >= 4 ? '#d1fae5' : averageRating >= 3 ? '#fed7aa' : '#fecaca'}`,
                  borderRadius: '12px',
                  overflow: 'hidden'
                }}>
                  <div className="card-header" style={{ 
                    background: averageRating >= 4 ? '#ecfdf5' : averageRating >= 3 ? '#fff7ed' : '#fef2f2',
                    borderBottom: '1px solid #e5e7eb'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h5 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          📚 {feedback.courseTitle}
                        </h5>
                        <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
                          {feedback.courseCode} • 
                          {feedback.isAnonymous ? (
                            <span style={{ color: '#6b7280', fontStyle: 'italic' }}> 🕶️ Anonymous Feedback</span>
                          ) : (
                            <span style={{ color: '#374151', fontWeight: '500' }}> 👤 {feedback.studentName}</span>
                          )}
                        </p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                          fontSize: '0.75rem', 
                          color: '#6b7280',
                          marginBottom: '0.5rem' 
                        }}>
                          📅 {new Date(feedback.submittedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </div>
                        <div style={{ 
                          background: ratingColor,
                          color: 'white',
                          padding: '0.375rem 0.75rem', 
                          borderRadius: '20px',
                          fontSize: '0.875rem',
                          fontWeight: '700',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}>
                          ⭐ {averageRating.toFixed(1)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="card-body" style={{ padding: '1.5rem' }}>
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                      gap: '1.25rem', 
                      marginBottom: feedback.comments ? '1.5rem' : '0' 
                    }}>
                      {renderRatingStars(feedback.teachingQuality, '👨‍🏫 Teaching Quality')}
                      {renderRatingStars(feedback.courseContent, '📖 Course Content')}
                      {renderRatingStars(feedback.responsiveness, '💬 Responsiveness')}
                      {renderRatingStars(feedback.overallSatisfaction, '🎯 Overall Satisfaction')}
                    </div>
                    
                    {feedback.comments && (
                      <div style={{ 
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                        padding: '1.25rem', 
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute',
                          top: '-8px',
                          left: '20px',
                          background: '#3b82f6',
                          color: 'white',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}>
                          💭 Student Comments
                        </div>
                        <p style={{ 
                          margin: '0.75rem 0 0 0', 
                          color: '#374151', 
                          fontSize: '0.9rem', 
                          lineHeight: 1.6,
                          fontStyle: 'italic'
                        }}>
                          "{feedback.comments}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Guidelines */}
      <div style={{ 
        marginTop: '2rem', 
        padding: '1rem', 
        background: '#f0f9ff', 
        borderRadius: '8px',
        border: '1px solid #bae6fd'
      }}>
        <h6 style={{ margin: '0 0 0.5rem 0', color: '#0369a1', fontSize: '0.875rem' }}>
          💡 Using Feedback Effectively
        </h6>
        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem', color: '#0369a1' }}>
          <li>Use feedback to identify areas for improvement in your teaching methods</li>
          <li>Look for patterns in student comments to understand common concerns</li>
          <li>Consider addressing feedback in future course iterations</li>
          <li>Anonymous feedback may provide more honest insights</li>
        </ul>
      </div>
    </div>
  );
};

export default FacultyFeedbackTeacher;
