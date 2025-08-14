import React, { useState, useEffect, useCallback, useRef } from 'react';
import axios from '../api/axiosInstance';

const AssessmentGrid = ({ courseId, userId, courseName }) => {
  const [assessmentData, setAssessmentData] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [copyCheckerFile, setCopyCheckerFile] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showCopyCheckerModal, setShowCopyCheckerModal] = useState(false);
  const [processingGrading, setProcessingGrading] = useState(false);
  const [savingStatus, setSavingStatus] = useState({}); // Track saving status per input
  const saveTimeoutRef = useRef({});

  useEffect(() => {
    if (courseId && userId) {
      fetchAssessmentGrid();
    }
  }, [courseId, userId]);

  const fetchAssessmentGrid = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/assessment-grid/course/${courseId}`, {
        params: { teacherId: userId }
      });
      
      if (response.data && response.data.length > 0) {
        console.log('Raw assessment data from backend:', response.data);
        console.log('Number of raw records:', response.data.length);
        
        // Group data by students and assignments
        const groupedData = groupAssessmentData(response.data);
        setAssessmentData(groupedData);
        
        // Extract unique assignments and students
        const assignmentMap = new Map();
        const studentMap = new Map();
        
        response.data.forEach(item => {
          // Add unique assignments
          if (!assignmentMap.has(item.assignmentId)) {
            assignmentMap.set(item.assignmentId, {
              id: item.assignmentId,
              title: item.assignmentTitle,
              fullMark: item.maxMarks,
              deadline: item.assignmentDeadline
            });
          }
          
          // Add unique students
          if (!studentMap.has(item.studentId)) {
            studentMap.set(item.studentId, {
              id: item.studentId,
              name: item.studentName,
              email: item.studentEmail
            });
          }
        });
        
        setAssignments(Array.from(assignmentMap.values()));
        setStudents(Array.from(studentMap.values()));
        
        // Debug logging
        console.log('Unique Assignments:', Array.from(assignmentMap.values()));
        console.log('Assignment count:', assignmentMap.size);
      } else {
        setAssessmentData([]);
        setAssignments([]);
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching assessment grid:', error);
      setMessage('Error loading assessment grid: ' + (error.response?.data?.error || error.message));
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const groupAssessmentData = (data) => {
    const grouped = {};
    data.forEach(item => {
      const studentId = item.studentId;
      if (!grouped[studentId]) {
        grouped[studentId] = {
          studentId: studentId,
          studentName: item.studentName,
          studentEmail: item.studentEmail,
          assessments: {}
        };
      }
      grouped[studentId].assessments[item.assignmentId] = item;
    });
    return Object.values(grouped);
  };

  const handleMarkChange = async (studentId, assignmentId, field, value) => {
    try {
      const updateRequest = {
        courseId,
        assignmentId: parseInt(assignmentId),
        studentId: parseInt(studentId),
        [field]: value
      };

      await axios.put('/assessment-grid/assessment', updateRequest, {
        params: { teacherId: userId }
      });

      // Update local state instead of refreshing entire grid
      setAssessmentData(prevData => 
        prevData.map(studentData => {
          if (studentData.studentId === studentId) {
            return {
              ...studentData,
              assessments: {
                ...studentData.assessments,
                [assignmentId]: {
                  ...studentData.assessments[assignmentId],
                  [field]: value
                }
              }
            };
          }
          return studentData;
        })
      );

      // Update saving status to success
      const key = `${studentId}-${assignmentId}-${field}`;
      setSavingStatus(prev => ({
        ...prev,
        [key]: 'saved'
      }));

      // Clear success status after 2 seconds
      setTimeout(() => {
        setSavingStatus(prev => ({
          ...prev,
          [key]: null
        }));
      }, 2000);

    } catch (error) {
      console.error('Error updating assessment:', error);
      const key = `${studentId}-${assignmentId}-${field}`;
      setSavingStatus(prev => ({
        ...prev,
        [key]: 'error'
      }));
      setMessage('Error updating assessment: ' + (error.response?.data?.error || error.message));
      setMessageType('error');
    }
  };

  // Auto-save handler for real-time updates
  const handleRealTimeUpdate = useCallback((studentId, assignmentId, field, value) => {
    // Update local state immediately for responsive UI
    setAssessmentData(prevData => 
      prevData.map(studentData => {
        if (studentData.studentId === studentId) {
          return {
            ...studentData,
            assessments: {
              ...studentData.assessments,
              [assignmentId]: {
                ...studentData.assessments[assignmentId],
                [field]: value
              }
            }
          };
        }
        return studentData;
      })
    );

    const key = `${studentId}-${assignmentId}-${field}`;
    
    // Clear existing timeout
    if (saveTimeoutRef.current[key]) {
      clearTimeout(saveTimeoutRef.current[key]);
    }

    // Set saving status
    setSavingStatus(prev => ({
      ...prev,
      [key]: 'saving'
    }));

    // Set new timeout for auto-save (800ms delay)
    saveTimeoutRef.current[key] = setTimeout(async () => {
      try {
        const updateRequest = {
          courseId,
          assignmentId: parseInt(assignmentId),
          studentId: parseInt(studentId),
          [field]: value
        };

        await axios.put('/assessment-grid/assessment', updateRequest, {
          params: { teacherId: userId }
        });

        // Update saving status to success
        setSavingStatus(prev => ({
          ...prev,
          [key]: 'saved'
        }));

        // Clear success status after 2 seconds
        setTimeout(() => {
          setSavingStatus(prev => ({
            ...prev,
            [key]: null
          }));
        }, 2000);

      } catch (error) {
        console.error('Error updating assessment:', error);
        setSavingStatus(prev => ({
          ...prev,
          [key]: 'error'
        }));
        setMessage('Error updating assessment: ' + (error.response?.data?.error || error.message));
        setMessageType('error');
      }
    }, 800);
  }, [courseId, userId]);

  const handleAssignmentWeightChange = async (assignmentId, weight) => {
    try {
      // Update weight for all students in this assignment
      const updatePromises = assessmentData.map(studentData => {
        const assessment = studentData.assessments[assignmentId];
        if (assessment) {
          return axios.put('/assessment-grid/assessment', {
            courseId,
            assignmentId: parseInt(assignmentId),
            studentId: parseInt(studentData.studentId),
            manualWeight: weight
          }, {
            params: { teacherId: userId }
          });
        }
        return Promise.resolve();
      });

      await Promise.all(updatePromises);
      
      // Update local state instead of full refresh
      setAssessmentData(prevData => 
        prevData.map(studentData => {
          if (studentData.assessments[assignmentId]) {
            return {
              ...studentData,
              assessments: {
                ...studentData.assessments,
                [assignmentId]: {
                  ...studentData.assessments[assignmentId],
                  manualWeight: weight
                }
              }
            };
          }
          return studentData;
        })
      );
      
      setMessage('Assignment weight updated for all students');
      setMessageType('success');
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error updating assignment weight:', error);
      setMessage('Error updating assignment weight: ' + (error.response?.data?.error || error.message));
      setMessageType('error');
    }
  };

  const handleCopyCheckerUpload = async () => {
    if (!copyCheckerFile || !selectedAssignment) {
      setMessage('Please select both a file and an assignment');
      setMessageType('error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', copyCheckerFile);

      await axios.post(`/assessment-grid/copy-checker/${selectedAssignment}`, formData, {
        params: { teacherId: userId },
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setMessage('Copy checker file uploaded and processed successfully');
      setMessageType('success');
      setShowCopyCheckerModal(false);
      setCopyCheckerFile(null);
      setSelectedAssignment(null);
      
      // Only refresh data after copy checker processing (since it affects final marks)
      fetchAssessmentGrid();
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error uploading copy checker:', error);
      setMessage('Error uploading copy checker: ' + (error.response?.data?.error || error.message));
      setMessageType('error');
    }
  };

  const handleProcessGrading = async (assignmentId) => {
    try {
      setProcessingGrading(true);
      await axios.post(`/assessment-grid/process/${assignmentId}`, null, {
        params: { teacherId: userId }
      });

      setMessage('Grading processed successfully');
      setMessageType('success');
      
      // Only refresh data after processing grading (since it affects final marks)
      fetchAssessmentGrid();
      
      // Clear message after 3 seconds
      setTimeout(() => {
        setMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error processing grading:', error);
      setMessage('Error processing grading: ' + (error.response?.data?.error || error.message));
      setMessageType('error');
    } finally {
      setProcessingGrading(false);
    }
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimeoutRef.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  // Render saving status indicator
  const renderSavingStatus = (studentId, assignmentId, field) => {
    const key = `${studentId}-${assignmentId}-${field}`;
    const status = savingStatus[key];
    
    if (!status) return null;
    
    const statusConfig = {
      saving: { icon: '💾', color: '#3b82f6', text: 'Saving...' },
      saved: { icon: '✅', color: '#10b981', text: 'Saved' },
      error: { icon: '❌', color: '#ef4444', text: 'Error' }
    };
    
    const config = statusConfig[status];
    if (!config) return null;
    
    return (
      <small style={{ 
        fontSize: '0.65rem', 
        color: config.color, 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.25rem',
        marginTop: '0.25rem',
        fontWeight: '500'
      }}>
        <span>{config.icon}</span>
        {config.text}
      </small>
    );
  };
    try {
      const response = await axios.get(`/submissions/files/${fileId}/download`, {
        responseType: 'blob',
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading submission file:', error);
      setMessage('Failed to download file: ' + (error.response?.data?.error || error.message));
      setMessageType('error');
    }
  };

  const renderAssessmentGrid = () => {
    if (assignments.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
          <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>📊</span>
          <h4>No assignments found</h4>
          <p>Assessment grid will appear here once assignments are created for this course.</p>
        </div>
      );
    }

    console.log('Rendering grid with assignments:', assignments.length);

    return (
      <>
        {/* Assignment Summary Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: `repeat(${assignments.length}, 1fr)`, 
          gap: '1rem', 
          marginBottom: '2rem' 
        }}>
          {assignments.map(assignment => {
            // Get assignment weight from first student's assessment (since weight is per assignment)
            const sampleAssessment = assessmentData.length > 0 ? assessmentData[0].assessments[assignment.id] : null;
            const assignmentWeight = sampleAssessment?.manualWeight || 1;
            
            return (
              <div key={assignment.id} className="card" style={{ border: '1px solid #e2e8f0' }}>
                <div className="card-body" style={{ padding: '1rem' }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <h6 style={{ margin: 0, color: '#1e293b', fontWeight: '600', fontSize: '0.9rem' }}>
                      {assignment.title}
                    </h6>
                    <div style={{ 
                      fontSize: '0.75rem',
                      color: '#3b82f6',
                      fontWeight: '600'
                    }}>
                      {assignment.fullMark} pts
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.75rem' }}>
                    📅 Due: {new Date(assignment.deadline).toLocaleDateString('en-US', { 
                      month: 'short', day: 'numeric', year: 'numeric' 
                    })}
                  </div>
                  
                  {/* Assignment Weight Control */}
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.7rem', color: '#64748b', marginBottom: '0.25rem', display: 'block' }}>
                      Weight
                    </label>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={assignmentWeight}
                      onChange={(e) => handleAssignmentWeightChange(assignment.id, parseFloat(e.target.value) || 1)}
                      step="0.1"
                      min="0"
                      max="2"
                      style={{ fontSize: '0.7rem' }}
                    />
                  </div>
                  
                  <button 
                    className="btn btn-success btn-sm"
                    onClick={() => handleProcessGrading(assignment.id)}
                    disabled={processingGrading}
                    style={{ 
                      fontSize: '0.7rem',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      width: '100%'
                    }}
                  >
                    {processingGrading ? 'Processing...' : '📋 Process'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Students Assessment Grid - Table Format */}
        {assessmentData.map(studentData => (
          <div key={studentData.studentId} className="card mb-3" style={{ border: '1px solid #e2e8f0' }}>
            {/* Student Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem', 
              padding: '1rem',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#3b82f6',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: 'bold'
              }}>
                {studentData.studentName.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <h5 style={{ margin: 0, color: '#1e293b', fontWeight: '600', fontSize: '1rem' }}>
                  {studentData.studentName}
                </h5>
                <p style={{ margin: '0.25rem 0 0 0', color: '#64748b', fontSize: '0.8rem' }}>
                  {studentData.studentEmail}
                </p>
              </div>
              <div style={{ textAlign: 'right' }}>
                {(() => {
                  const totalMarks = assignments.reduce((sum, assignment) => {
                    const assessment = studentData.assessments[assignment.id];
                    if (assessment && assessment.finalMark !== null) {
                      return sum + assessment.finalMark;
                    }
                    return sum;
                  }, 0);
                  
                  const totalPossible = assignments.reduce((sum, assignment) => {
                    return sum + assignment.fullMark;
                  }, 0);
                  
                  const percentage = totalPossible > 0 ? ((totalMarks / totalPossible) * 100).toFixed(1) : 0;
                  
                  return (
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#1e293b' }}>
                        {totalMarks.toFixed(1)} / {totalPossible}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        ({percentage}%)
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Assignment Columns */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: `repeat(${assignments.length}, 1fr)`,
              gap: '0'
            }}>
              {assignments.map((assignment, index) => {
                const assessment = studentData.assessments[assignment.id];
                
                return (
                  <div key={assignment.id} style={{
                    padding: '1rem',
                    borderRight: index < assignments.length - 1 ? '1px solid #e2e8f0' : 'none',
                    backgroundColor: '#ffffff'
                  }}>
                    {/* Assignment Title */}
                    <div style={{ marginBottom: '1rem' }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}>
                        <h6 style={{ margin: 0, fontSize: '0.8rem', fontWeight: '600', color: '#1e293b' }}>
                          {assignment.title}
                        </h6>
                        {assessment && (
                          <span className={`badge ${
                            assessment.submissionStatus === 'SUBMITTED' ? 'bg-success' : 
                            assessment.submissionStatus === 'LATE' ? 'bg-warning text-dark' : 'bg-danger'
                          }`} style={{ 
                            fontSize: '0.65rem', 
                            padding: '0.3rem 0.6rem',
                            fontWeight: '600',
                            borderRadius: '6px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            {assessment.submissionStatus === 'SUBMITTED' ? '✓ SUBMITTED' :
                             assessment.submissionStatus === 'LATE' ? '⚠ LATE' : 
                             '✗ NOT SUBMITTED'}
                          </span>
                        )}
                      </div>
                      
                      {/* Submission Files */}
                      {assessment && assessment.submissionFiles && assessment.submissionFiles.length > 0 && (
                        <div style={{ marginBottom: '1rem' }}>
                          {assessment.submissionFiles.map((file, idx) => (
                            <button
                              key={idx}
                              className="btn btn-sm"
                              onClick={() => downloadSubmissionFile(file.id, file.originalFilename || file.fileName)}
                              style={{ 
                                fontSize: '0.65rem', 
                                padding: '0.35rem 0.7rem',
                                marginBottom: '0.3rem',
                                width: '100%',
                                textAlign: 'left',
                                borderRadius: '6px',
                                backgroundColor: '#e0f2fe',
                                border: '2px solid #0891b2',
                                color: '#0c4a6e',
                                cursor: 'pointer',
                                fontWeight: '500',
                                transition: 'all 0.2s ease',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                              }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#0891b2';
                                e.target.style.color = 'white';
                                e.target.style.transform = 'translateY(-1px)';
                                e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#e0f2fe';
                                e.target.style.color = '#0c4a6e';
                                e.target.style.transform = 'translateY(0)';
                                e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                              }}
                            >
                              📎 {(file.originalFilename || file.fileName).length > 15 ? 
                                  `${(file.originalFilename || file.fileName).substring(0, 15)}...` : 
                                  (file.originalFilename || file.fileName)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {assessment ? (
                      <>
                        {/* Obtained Mark Input */}
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ fontSize: '0.7rem', color: '#475569', marginBottom: '0.25rem', display: 'block', fontWeight: '500' }}>
                            Obtained Mark (/ {assignment.fullMark})
                          </label>
                          <input
                            type="number"
                            className="form-control form-control-sm"
                            placeholder={`Enter marks (max ${assignment.fullMark})`}
                            value={assessment.teacherMark || ''}
                            onChange={(e) => {
                              const value = e.target.value;
                              
                              if (value === '' || value === '-') {
                                handleRealTimeUpdate(studentData.studentId, assignment.id, 'teacherMark', null);
                              } else {
                                const numValue = parseFloat(value);
                                if (!isNaN(numValue) && numValue <= assignment.fullMark) {
                                  handleRealTimeUpdate(studentData.studentId, assignment.id, 'teacherMark', numValue);
                                } else if (!isNaN(numValue) && numValue > assignment.fullMark) {
                                  // Show warning for values exceeding max
                                  e.target.style.borderColor = '#dc2626';
                                  e.target.style.backgroundColor = '#fef2f2';
                                  setTimeout(() => {
                                    e.target.style.borderColor = '';
                                    e.target.style.backgroundColor = '';
                                  }, 1500);
                                  return; // Don't save invalid values
                                }
                              }
                            }}
                            style={{ fontSize: '0.75rem' }}
                            max={assignment.fullMark}
                          />
                          {renderSavingStatus(studentData.studentId, assignment.id, 'teacherMark')}
                          <small style={{ fontSize: '0.65rem', color: '#6b7280', display: 'block', marginTop: '0.25rem' }}>
                            💡 Auto-saves as you type. Negative marks allowed, max {assignment.fullMark} points
                          </small>
                        </div>

                        {/* Notes */}
                        <div style={{ marginBottom: '1rem' }}>
                          <label style={{ fontSize: '0.7rem', color: '#475569', marginBottom: '0.25rem', display: 'block' }}>
                            Notes
                          </label>
                          <textarea
                            className="form-control form-control-sm"
                            placeholder="Add notes..."
                            value={assessment.gradingNotes || ''}
                            onChange={(e) => handleRealTimeUpdate(
                              studentData.studentId, 
                              assignment.id, 
                              'gradingNotes', 
                              e.target.value
                            )}
                            rows="2"
                            style={{ fontSize: '0.7rem' }}
                          />
                          {renderSavingStatus(studentData.studentId, assignment.id, 'gradingNotes')}
                        </div>

                        {/* Final Mark */}
                        {assessment.finalMark !== null && (
                          <div style={{ 
                            padding: '0.5rem',
                            backgroundColor: assessment.finalMark >= (assignment.fullMark * 0.8) ? '#dcfce7' : 
                                           assessment.finalMark >= (assignment.fullMark * 0.6) ? '#fef3c7' : '#fecaca',
                            borderRadius: '6px',
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: assessment.finalMark >= (assignment.fullMark * 0.8) ? '#15803d' : 
                                   assessment.finalMark >= (assignment.fullMark * 0.6) ? '#b45309' : '#b91c1c'
                          }}>
                            Final: {assessment.finalMark.toFixed(1)} / {assignment.fullMark}
                            {assessment.latePenaltyApplied && (
                              <div style={{ fontSize: '0.6rem', color: '#d97706' }}>
                                ⏰ Late penalty (-20%)
                              </div>
                            )}
                            {assessment.copyPenaltyApplied && (
                              <div style={{ fontSize: '0.6rem', color: '#dc2626' }}>
                                🚫 Copy penalty (0 marks)
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <div style={{
                        padding: '1rem',
                        textAlign: 'center',
                        color: '#9ca3af',
                        fontSize: '0.75rem'
                      }}>
                        No data
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ margin: 0 }}>📊 Assessment {courseName}</h3>
            <p style={{ margin: '0.5rem 0 0 0', color: '#64748b' }}>
              Grade students and manage assessment data for all assignments
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setShowCopyCheckerModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            📤 Upload Copy Checker
          </button>
          <button 
            className="btn btn-secondary btn-sm"
            onClick={fetchAssessmentGrid}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="card-body">
        {/* Messages */}
        {message && (
          <div className={`alert alert-${messageType === 'error' ? 'danger' : 'success'} alert-dismissible fade show`} 
               role="alert"
               style={{ 
                 fontSize: '0.85rem', 
                 padding: '0.5rem 1rem',
                 marginBottom: '1rem',
                 border: 'none',
                 borderRadius: '6px',
                 boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
               }}>
            {message}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setMessage('')}
              style={{ fontSize: '0.7rem' }}
            ></button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <div className="spinner-border" role="status" style={{ marginBottom: '1rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <div>Loading assessment grid...</div>
          </div>
        ) : (
          renderAssessmentGrid()
        )}
      </div>

      {/* Copy Checker Upload Modal */}
      {showCopyCheckerModal && (
        <div 
          className="modal fade show d-flex align-items-center justify-content-center" 
          style={{ 
            display: 'flex !important',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 1055,
            alignItems: 'center',
            justifyContent: 'center'
          }} 
          tabIndex="-1"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCopyCheckerModal(false);
            }
          }}
        >
          <div 
            className="modal-dialog modal-dialog-centered"
            style={{
              margin: 0,
              maxWidth: '500px',
              width: '90%'
            }}
          >
            <div className="modal-content" style={{ boxShadow: '0 10px 30px rgba(0,0,0,0.3)', border: 'none' }}>
              <div className="modal-header" style={{ backgroundColor: '#f8f9fa', borderBottom: '1px solid #dee2e6' }}>
                <h5 className="modal-title" style={{ color: '#1e293b', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  📤 Upload Copy Checker File
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowCopyCheckerModal(false)}
                  style={{ fontSize: '1.2rem' }}
                ></button>
              </div>
              <div className="modal-body" style={{ padding: '1.5rem' }}>
                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    Select Assignment
                  </label>
                  <select 
                    className="form-select"
                    value={selectedAssignment || ''}
                    onChange={(e) => setSelectedAssignment(e.target.value)}
                    style={{
                      borderColor: '#d1d5db',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.875rem'
                    }}
                  >
                    <option value="">Choose assignment...</option>
                    {assignments.map(assignment => (
                      <option key={assignment.id} value={assignment.id}>
                        {assignment.title} ({assignment.fullMark} pts)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label" style={{ fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                    CSV File
                  </label>
                  <input 
                    type="file" 
                    className="form-control"
                    accept=".csv"
                    onChange={(e) => setCopyCheckerFile(e.target.files[0])}
                    style={{
                      borderColor: '#d1d5db',
                      borderRadius: '8px',
                      padding: '0.75rem',
                      fontSize: '0.875rem'
                    }}
                  />
                  <div className="form-text" style={{ color: '#6b7280', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                    📄 Upload a CSV file containing flagged student emails for plagiarism detection
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ backgroundColor: '#f8f9fa', borderTop: '1px solid #dee2e6', padding: '1rem 1.5rem' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCopyCheckerModal(false)}
                  style={{
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem'
                  }}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleCopyCheckerUpload}
                  disabled={!copyCheckerFile || !selectedAssignment}
                  style={{
                    borderRadius: '8px',
                    padding: '0.5rem 1rem',
                    fontSize: '0.875rem',
                    backgroundColor: '#3b82f6',
                    borderColor: '#3b82f6'
                  }}
                >
                  Upload & Process
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentGrid;
