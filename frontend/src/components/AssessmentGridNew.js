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
  const [savingStatus, setSavingStatus] = useState({});
  const saveTimeoutRef = useRef({});

  useEffect(() => {
    if (courseId && userId) {
      fetchAssessmentGrid();
    }
  }, [courseId, userId]);

  useEffect(() => {
    return () => {
      Object.values(saveTimeoutRef.current).forEach(timeout => {
        if (timeout) clearTimeout(timeout);
      });
    };
  }, []);

  const fetchAssessmentGrid = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/assessment-grid/course/${courseId}`, {
        params: { teacherId: userId }
      });
      
      if (response.data && response.data.length > 0) {
        const groupedData = groupAssessmentData(response.data);
        setAssessmentData(groupedData);
        
        const assignmentMap = new Map();
        const studentMap = new Map();
        
        response.data.forEach(item => {
          if (!assignmentMap.has(item.assignmentId)) {
            assignmentMap.set(item.assignmentId, {
              id: item.assignmentId,
              title: item.assignmentTitle,
              fullMark: item.maxMarks,
              deadline: item.assignmentDeadline
            });
          }
          
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

  const handleRealTimeUpdate = useCallback(async (studentId, assignmentId, field, value) => {
    const key = `${studentId}-${assignmentId}-${field}`;
    
    setSavingStatus(prev => ({ ...prev, [key]: 'saving' }));
    
    if (saveTimeoutRef.current[key]) {
      clearTimeout(saveTimeoutRef.current[key]);
    }
    
    saveTimeoutRef.current[key] = setTimeout(async () => {
      try {
        const updateData = {
          courseId: courseId,
          assignmentId: assignmentId,
          studentId: studentId,
          [field]: value
        };

        await axios.put('/assessment-grid/assessment', updateData, {
          params: { teacherId: userId }
        });

        setSavingStatus(prev => ({ ...prev, [key]: 'saved' }));
        
        setTimeout(() => {
          setSavingStatus(prev => ({ ...prev, [key]: null }));
        }, 2000);

      } catch (error) {
        console.error(`Error updating ${field}:`, error);
        setSavingStatus(prev => ({ ...prev, [key]: 'error' }));
        setTimeout(() => {
          setSavingStatus(prev => ({ ...prev, [key]: null }));
        }, 3000);
      }
    }, 800);
  }, [courseId, userId]);

  const renderSavingStatus = (studentId, assignmentId, field) => {
    const key = `${studentId}-${assignmentId}-${field}`;
    const status = savingStatus[key];
    
    if (!status) return null;
    
    return (
      <small style={{ 
        fontSize: '0.7rem', 
        color: status === 'saved' ? '#22c55e' : status === 'error' ? '#ef4444' : '#3b82f6',
        display: 'block',
        marginTop: '0.25rem'
      }}>
        {status === 'saving' && '💾 Saving...'}
        {status === 'saved' && '✅ Saved'}
        {status === 'error' && '❌ Error saving'}
      </small>
    );
  };

  const downloadSubmissionFile = async (fileId, fileName) => {
    try {
      const response = await axios.get(`/submissions/files/${fileId}/download`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      setMessage('Error downloading file: ' + (error.response?.data?.error || error.message));
      setMessageType('error');
    }
  };

  const handleCopyCheckerUpload = async () => {
    if (!copyCheckerFile || !selectedAssignment) {
      setMessage('Please select both assignment and CSV file');
      setMessageType('error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', copyCheckerFile);

      await axios.post(`/assessment-grid/copy-checker/${selectedAssignment}`, formData, {
        params: { teacherId: userId },
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage('Copy checker file uploaded and processed successfully');
      setMessageType('success');
      setShowCopyCheckerModal(false);
      setCopyCheckerFile(null);
      setSelectedAssignment(null);
      fetchAssessmentGrid();
      
    } catch (error) {
      console.error('Error uploading copy checker:', error);
      setMessage('Error uploading copy checker: ' + (error.response?.data?.error || error.message));
      setMessageType('error');
    }
  };

  const handleUpdateLatePenalties = async () => {
    try {
      await axios.post(`/assessment-grid/update-late-penalties/${courseId}`, null, {
        params: { teacherId: userId }
      });

      setMessage('Late penalties updated successfully');
      setMessageType('success');
      fetchAssessmentGrid();
      
    } catch (error) {
      console.error('Error updating late penalties:', error);
      setMessage('Error updating late penalties: ' + (error.response?.data?.error || error.message));
      setMessageType('error');
    }
  };

  const renderAssessmentGrid = () => {
    if (assignments.length === 0) {
      return (
        <div style={{ 
          textAlign: 'center', 
          padding: '4rem 2rem', 
          backgroundColor: '#f8fafc',
          borderRadius: '16px',
          border: '2px dashed #cbd5e1'
        }}>
          <span style={{ fontSize: '4rem', display: 'block', marginBottom: '1rem' }}>📊</span>
          <h3 style={{ color: '#475569', marginBottom: '0.5rem' }}>No Assignments Found</h3>
          <p style={{ color: '#64748b', fontSize: '1rem' }}>
            Create some assignments first, then return here to start grading!
          </p>
        </div>
      );
    }

    return (
      <>
        {/* Clean Assignment Header Bar */}
        <div style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '2rem',
          color: 'white',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <h4 style={{ margin: 0, color: 'white', fontWeight: '600' }}>
                📚 {assignments.length} Assignment{assignments.length !== 1 ? 's' : ''} Available
              </h4>
              <p style={{ margin: '0.5rem 0 0 0', opacity: '0.9' }}>
                Grade students and track their progress across all assignments
              </p>
            </div>
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              {assignments.map((assignment, index) => (
                <div key={assignment.id} style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(10px)',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  whiteSpace: 'nowrap'
                }}>
                  {assignment.title} ({assignment.fullMark}pts)
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modern Student Assessment Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          {assessmentData.map((studentData, studentIndex) => (
            <div key={studentData.studentId} style={{
              background: 'white',
              borderRadius: '20px',
              boxShadow: '0 6px 30px rgba(0, 0, 0, 0.1)',
              border: '1px solid #f1f5f9',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}>
              
              {/* Enhanced Student Header */}
              <div style={{ 
                background: `linear-gradient(135deg, ${
                  studentIndex % 4 === 0 ? '#667eea, #764ba2' :
                  studentIndex % 4 === 1 ? '#f093fb, #f5576c' :
                  studentIndex % 4 === 2 ? '#4facfe, #00f2fe' :
                  '#43e97b, #38f9d7'
                })`,
                padding: '2rem',
                color: 'white'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    border: '3px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    {studentData.studentName.charAt(0).toUpperCase()}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      margin: 0, 
                      fontWeight: '600', 
                      fontSize: '1.5rem',
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {studentData.studentName}
                    </h3>
                    <p style={{ 
                      margin: '0.5rem 0 0 0', 
                      opacity: '0.9',
                      fontSize: '1rem' 
                    }}>
                      📧 {studentData.studentEmail}
                    </p>
                  </div>
                  
                  <div style={{ 
                    textAlign: 'right',
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    padding: '1rem 1.5rem',
                    borderRadius: '16px',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
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
                        <>
                          <div style={{ fontSize: '1.6rem', fontWeight: 'bold' }}>
                            {totalMarks.toFixed(1)} / {totalPossible}
                          </div>
                          <div style={{ fontSize: '1.1rem', opacity: '0.9' }}>
                            📊 {percentage}%
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
              
              {/* Clean Assignment Grid */}
              <div style={{ 
                padding: '2rem',
                background: '#fafbfc'
              }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: `repeat(auto-fit, minmax(350px, 1fr))`,
                  gap: '2rem'
                }}>
                  {assignments.map((assignment) => {
                    const assessment = studentData.assessments[assignment.id];
                    
                    return (
                      <div key={assignment.id} style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '2rem',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                        transition: 'transform 0.2s ease',
                        position: 'relative'
                      }}>
                        
                        {/* Assignment Header */}
                        <div style={{ 
                          borderBottom: '2px solid #f1f5f9',
                          paddingBottom: '1.5rem',
                          marginBottom: '1.5rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                            <h5 style={{ 
                              margin: 0, 
                              fontSize: '1.2rem', 
                              fontWeight: '600', 
                              color: '#1e293b',
                              lineHeight: '1.3'
                            }}>
                              {assignment.title}
                            </h5>
                            <span style={{ 
                              background: '#3b82f6',
                              color: 'white',
                              padding: '0.4rem 0.8rem',
                              borderRadius: '25px',
                              fontSize: '0.9rem',
                              fontWeight: '600'
                            }}>
                              {assignment.fullMark} pts
                            </span>
                          </div>
                          
                          {/* Submission Status Badge */}
                          {assessment && (
                            <div>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.6rem 1rem',
                                borderRadius: '12px',
                                fontSize: '0.9rem',
                                fontWeight: '600',
                                ...(assessment.submissionStatus === 'ON_TIME' || assessment.submissionStatus === 'SUBMITTED' 
                                  ? { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }
                                  : assessment.submissionStatus === 'LATE' 
                                  ? { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }
                                  : { background: '#fecaca', color: '#991b1b', border: '1px solid #fca5a5' }
                                )
                              }}>
                                {assessment.submissionStatus === 'ON_TIME' || assessment.submissionStatus === 'SUBMITTED' 
                                  ? '✅ Submitted' 
                                  : assessment.submissionStatus === 'LATE' 
                                  ? '⏰ Late Submission' 
                                  : '❌ Not Submitted'
                                }
                              </span>
                            </div>
                          )}
                        </div>

                        {assessment ? (
                          <>
                            {/* Submission Files */}
                            {assessment.submissionFiles && assessment.submissionFiles.length > 0 && (
                              <div style={{ marginBottom: '2rem' }}>
                                <label style={{ 
                                  fontSize: '1rem', 
                                  color: '#374151', 
                                  marginBottom: '0.75rem', 
                                  display: 'block',
                                  fontWeight: '600'
                                }}>
                                  📎 Submitted Files
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                  {assessment.submissionFiles.map((file, idx) => (
                                    <button
                                      key={idx}
                                      className="btn btn-sm"
                                      onClick={() => downloadSubmissionFile(file.id, file.originalFilename || file.fileName)}
                                      style={{ 
                                        padding: '0.75rem 1rem',
                                        background: '#eff6ff',
                                        border: '1px solid #bfdbfe',
                                        color: '#1d4ed8',
                                        borderRadius: '12px',
                                        fontSize: '0.95rem',
                                        fontWeight: '500',
                                        textAlign: 'left',
                                        transition: 'all 0.2s ease',
                                        cursor: 'pointer'
                                      }}
                                      onMouseEnter={(e) => {
                                        e.target.style.background = '#dbeafe';
                                        e.target.style.transform = 'translateY(-2px)';
                                        e.target.style.boxShadow = '0 4px 12px rgba(29, 78, 216, 0.15)';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.target.style.background = '#eff6ff';
                                        e.target.style.transform = 'translateY(0)';
                                        e.target.style.boxShadow = 'none';
                                      }}
                                    >
                                      📄 {(file.originalFilename || file.fileName).length > 25 ? 
                                          `${(file.originalFilename || file.fileName).substring(0, 25)}...` : 
                                          (file.originalFilename || file.fileName)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Grade Input */}
                            <div style={{ marginBottom: '1.5rem' }}>
                              <label style={{ 
                                fontSize: '1rem', 
                                color: '#374151', 
                                marginBottom: '0.75rem', 
                                display: 'block',
                                fontWeight: '600'
                              }}>
                                🎯 Grade (Max: {assignment.fullMark} pts)
                              </label>
                              <input
                                type="number"
                                className="form-control"
                                placeholder={`Enter grade...`}
                                value={assessment.teacherMark || ''}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  
                                  if (value === '' || value === '-') {
                                    handleRealTimeUpdate(studentData.studentId, assignment.id, 'teacherMark', null);
                                  } else {
                                    const numValue = parseFloat(value);
                                    if (!isNaN(numValue)) {
                                      handleRealTimeUpdate(studentData.studentId, assignment.id, 'teacherMark', numValue);
                                    }
                                  }
                                }}
                                style={{ 
                                  fontSize: '1.1rem',
                                  padding: '1rem',
                                  borderRadius: '12px',
                                  border: '2px solid #e5e7eb',
                                  transition: 'all 0.2s ease'
                                }}
                                onFocus={(e) => {
                                  e.target.style.borderColor = '#3b82f6';
                                  e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                                }}
                                onBlur={(e) => {
                                  e.target.style.borderColor = '#e5e7eb';
                                  e.target.style.boxShadow = 'none';
                                }}
                                max={assignment.fullMark}
                              />
                              {renderSavingStatus(studentData.studentId, assignment.id, 'teacherMark')}
                            </div>

                            {/* Notes */}
                            <div style={{ marginBottom: '1.5rem' }}>
                              <label style={{ 
                                fontSize: '1rem', 
                                color: '#374151', 
                                marginBottom: '0.75rem', 
                                display: 'block',
                                fontWeight: '600'
                              }}>
                                📝 Feedback & Notes
                              </label>
                              <textarea
                                className="form-control"
                                placeholder="Add feedback or notes for the student..."
                                value={assessment.gradingNotes || ''}
                                onChange={(e) => handleRealTimeUpdate(
                                  studentData.studentId, 
                                  assignment.id, 
                                  'gradingNotes', 
                                  e.target.value
                                )}
                                rows="3"
                                style={{ 
                                  fontSize: '1rem',
                                  borderRadius: '12px',
                                  border: '2px solid #e5e7eb',
                                  transition: 'all 0.2s ease',
                                  resize: 'vertical'
                                }}
                                onFocus={(e) => {
                                  e.target.style.borderColor = '#3b82f6';
                                  e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                                }}
                                onBlur={(e) => {
                                  e.target.style.borderColor = '#e5e7eb';
                                  e.target.style.boxShadow = 'none';
                                }}
                              />
                              {renderSavingStatus(studentData.studentId, assignment.id, 'gradingNotes')}
                            </div>

                            {assessment.finalMark !== null && (
                              <div style={{ 
                                padding: '1.5rem',
                                borderRadius: '16px',
                                textAlign: 'center',
                                fontWeight: '600',
                                fontSize: '1.1rem',
                                border: '3px solid',
                                background: assessment.finalMark >= (assignment.fullMark * 0.8) 
                                  ? 'linear-gradient(135deg, #dcfce7, #bbf7d0)' 
                                  : assessment.finalMark >= (assignment.fullMark * 0.6) 
                                  ? 'linear-gradient(135deg, #fef3c7, #fde68a)' 
                                  : 'linear-gradient(135deg, #fecaca, #fca5a5)',
                                color: assessment.finalMark >= (assignment.fullMark * 0.8) 
                                  ? '#14532d'
                                  : assessment.finalMark >= (assignment.fullMark * 0.6) 
                                  ? '#92400e' 
                                  : '#7f1d1d',
                                borderColor: assessment.finalMark >= (assignment.fullMark * 0.8) 
                                  ? '#22c55e'
                                  : assessment.finalMark >= (assignment.fullMark * 0.6) 
                                  ? '#f59e0b' 
                                  : '#ef4444'
                              }}>
                                <div style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>
                                  🏆 {assessment.finalMark.toFixed(1)} / {assignment.fullMark}
                                </div>
                                <div style={{ fontSize: '1rem', opacity: '0.8' }}>
                                  {((assessment.finalMark / assignment.fullMark) * 100).toFixed(1)}% Grade
                                </div>
                                
                                {assessment.isLateSubmission && (
                                  <div style={{ 
                                    fontSize: '0.9rem', 
                                    marginTop: '0.75rem',
                                    padding: '0.5rem 1rem',
                                    background: 'rgba(245, 158, 11, 0.2)',
                                    borderRadius: '8px',
                                    color: '#92400e'
                                  }}>
                                    ⏰ Late penalty applied (-5%)
                                  </div>
                                )}
                                {assessment.copyPenaltyApplied && (
                                  <div style={{ 
                                    fontSize: '0.9rem', 
                                    marginTop: '0.75rem',
                                    padding: '0.5rem 1rem',
                                    background: 'rgba(239, 68, 68, 0.2)',
                                    borderRadius: '8px',
                                    color: '#7f1d1d'
                                  }}>
                                    🚫 Copy penalty applied
                                  </div>
                                )}
                              </div>
                            )}
                          </>
                        ) : (
                          <div style={{
                            padding: '3rem 1rem',
                            textAlign: 'center',
                            color: '#9ca3af',
                            fontSize: '1rem',
                            background: '#f9fafb',
                            borderRadius: '12px',
                            border: '2px dashed #d1d5db'
                          }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>📭</div>
                            <div style={{ fontWeight: '500' }}>No submission data available</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div style={{ 
      background: '#f8fafc',
      minHeight: '100vh',
      padding: '2rem 0'
    }}>
      <div style={{ 
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 1rem'
      }}>
        {/* Modern Header */}
        <div style={{
          background: 'white',
          borderRadius: '20px',
          boxShadow: '0 6px 30px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '2.5rem',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div>
                <h1 style={{ margin: 0, fontWeight: '600', fontSize: '2.2rem' }}>
                  📊 Assessment Grid
                </h1>
                <p style={{ margin: '0.75rem 0 0 0', opacity: '0.9', fontSize: '1.2rem' }}>
                  {courseName} • Modern grading interface with real-time updates
                </p>
              </div>
              
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button 
                  className="btn btn-light"
                  onClick={() => setShowCopyCheckerModal(true)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    fontWeight: '600',
                    fontSize: '1rem',
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  📤 Copy Checker
                </button>
                <button 
                  className="btn btn-light"
                  onClick={handleUpdateLatePenalties}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    fontWeight: '600',
                    fontSize: '1rem',
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  ⏰ Update Penalties
                </button>
                <button 
                  className="btn btn-light"
                  onClick={fetchAssessmentGrid}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.75rem',
                    padding: '0.75rem 1.5rem',
                    borderRadius: '12px',
                    fontWeight: '600',
                    fontSize: '1rem',
                    border: 'none',
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    color: 'white',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.3)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Messages */}
          {message && (
            <div style={{ padding: '1.5rem 2.5rem' }}>
              <div 
                className={`alert alert-${messageType === 'error' ? 'danger' : 'success'}`} 
                role="alert"
                style={{ 
                  fontSize: '1rem', 
                  padding: '1rem 1.5rem',
                  margin: 0,
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}
              >
                {message}
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setMessage('')}
                  style={{ fontSize: '1rem' }}
                ></button>
              </div>
            </div>
          )}
        </div>
        
        {/* Main Content */}
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '5rem 2rem',
            background: 'white',
            borderRadius: '20px',
            boxShadow: '0 6px 30px rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ 
              display: 'inline-block',
              width: '50px',
              height: '50px',
              border: '5px solid #f3f4f6',
              borderTop: '5px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              marginBottom: '1.5rem'
            }}></div>
            <p style={{ color: '#6b7280', fontSize: '1.3rem', margin: 0, fontWeight: '500' }}>
              Loading assessment grid...
            </p>
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
            backgroundColor: 'rgba(0,0,0,0.7)',
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
              maxWidth: '600px',
              width: '90%'
            }}
          >
            <div className="modal-content" style={{ 
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)', 
              border: 'none',
              borderRadius: '20px',
              overflow: 'hidden'
            }}>
              <div className="modal-header" style={{ 
                backgroundColor: '#f8f9fa', 
                borderBottom: '1px solid #dee2e6',
                padding: '2rem'
              }}>
                <h4 className="modal-title" style={{ 
                  color: '#1e293b', 
                  fontWeight: '600', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem',
                  fontSize: '1.3rem'
                }}>
                  📤 Upload Copy Checker File
                </h4>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowCopyCheckerModal(false)}
                  style={{ fontSize: '1.5rem' }}
                ></button>
              </div>
              <div className="modal-body" style={{ padding: '2rem' }}>
                <div className="mb-4">
                  <label className="form-label" style={{ 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '0.75rem',
                    fontSize: '1rem'
                  }}>
                    Select Assignment
                  </label>
                  <select 
                    className="form-select"
                    value={selectedAssignment || ''}
                    onChange={(e) => setSelectedAssignment(e.target.value)}
                    style={{
                      borderColor: '#d1d5db',
                      borderRadius: '12px',
                      padding: '1rem',
                      fontSize: '1rem'
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
                <div className="mb-4">
                  <label className="form-label" style={{ 
                    fontWeight: '600', 
                    color: '#374151', 
                    marginBottom: '0.75rem',
                    fontSize: '1rem'
                  }}>
                    CSV File
                  </label>
                  <input 
                    type="file" 
                    className="form-control"
                    accept=".csv"
                    onChange={(e) => setCopyCheckerFile(e.target.files[0])}
                    style={{
                      borderColor: '#d1d5db',
                      borderRadius: '12px',
                      padding: '1rem',
                      fontSize: '1rem'
                    }}
                  />
                  <div className="form-text" style={{ 
                    color: '#6b7280', 
                    fontSize: '0.9rem', 
                    marginTop: '0.75rem' 
                  }}>
                    📄 Upload a CSV file containing flagged student emails for plagiarism detection
                  </div>
                </div>
              </div>
              <div className="modal-footer" style={{ 
                backgroundColor: '#f8f9fa', 
                borderTop: '1px solid #dee2e6', 
                padding: '2rem'
              }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCopyCheckerModal(false)}
                  style={{
                    borderRadius: '12px',
                    padding: '0.75rem 2rem',
                    fontSize: '1rem',
                    fontWeight: '500'
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
                    borderRadius: '12px',
                    padding: '0.75rem 2rem',
                    fontSize: '1rem',
                    fontWeight: '500',
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

      {/* Add CSS for spinning animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AssessmentGrid;
