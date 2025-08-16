import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';

const GradeVisibilityControl = ({ courseId, user, onShowMessage }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});

  useEffect(() => {
    if (courseId && user) {
      fetchGradeVisibility();
    }
  }, [courseId, user]);

  const fetchGradeVisibility = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/grades/course/${courseId}/visibility`);
      setAssignments(response.data.assignments || []);
    } catch (error) {
      console.error('Error fetching grade visibility:', error);
      onShowMessage?.('Failed to load grade visibility settings', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleVisibility = async (assignmentId, currentVisibility) => {
    setUpdating(prev => ({ ...prev, [assignmentId]: true }));
    
    try {
      await axios.put(`/grades/assignment/${assignmentId}/visibility`, null, {
        params: {
          teacherId: user.id,
          visible: !currentVisibility
        }
      });
      
      // Update local state
      setAssignments(prev => prev.map(assignment => 
        assignment.assignmentId === assignmentId 
          ? { ...assignment, gradesVisible: !currentVisibility }
          : assignment
      ));
      
      onShowMessage?.(
        `Grades ${!currentVisibility ? 'visible' : 'hidden'} for students`, 
        'success'
      );
    } catch (error) {
      console.error('Error updating grade visibility:', error);
      onShowMessage?.(
        error.response?.data?.error || 'Failed to update grade visibility', 
        'error'
      );
    } finally {
      setUpdating(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <div className="spinner"></div>
        <p>Loading grade visibility settings...</p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">👁️ Grade Visibility Control</h3>
        <p className="card-subtitle">
          Control which assignment grades are visible to students
        </p>
      </div>
      
      <div className="card-body">
        {assignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📝</span>
            <h4>No Assignments</h4>
            <p>No assignments found for this course.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {assignments.map(assignment => (
              <div key={assignment.assignmentId} className="card" style={{ 
                border: '1px solid #e2e8f0',
                background: assignment.gradesVisible ? '#f0fdf4' : '#fafafa'
              }}>
                <div className="card-body" style={{ padding: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <h5 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
                        {assignment.assignmentTitle}
                      </h5>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          background: assignment.gradesVisible ? '#dcfce7' : '#f1f5f9',
                          color: assignment.gradesVisible ? '#166534' : '#64748b'
                        }}>
                          {assignment.gradesVisible ? '👁️ Visible to Students' : '🔒 Hidden from Students'}
                        </span>
                        
                        {assignment.hasGrades && (
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            background: '#dbeafe',
                            color: '#1e40af'
                          }}>
                            ✅ Has Grades
                          </span>
                        )}
                      </div>
                      
                      <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                        {assignment.hasGrades ? (
                          assignment.gradesVisible ? (
                            <span style={{ color: '#166534' }}>
                              ✅ Students can see their grades and feedback
                            </span>
                          ) : (
                            <span style={{ color: '#dc2626' }}>
                              🔒 Grades are hidden - students see "Pending Review"
                            </span>
                          )
                        ) : (
                          <span style={{ color: '#64748b' }}>
                            ⏳ No grades entered yet
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      {assignment.hasGrades && (
                        <button
                          onClick={() => toggleVisibility(assignment.assignmentId, assignment.gradesVisible)}
                          disabled={updating[assignment.assignmentId]}
                          className={`btn btn-sm ${assignment.gradesVisible ? 'btn-warning' : 'btn-success'}`}
                          style={{ 
                            minWidth: '120px',
                            fontSize: '0.875rem',
                            fontWeight: '600'
                          }}
                        >
                          {updating[assignment.assignmentId] ? (
                            <span>⏳ Updating...</span>
                          ) : assignment.gradesVisible ? (
                            <span>🔒 Hide Grades</span>
                          ) : (
                            <span>👁️ Show Grades</span>
                          )}
                        </button>
                      )}
                      
                      {!assignment.hasGrades && (
                        <span style={{
                          padding: '0.5rem 1rem',
                          fontSize: '0.875rem',
                          color: '#64748b',
                          fontStyle: 'italic'
                        }}>
                          Grade assignments first
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {assignment.hasGrades && (
                    <div style={{ 
                      marginTop: '1rem',
                      padding: '0.75rem',
                      background: assignment.gradesVisible ? '#ecfdf5' : '#fef3c7',
                      borderRadius: '6px',
                      border: `1px solid ${assignment.gradesVisible ? '#bbf7d0' : '#fde047'}`
                    }}>
                      <div style={{ 
                        fontSize: '0.75rem', 
                        color: assignment.gradesVisible ? '#166534' : '#a16207',
                        marginBottom: '0.25rem',
                        fontWeight: '600'
                      }}>
                        💡 Student View:
                      </div>
                      <div style={{ 
                        fontSize: '0.875rem', 
                        color: assignment.gradesVisible ? '#166534' : '#a16207'
                      }}>
                        {assignment.gradesVisible ? (
                          'Students can see their grade, percentage, feedback notes, and any penalties applied.'
                        ) : (
                          'Students see "Pending Review" or "Under Review" status instead of actual grades.'
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {/* Bulk Actions */}
            {assignments.some(a => a.hasGrades) && (
              <div style={{ 
                marginTop: '1rem',
                padding: '1rem',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e2e8f0'
              }}>
                <h6 style={{ margin: '0 0 1rem 0', color: '#374151' }}>Bulk Actions</h6>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={() => {
                      assignments
                        .filter(a => a.hasGrades && !a.gradesVisible)
                        .forEach(a => toggleVisibility(a.assignmentId, false));
                    }}
                    className="btn btn-success btn-sm"
                    disabled={Object.values(updating).some(Boolean)}
                  >
                    👁️ Show All Grades
                  </button>
                  
                  <button
                    onClick={() => {
                      assignments
                        .filter(a => a.hasGrades && a.gradesVisible)
                        .forEach(a => toggleVisibility(a.assignmentId, true));
                    }}
                    className="btn btn-warning btn-sm"
                    disabled={Object.values(updating).some(Boolean)}
                  >
                    🔒 Hide All Grades
                  </button>
                </div>
                
                <div style={{ 
                  fontSize: '0.75rem', 
                  color: '#64748b',
                  marginTop: '0.5rem'
                }}>
                  Note: Bulk actions only affect assignments that already have grades.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GradeVisibilityControl;
