import React, { useState, useEffect } from 'react';
import axios from '../../api/axiosInstance';

const FacultyFeedbackStudent = ({ user, enrolledCourses, onShowMessage }) => {
  const [feedbackData, setFeedbackData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submittingFeedback, setSubmittingFeedback] = useState({});
  const [feedbackForm, setFeedbackForm] = useState({});

  useEffect(() => {
    fetchExistingFeedback();
  }, [enrolledCourses]);

  const fetchExistingFeedback = async () => {
    try {
      setLoading(true);
      
      // Get feedback for each enrolled course
      const feedbackPromises = enrolledCourses.map(async (enrollment) => {
        try {
          const response = await axios.get(`/faculty-feedback/student/${user.id}/course/${enrollment.course.id}`);
          return {
            course: enrollment.course,
            feedback: response.data,
            teacherId: enrollment.course.assignedTeacher?.id
          };
        } catch (error) {
          // If no feedback exists yet, return null feedback
          return {
            course: enrollment.course,
            feedback: null,
            teacherId: enrollment.course.assignedTeacher?.id
          };
        }
      });

      const results = await Promise.all(feedbackPromises);
      setFeedbackData(results.filter(result => result.teacherId)); // Only courses with assigned teachers
      
    } catch (error) {
      console.error('Error fetching feedback:', error);
      onShowMessage('Failed to load feedback data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const initializeFeedbackForm = (courseId) => {
    if (!feedbackForm[courseId]) {
      setFeedbackForm(prev => ({
        ...prev,
        [courseId]: {
          rating: 0,
          teachingQuality: 0,
          courseContent: 0,
          responsiveness: 0,
          overallSatisfaction: 0,
          comments: '',
          isAnonymous: true
        }
      }));
    }
  };

  const handleRatingChange = (courseId, field, value) => {
    setFeedbackForm(prev => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        [field]: value
      }
    }));
  };

  const handleCommentChange = (courseId, value) => {
    setFeedbackForm(prev => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        comments: value
      }
    }));
  };

  const handleAnonymousToggle = (courseId) => {
    setFeedbackForm(prev => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        isAnonymous: !prev[courseId]?.isAnonymous
      }
    }));
  };

  const submitFeedback = async (courseId, teacherId) => {
    const form = feedbackForm[courseId];
    if (!form) return;

    // Validate required fields
    if (form.overallSatisfaction === 0) {
      onShowMessage('Please provide an overall satisfaction rating', 'error');
      return;
    }

    try {
      setSubmittingFeedback(prev => ({ ...prev, [courseId]: true }));

      const feedbackData = {
        studentId: user.id,
        teacherId: teacherId,
        courseId: courseId,
        teachingQuality: form.teachingQuality || 0,
        courseContent: form.courseContent || 0,
        responsiveness: form.responsiveness || 0,
        overallSatisfaction: form.overallSatisfaction,
        comments: form.comments || '',
        isAnonymous: form.isAnonymous
      };

      await axios.post('/faculty-feedback', feedbackData);
      
      onShowMessage('Feedback submitted successfully!', 'success');
      
      // Refresh feedback data
      await fetchExistingFeedback();
      
      // Clear form
      setFeedbackForm(prev => {
        const newForm = { ...prev };
        delete newForm[courseId];
        return newForm;
      });

    } catch (error) {
      console.error('Error submitting feedback:', error);
      onShowMessage('Failed to submit feedback. Please try again.', 'error');
    } finally {
      setSubmittingFeedback(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const renderStarRating = (courseId, field, currentValue, label) => {
    return (
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ 
          display: 'block', 
          marginBottom: '0.5rem', 
          fontWeight: '600',
          color: '#374151'
        }}>
          {label}
        </label>
        <div style={{ display: 'flex', gap: '0.25rem' }}>
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingChange(courseId, field, star)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.5rem',
                color: star <= currentValue ? '#fbbf24' : '#d1d5db',
                cursor: 'pointer',
                padding: '0.25rem',
                transition: 'color 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (star > currentValue) {
                  e.target.style.color = '#fde68a';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.color = star <= currentValue ? '#fbbf24' : '#d1d5db';
              }}
            >
              ★
            </button>
          ))}
          <span style={{ 
            marginLeft: '0.5rem', 
            fontSize: '0.875rem', 
            color: '#6b7280' 
          }}>
            {currentValue > 0 ? `${currentValue}/5` : 'Not rated'}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⭐</div>
        <h3>Loading feedback data...</h3>
        <div className="spinner" style={{ margin: '1rem auto' }}></div>
      </div>
    );
  }

  if (feedbackData.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>⭐</span>
        <h3>No Courses with Teachers</h3>
        <p>You need to be enrolled in courses with assigned teachers to provide feedback.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          ⭐ Faculty Feedback
        </h3>
        <p style={{ marginTop: '0.5rem', color: '#64748b' }}>
          Share your experience with your instructors to help improve course quality. Your feedback is valuable!
        </p>
      </div>
      
      <div style={{ display: 'grid', gap: '2rem' }}>
        {feedbackData.map((item) => {
          const courseId = item.course.id;
          const existingFeedback = item.feedback;
          const form = feedbackForm[courseId];
          
          if (!form && !existingFeedback) {
            initializeFeedbackForm(courseId);
          }

          return (
            <div key={courseId} className="card" style={{ 
              border: existingFeedback ? '2px solid #d1fae5' : '2px solid #e5e7eb',
              borderRadius: '12px',
              overflow: 'hidden'
            }}>
              <div className="card-header" style={{ 
                background: existingFeedback ? '#ecfdf5' : '#f8fafc',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: 0, color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      📚 {item.course.title}
                    </h4>
                    <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
                      👨‍🏫 Instructor: <strong>{item.course.assignedTeacher?.name}</strong> • {item.course.courseCode}
                    </p>
                  </div>
                  {existingFeedback && (
                    <div style={{
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      fontWeight: '700',
                      background: '#059669',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      ✅ FEEDBACK SUBMITTED
                    </div>
                  )}
                </div>
              </div>
              
              <div className="card-body" style={{ padding: '1.5rem' }}>
                {existingFeedback ? (
                  // Show existing feedback
                  <div>
                    <div style={{ 
                      background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      marginBottom: '1.5rem',
                      border: '1px solid #bae6fd'
                    }}>
                      <h5 style={{ margin: '0 0 1rem 0', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        📊 Your Submitted Ratings
                      </h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                        <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid #e0f2fe' }}>
                          <div style={{ fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            👨‍🏫 Teaching Quality
                          </div>
                          <div style={{ color: '#fbbf24', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {'★'.repeat(existingFeedback.teachingQuality)}{'☆'.repeat(5 - existingFeedback.teachingQuality)}
                            <span style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '700' }}>
                              {existingFeedback.teachingQuality}/5
                            </span>
                          </div>
                        </div>
                        <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid #e0f2fe' }}>
                          <div style={{ fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            📖 Course Content
                          </div>
                          <div style={{ color: '#fbbf24', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {'★'.repeat(existingFeedback.courseContent)}{'☆'.repeat(5 - existingFeedback.courseContent)}
                            <span style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '700' }}>
                              {existingFeedback.courseContent}/5
                            </span>
                          </div>
                        </div>
                        <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid #e0f2fe' }}>
                          <div style={{ fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            💬 Responsiveness
                          </div>
                          <div style={{ color: '#fbbf24', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {'★'.repeat(existingFeedback.responsiveness)}{'☆'.repeat(5 - existingFeedback.responsiveness)}
                            <span style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '700' }}>
                              {existingFeedback.responsiveness}/5
                            </span>
                          </div>
                        </div>
                        <div style={{ padding: '1rem', background: 'white', borderRadius: '8px', border: '1px solid #e0f2fe' }}>
                          <div style={{ fontWeight: '600', color: '#374151', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                            🎯 Overall Satisfaction
                          </div>
                          <div style={{ color: '#fbbf24', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            {'★'.repeat(existingFeedback.overallSatisfaction)}{'☆'.repeat(5 - existingFeedback.overallSatisfaction)}
                            <span style={{ fontSize: '0.875rem', color: '#059669', fontWeight: '700' }}>
                              {existingFeedback.overallSatisfaction}/5
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {existingFeedback.comments && (
                      <div style={{ 
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                        padding: '1.25rem',
                        borderRadius: '10px',
                        marginBottom: '1.5rem',
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
                          💭 Your Comments
                        </div>
                        <p style={{ 
                          margin: '0.75rem 0 0 0',
                          color: '#374151',
                          fontSize: '0.9rem',
                          lineHeight: 1.6,
                          fontStyle: 'italic'
                        }}>
                          "{existingFeedback.comments}"
                        </p>
                      </div>
                    )}
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      padding: '1rem',
                      background: '#fefce8',
                      borderRadius: '8px',
                      border: '1px solid #fde047'
                    }}>
                      <div style={{ fontSize: '0.875rem', color: '#ca8a04', fontWeight: '600' }}>
                        📅 Submitted: {new Date(existingFeedback.submittedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: '#ca8a04',
                        fontWeight: '600'
                      }}>
                        {existingFeedback.isAnonymous ? '🕶️ Anonymous' : '👤 Named'} Feedback
                      </div>
                    </div>
                  </div>
                ) : (
                  // Show feedback form
                  <div>
                    <div style={{ 
                      background: 'linear-gradient(135deg, #fefce8 0%, #fef3c7 100%)',
                      padding: '1.5rem',
                      borderRadius: '12px',
                      marginBottom: '2rem',
                      border: '1px solid #fde047'
                    }}>
                      <h5 style={{ 
                        margin: '0 0 1.5rem 0', 
                        color: '#ca8a04',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}>
                        ⭐ Rate Your Experience
                      </h5>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                        {renderStarRating(courseId, 'teachingQuality', form?.teachingQuality || 0, '👨‍🏫 Teaching Quality')}
                        {renderStarRating(courseId, 'courseContent', form?.courseContent || 0, '📖 Course Content')}
                        {renderStarRating(courseId, 'responsiveness', form?.responsiveness || 0, '💬 Instructor Responsiveness')}
                        {renderStarRating(courseId, 'overallSatisfaction', form?.overallSatisfaction || 0, '🎯 Overall Satisfaction *')}
                      </div>
                    </div>
                    
                    <div style={{ marginBottom: '1.5rem' }}>
                      <label style={{ 
                        display: 'block', 
                        marginBottom: '0.75rem', 
                        fontWeight: '600',
                        color: '#374151',
                        fontSize: '0.9rem'
                      }}>
                        💭 Additional Comments (Optional)
                      </label>
                      <textarea
                        className="form-control"
                        rows="4"
                        placeholder="Share your thoughts about the course, teaching methods, or suggestions for improvement..."
                        value={form?.comments || ''}
                        onChange={(e) => handleCommentChange(courseId, e.target.value)}
                        style={{
                          resize: 'vertical',
                          fontSize: '0.875rem',
                          borderRadius: '8px',
                          border: '2px solid #e5e7eb',
                          padding: '0.75rem',
                          transition: 'border-color 0.2s ease'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
                      />
                    </div>
                    
                    <div style={{ 
                      marginBottom: '2rem',
                      padding: '1rem',
                      background: form?.isAnonymous ? '#f0f9ff' : '#fef7ff',
                      borderRadius: '8px',
                      border: `2px solid ${form?.isAnonymous ? '#bae6fd' : '#e9d5ff'}`
                    }}>
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '0.75rem', 
                        cursor: 'pointer',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        <input
                          type="checkbox"
                          checked={form?.isAnonymous ?? true}
                          onChange={() => handleAnonymousToggle(courseId)}
                          style={{ 
                            width: '1.125rem',
                            height: '1.125rem',
                            accentColor: form?.isAnonymous ? '#3b82f6' : '#8b5cf6'
                          }}
                        />
                        <span style={{ fontSize: '0.9rem' }}>
                          {form?.isAnonymous ? '🕶️ Submit as Anonymous Feedback' : '👤 Submit with Your Name'}
                        </span>
                      </label>
                      <p style={{ 
                        fontSize: '0.8rem', 
                        color: form?.isAnonymous ? '#0369a1' : '#7c3aed',
                        marginTop: '0.5rem',
                        marginLeft: '2rem',
                        fontWeight: '500'
                      }}>
                        {form?.isAnonymous ?? true 
                          ? '🔒 Your identity will not be revealed to the instructor'
                          : '👁️ Your name will be visible to the instructor'
                        }
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                      <button
                        className="btn btn-secondary"
                        onClick={() => {
                          setFeedbackForm(prev => {
                            const newForm = { ...prev };
                            delete newForm[courseId];
                            return newForm;
                          });
                          initializeFeedbackForm(courseId);
                        }}
                        disabled={submittingFeedback[courseId]}
                      >
                        Reset Form
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={() => submitFeedback(courseId, item.teacherId)}
                        disabled={submittingFeedback[courseId] || !form?.overallSatisfaction}
                      >
                        {submittingFeedback[courseId] ? (
                          <>
                            <span style={{ marginRight: '0.5rem' }}>⏳</span>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <span style={{ marginRight: '0.5rem' }}>⭐</span>
                            Submit Feedback
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        <div style={{ 
          marginTop: '2rem', 
          padding: '1rem', 
          background: '#f0f9ff', 
          borderRadius: '8px',
          border: '1px solid #bae6fd'
        }}>
          <h5 style={{ margin: '0 0 0.5rem 0', color: '#0369a1', fontSize: '0.875rem' }}>
            📝 Feedback Guidelines
          </h5>
          <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.75rem', color: '#0369a1' }}>
            <li>Be honest and constructive in your feedback</li>
            <li>Focus on specific aspects of teaching and course content</li>
            <li>Your feedback helps improve the learning experience for future students</li>
            <li>Anonymous feedback encourages honest responses</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FacultyFeedbackStudent;
