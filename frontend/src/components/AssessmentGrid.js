import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import axios from '../api/axiosInstance';
import { 
  FiBarChart2, 
  FiCheckCircle, 
  FiClock, 
  FiFileText, 
  FiRefreshCw, 
  FiSave, 
  FiTarget, 
  FiUpload, 
  FiXCircle,
  FiBookOpen,
  FiSearch,
  FiX,
  FiMail,
  FiPaperclip
} from 'react-icons/fi';
import './AssessmentGrid.css';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredAssessmentData, setFilteredAssessmentData] = useState([]);
  const [inputValues, setInputValues] = useState({}); // For handling temporary input values

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
        setFilteredAssessmentData(groupedData);
      } else {
        setAssessmentData([]);
        setAssignments([]);
        setStudents([]);
        setFilteredAssessmentData([]);
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

  // Filter assessment data based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredAssessmentData(assessmentData);
    } else {
      const filtered = assessmentData.filter(student => {
        const nameMatch = student.studentName.toLowerCase().includes(searchTerm.toLowerCase());
        const emailMatch = student.studentEmail.toLowerCase().includes(searchTerm.toLowerCase());
        
        // Also search through assignment titles and status
        const assignmentMatch = assignments.some(assignment => {
          const assessment = student.assessments[assignment.id];
          return assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 (assessment && assessment.submissionStatus && 
                  assessment.submissionStatus.toLowerCase().includes(searchTerm.toLowerCase()));
        });
        
        return nameMatch || emailMatch || assignmentMatch;
      });
      setFilteredAssessmentData(filtered);
    }
  }, [searchTerm, assessmentData, assignments]);

  const handleRealTimeUpdate = useCallback(async (studentId, assignmentId, field, value) => {
    const key = `${studentId}-${assignmentId}-${field}`;
    
    // Update local state immediately for real-time UI updates
    setAssessmentData(prevData => {
      const updatedData = prevData.map(student => {
        if (student.studentId === studentId) {
          const updatedStudent = { ...student };
          if (updatedStudent.assessments[assignmentId]) {
            updatedStudent.assessments[assignmentId] = {
              ...updatedStudent.assessments[assignmentId],
              [field]: value
            };
            
            // If updating teacherMark, calculate finalMark with penalties
            if (field === 'teacherMark' && value !== null && value !== undefined) {
              const assessment = updatedStudent.assessments[assignmentId];
              let finalMark = parseFloat(value);
              
              // Apply copy checker penalty: -100% (DOMINATES over all other penalties)
              if (assessment.copyPenaltyApplied) {
                const assignment = assignments.find(a => a.id === assignmentId);
                finalMark = assignment ? -assignment.fullMark : -finalMark;
              } else if (assessment.isLateSubmission || assessment.submissionStatus === 'LATE') {
                // Apply late penalty: -5% of obtained mark (only if no copy penalty)
                finalMark = finalMark * 0.95;
              }
              
              updatedStudent.assessments[assignmentId].finalMark = finalMark;
            } else if (field === 'teacherMark' && (value === null || value === undefined)) {
              updatedStudent.assessments[assignmentId].finalMark = null;
            }
          }
          return updatedStudent;
        }
        return student;
      });
      return updatedData;
    });

    // Update filtered data as well
    setFilteredAssessmentData(prevData => {
      const updatedData = prevData.map(student => {
        if (student.studentId === studentId) {
          const updatedStudent = { ...student };
          if (updatedStudent.assessments[assignmentId]) {
            updatedStudent.assessments[assignmentId] = {
              ...updatedStudent.assessments[assignmentId],
              [field]: value
            };
            
            // If updating teacherMark, calculate finalMark with penalties
            if (field === 'teacherMark' && value !== null && value !== undefined) {
              const assessment = updatedStudent.assessments[assignmentId];
              let finalMark = parseFloat(value);
              
              // Apply copy checker penalty: -100% (DOMINATES over all other penalties)
              if (assessment.copyPenaltyApplied) {
                const assignment = assignments.find(a => a.id === assignmentId);
                finalMark = assignment ? -assignment.fullMark : -finalMark;
              } else if (assessment.isLateSubmission || assessment.submissionStatus === 'LATE') {
                // Apply late penalty: -5% of obtained mark (only if no copy penalty)
                finalMark = finalMark * 0.95;
              }
              
              updatedStudent.assessments[assignmentId].finalMark = finalMark;
            } else if (field === 'teacherMark' && (value === null || value === undefined)) {
              updatedStudent.assessments[assignmentId].finalMark = null;
            }
          }
          return updatedStudent;
        }
        return student;
      });
      return updatedData;
    });
    
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
        {status === 'saving' && <><FiSave /> Saving...</>}
        {status === 'saved' && <><FiCheckCircle /> Saved</>}
        {status === 'error' && <><FiXCircle /> Error saving</>}
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

    // Client-side file type validation
    const fileName = copyCheckerFile.name.toLowerCase();
    const validExtensions = ['.csv'];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    const hasValidMimeType = copyCheckerFile.type === 'text/csv' || 
                             copyCheckerFile.type === 'application/vnd.ms-excel' ||
                             copyCheckerFile.type === 'text/plain' ||
                             copyCheckerFile.type === '';

    if (!hasValidExtension) {
      setMessage('Invalid file type. Please upload a CSV file (.csv). The file should contain student emails or IDs in the first column.');
      setMessageType('error');
      return;
    }

    // Validate file is not empty
    if (copyCheckerFile.size === 0) {
      setMessage('The selected CSV file is empty. Please upload a file with student data.');
      setMessageType('error');
      return;
    }

    // Validate file is not too large (max 5MB)
    if (copyCheckerFile.size > 5 * 1024 * 1024) {
      setMessage('File is too large. Maximum size is 5MB for copy checker CSV files.');
      setMessageType('error');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', copyCheckerFile);

      // First debug to show what would be processed
      const debugResponse = await axios.post(`/assessment-grid/debug-copy-checker/${selectedAssignment}`, formData, {
        params: { teacherId: userId },
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const debugInfo = debugResponse.data;
      console.log('Debug Copy Checker Info:', debugInfo);

      if (debugInfo.totalFlagged === 0) {
        setMessage('No students were flagged for copying in this CSV file. Please check the file format.');
        setMessageType('error');
        return;
      }

      // Show confirmation with debug info
      const studentsList = debugInfo.flaggedIdentifiers.slice(0, 10).join(', ') + 
                          (debugInfo.flaggedIdentifiers.length > 10 ? '...' : '');
      
      const confirmMessage = `Found ${debugInfo.totalFlagged} flagged student(s): ${studentsList}\n\nDo you want to apply copy penalties to these students?`;
      
      if (!window.confirm(confirmMessage)) {
        setMessage('Copy checker upload cancelled');
        setMessageType('info');
        return;
      }

      // Now apply the actual penalties
      await axios.post(`/assessment-grid/copy-checker/${selectedAssignment}`, formData, {
        params: { teacherId: userId },
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setMessage(`Copy checker processed successfully. ${debugInfo.totalFlagged} student(s) flagged for copying and penalties applied.`);
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
          <FiBarChart2 className="assessment-empty-icon" />
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
          background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
          borderRadius: '12px',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          color: 'white',
          boxShadow: '0 3px 15px rgba(102, 126, 234, 0.3)'
        }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '1rem'
          }}>
            <div>
              <h4 style={{ margin: 0, color: 'white', fontWeight: '600', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiBookOpen /> {assignments.length} Assignment{assignments.length !== 1 ? 's' : ''} Available
              </h4>
              <p style={{ margin: '0.25rem 0 0 0', opacity: '0.9', fontSize: '0.9rem' }}>
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
                  padding: '0.4rem 0.8rem',
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  whiteSpace: 'nowrap'
                }}>
                  {assignment.title} ({assignment.fullMark}pts)
                </div>
              ))}
            </div>
          </div>
          
          {/* Smart Search Bar */}
          <div style={{ position: 'relative', maxWidth: '350px' }}>
            <style>
              {`
                .search-input::placeholder {
                  color: rgba(255, 255, 255, 0.8) !important;
                  opacity: 1 !important;
                }
                .search-input::-webkit-input-placeholder {
                  color: rgba(255, 255, 255, 0.8) !important;
                }
                .search-input::-moz-placeholder {
                  color: rgba(255, 255, 255, 0.8) !important;
                  opacity: 1 !important;
                }
                .search-input:-ms-input-placeholder {
                  color: rgba(255, 255, 255, 0.8) !important;
                }
              `}
            </style>
            <input
              type="text"
              className="search-input"
              placeholder="Search students, assignments, or status..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '0.75rem 0.85rem 0.75rem 2.5rem',
                fontSize: '0.9rem',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '20px',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                outline: 'none',
                transition: 'all 0.3s ease'
              }}
              onFocus={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.25)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.5)';
              }}
              onBlur={(e) => {
                e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.3)';
              }}
            />
            <div style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: '1rem',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center'
            }}>
              <FiSearch />
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: '0.85rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.8)',
                  fontSize: '1rem',
                  cursor: 'pointer',
                  padding: '0',
                  width: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FiX />
              </button>
            )}
          </div>
          
          {/* Search Results Info */}
          {searchTerm && (
            <div style={{ 
              marginTop: '1rem', 
              fontSize: '0.9rem', 
              opacity: '0.9' 
            }}>
              Found {filteredAssessmentData.length} student{filteredAssessmentData.length !== 1 ? 's' : ''} 
              {searchTerm && ` matching "${searchTerm}"`}
            </div>
          )}
        </div>

        {/* Modern Student Assessment Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {filteredAssessmentData.map((studentData, studentIndex) => (
            <div key={studentData.studentId} style={{
              background: 'white',
              borderRadius: '12px',
              boxShadow: '0 3px 15px rgba(0, 0, 0, 0.06)',
              border: '1px solid #f1f5f9',
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}>
              
              {/* Compact Student Header */}
              <div style={{ 
                background: `linear-gradient(135deg, ${
                  studentIndex % 4 === 0 ? '#1e40af, #2563eb' :
                  studentIndex % 4 === 1 ? '#0369a1, #0284c7' :
                  studentIndex % 4 === 2 ? '#1d4ed8, #3b82f6' :
                  '#1e3a8a, #1d4ed8'
                })`,
                padding: '1rem 1.25rem',
                color: 'white'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    fontWeight: 'bold',
                    border: '2px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    {studentData.studentName.charAt(0).toUpperCase()}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      margin: 0, 
                      fontWeight: '600', 
                      fontSize: '1.1rem',
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {studentData.studentName}
                    </h3>
                    <p style={{ 
                      margin: '0.2rem 0 0 0', 
                      opacity: '0.9',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}>
                      <FiMail /> {studentData.studentEmail}
                    </p>
                  </div>
                  
                  <div style={{ 
                    textAlign: 'right',
                    background: 'rgba(255, 255, 255, 0.2)',
                    backdropFilter: 'blur(10px)',
                    padding: '0.6rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}>
                    {(() => {
                      const totalMarks = assignments.reduce((sum, assignment) => {
                        const assessment = studentData.assessments[assignment.id];
                        
                        // Calculate final mark with penalties applied
                        let finalMark = null;
                        
                        if (assessment?.teacherMark !== null && assessment?.teacherMark !== undefined) {
                          finalMark = parseFloat(assessment.teacherMark);
                          
                          // Apply copy checker penalty: -100% (negative full marks)
                          if (assessment.copyPenaltyApplied) {
                            finalMark = -assignment.fullMark;
                          } else if (assessment.isLateSubmission || assessment.submissionStatus === 'LATE') {
                            // Apply late penalty: -5% of obtained mark
                            finalMark = finalMark * 0.95;
                          }
                        } else if (assessment?.finalMark !== null && assessment?.finalMark !== undefined) {
                          finalMark = parseFloat(assessment.finalMark);
                        }
                        
                        if (finalMark !== null && !isNaN(finalMark)) {
                          return sum + finalMark;
                        }
                        return sum;
                      }, 0);
                      
                      const totalPossible = assignments.reduce((sum, assignment) => {
                        return sum + assignment.fullMark;
                      }, 0);
                      
                      const percentage = totalPossible > 0 ? ((totalMarks / totalPossible) * 100).toFixed(1) : 0;
                      
                      return (
                        <>
                          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                            {totalMarks.toFixed(1)} / {totalPossible}
                          </div>
                          <div style={{ fontSize: '0.8rem', opacity: '0.9' }}>
                            <FiBarChart2 aria-hidden="true" /> {percentage}%
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
              
              {/* Compact Assignment Grid */}
              <div style={{ 
                padding: '1.25rem',
                background: '#fafbfc'
              }}>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: `repeat(auto-fit, minmax(300px, 1fr))`,
                  gap: '1.25rem'
                }}>
                  {assignments.map((assignment) => {
                    const assessment = studentData.assessments[assignment.id];
                    
                    return (
                      <div key={assignment.id} style={{
                        background: 'white',
                        borderRadius: '10px',
                        padding: '1.25rem',
                        border: '1px solid #e2e8f0',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                        transition: 'transform 0.2s ease',
                        position: 'relative'
                      }}>
                        
                        {/* Assignment Header */}
                        <div style={{ 
                          borderBottom: '1px solid #f1f5f9',
                          paddingBottom: '0.85rem',
                          marginBottom: '0.85rem'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.6rem' }}>
                            <h5 style={{ 
                              margin: 0, 
                              fontSize: '1rem', 
                              fontWeight: '600', 
                              color: '#1e293b',
                              lineHeight: '1.3'
                            }}>
                              {assignment.title}
                            </h5>
                            <span style={{ 
                              background: '#3b82f6',
                              color: 'white',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '16px',
                              fontSize: '0.75rem',
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
                                gap: '0.3rem',
                                padding: '0.35rem 0.7rem',
                                borderRadius: '8px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                ...(assessment.submissionStatus === 'ON_TIME' || assessment.submissionStatus === 'SUBMITTED' 
                                  ? { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }
                                  : assessment.submissionStatus === 'LATE' 
                                  ? { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }
                                  : { background: '#fecaca', color: '#991b1b', border: '1px solid #fca5a5' }
                                )
                              }}>
                                {assessment.submissionStatus === 'ON_TIME' || assessment.submissionStatus === 'SUBMITTED' 
                                  ? 'Submitted'
                                  : assessment.submissionStatus === 'LATE' 
                                  ? 'Late Submission'
                                  : 'Not Submitted'
                                }
                              </span>
                            </div>
                          )}
                        </div>

                        {assessment ? (
                          <>
                            {/* Submission Files */}
                            {assessment.submissionFiles && assessment.submissionFiles.length > 0 && (
                              <div style={{ marginBottom: '1.5rem' }}>
                                <label style={{ 
                                  fontSize: '0.9rem', 
                                  color: '#374151', 
                                  marginBottom: '0.6rem', 
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  fontWeight: '600'
                                }}>
                                  <FiPaperclip /> Submitted Files
                                </label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                  {assessment.submissionFiles.map((file, idx) => (
                                    <button
                                      key={idx}
                                      className="btn btn-sm"
                                      onClick={() => downloadSubmissionFile(file.id, file.originalFilename || file.fileName)}
                                      style={{ 
                                        padding: '0.6rem 0.85rem',
                                        background: '#eff6ff',
                                        border: '1px solid #bfdbfe',
                                        color: '#1d4ed8',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
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
                                      <FiFileText aria-hidden="true" /> {(file.originalFilename || file.fileName).length > 25 ?
                                          `${(file.originalFilename || file.fileName).substring(0, 25)}...` : 
                                          (file.originalFilename || file.fileName)}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Grade Input */}
                            <div style={{ marginBottom: '1rem' }}>
                              <label style={{ 
                                fontSize: '0.85rem', 
                                color: '#374151', 
                                marginBottom: '0.4rem', 
                                display: 'block',
                                fontWeight: '600'
                              }}>
                                <FiTarget aria-hidden="true" /> Grade (Max: {assignment.fullMark} pts)
                              </label>
                              <input
                                type="number"
                                className="form-control"
                                placeholder={`Enter grade...`}
                                value={(() => {
                                  const inputKey = `${studentData.studentId}-${assignment.id}-teacherMark`;
                                  // Use temporary input value if available, otherwise use assessment value
                                  if (inputValues[inputKey] !== undefined) {
                                    return inputValues[inputKey];
                                  }
                                  return assessment.teacherMark !== null && assessment.teacherMark !== undefined ? assessment.teacherMark : '';
                                })()}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  const inputKey = `${studentData.studentId}-${assignment.id}-teacherMark`;
                                  
                                  // Store temporary input value for immediate UI feedback
                                  setInputValues(prev => ({ ...prev, [inputKey]: value }));
                                  
                                  if (value === '' || value === '-') {
                                    handleRealTimeUpdate(studentData.studentId, assignment.id, 'teacherMark', null);
                                  } else {
                                    const numValue = parseFloat(value);
                                    if (!isNaN(numValue)) {
                                      handleRealTimeUpdate(studentData.studentId, assignment.id, 'teacherMark', numValue);
                                    }
                                  }
                                }}
                                onWheel={(e) => {
                                  // Prevent scroll from changing the number input value
                                  e.target.blur();
                                  e.preventDefault();
                                }}
                                onKeyDown={(e) => {
                                  // Prevent arrow keys from changing value when scrolling
                                  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                                    if (document.activeElement !== e.target) {
                                      e.preventDefault();
                                    }
                                  }
                                }}
                                style={{ 
                                  fontSize: '0.9rem',
                                  padding: '0.65rem',
                                  borderRadius: '6px',
                                  border: '2px solid #e5e7eb',
                                  transition: 'all 0.2s ease'
                                }}
                                onFocus={(e) => {
                                  e.target.style.borderColor = '#3b82f6';
                                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                }}
                                onBlur={(e) => {
                                  e.target.style.borderColor = '#e5e7eb';
                                  e.target.style.boxShadow = 'none';
                                  
                                  // Clear temporary input value when input loses focus
                                  const inputKey = `${studentData.studentId}-${assignment.id}-teacherMark`;
                                  setInputValues(prev => {
                                    const newValues = { ...prev };
                                    delete newValues[inputKey];
                                    return newValues;
                                  });
                                }}
                                max={assignment.fullMark}
                              />
                              {renderSavingStatus(studentData.studentId, assignment.id, 'teacherMark')}
                            </div>

                            {/* Notes */}
                            <div style={{ marginBottom: '1rem' }}>
                              <label style={{ 
                                fontSize: '0.85rem', 
                                color: '#374151', 
                                marginBottom: '0.4rem', 
                                display: 'block',
                                fontWeight: '600'
                              }}>
                                <FiFileText aria-hidden="true" /> Feedback & Notes
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
                                rows="2"
                                style={{ 
                                  fontSize: '0.85rem',
                                  borderRadius: '6px',
                                  border: '2px solid #e5e7eb',
                                  transition: 'all 0.2s ease',
                                  resize: 'vertical',
                                  padding: '0.65rem'
                                }}
                                onFocus={(e) => {
                                  e.target.style.borderColor = '#3b82f6';
                                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                                }}
                                onBlur={(e) => {
                                  e.target.style.borderColor = '#e5e7eb';
                                  e.target.style.boxShadow = 'none';
                                }}
                              />
                              {renderSavingStatus(studentData.studentId, assignment.id, 'gradingNotes')}
                            </div>

                            {(assessment.teacherMark !== null && assessment.teacherMark !== undefined) || assessment.finalMark !== null ? (
                              <div style={{ 
                                padding: '1rem',
                                borderRadius: '10px',
                                textAlign: 'center',
                                fontWeight: '600',
                                fontSize: '0.95rem',
                                border: '2px solid',
                                background: (() => {
                                  // Calculate display mark with penalties
                                  let displayMark;
                                  
                                  if (assessment.teacherMark !== null && assessment.teacherMark !== undefined) {
                                    displayMark = parseFloat(assessment.teacherMark);
                                    
                                    // Apply copy checker penalty: -100% (negative full marks)
                                    if (assessment.copyPenaltyApplied) {
                                      displayMark = -assignment.fullMark;
                                    } else if (assessment.isLateSubmission || assessment.submissionStatus === 'LATE') {
                                      // Apply late penalty: -5% of obtained mark
                                      displayMark = displayMark * 0.95;
                                    }
                                  } else {
                                    displayMark = parseFloat(assessment.finalMark);
                                  }
                                  
                                  // Color based on performance
                                  if (displayMark < 0) {
                                    return 'linear-gradient(135deg, #fee2e2, #fca5a5)'; // Red for negative (copy penalty)
                                  } else if (displayMark >= (assignment.fullMark * 0.8)) {
                                    return 'linear-gradient(135deg, #dcfce7, #bbf7d0)'; // Green for excellent
                                  } else if (displayMark >= (assignment.fullMark * 0.6)) {
                                    return 'linear-gradient(135deg, #fef3c7, #fde68a)'; // Yellow for good
                                  } else {
                                    return 'linear-gradient(135deg, #fecaca, #fca5a5)'; // Light red for poor
                                  }
                                })(),
                                color: (() => {
                                  // Calculate display mark with penalties
                                  let displayMark;
                                  
                                  if (assessment.teacherMark !== null && assessment.teacherMark !== undefined) {
                                    displayMark = parseFloat(assessment.teacherMark);
                                    
                                    if (assessment.copyPenaltyApplied) {
                                      displayMark = -assignment.fullMark;
                                    } else if (assessment.isLateSubmission || assessment.submissionStatus === 'LATE') {
                                      displayMark = displayMark * 0.95;
                                    }
                                  } else {
                                    displayMark = parseFloat(assessment.finalMark);
                                  }
                                  
                                  // Text color based on performance
                                  if (displayMark < 0) {
                                    return '#7f1d1d'; // Dark red for negative
                                  } else if (displayMark >= (assignment.fullMark * 0.8)) {
                                    return '#14532d'; // Dark green
                                  } else if (displayMark >= (assignment.fullMark * 0.6)) {
                                    return '#92400e'; // Dark yellow
                                  } else {
                                    return '#7f1d1d'; // Dark red
                                  }
                                })(),
                                borderColor: (() => {
                                  // Calculate display mark with penalties
                                  let displayMark;
                                  
                                  if (assessment.teacherMark !== null && assessment.teacherMark !== undefined) {
                                    displayMark = parseFloat(assessment.teacherMark);
                                    
                                    if (assessment.copyPenaltyApplied) {
                                      displayMark = -assignment.fullMark;
                                    } else if (assessment.isLateSubmission || assessment.submissionStatus === 'LATE') {
                                      displayMark = displayMark * 0.95;
                                    }
                                  } else {
                                    displayMark = parseFloat(assessment.finalMark);
                                  }
                                  
                                  // Border color based on performance
                                  if (displayMark < 0) {
                                    return '#ef4444'; // Red for negative
                                  } else if (displayMark >= (assignment.fullMark * 0.8)) {
                                    return '#22c55e'; // Green
                                  } else if (displayMark >= (assignment.fullMark * 0.6)) {
                                    return '#f59e0b'; // Yellow
                                  } else {
                                    return '#ef4444'; // Red
                                  }
                                })()
                              }}>
                                <div style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>
                                  {(() => {
                                    // Calculate and display final mark with penalties
                                    let displayMark;
                                    
                                    if (assessment.teacherMark !== null && assessment.teacherMark !== undefined) {
                                      displayMark = parseFloat(assessment.teacherMark);
                                      
                                      if (assessment.copyPenaltyApplied) {
                                        displayMark = -assignment.fullMark;
                                        return `-${assignment.fullMark} / ${assignment.fullMark}`;
                                      } else if (assessment.isLateSubmission || assessment.submissionStatus === 'LATE') {
                                        displayMark = displayMark * 0.95;
                                        return `${displayMark.toFixed(1)} / ${assignment.fullMark}`;
                                      } else {
                                        return `${displayMark.toFixed(1)} / ${assignment.fullMark}`;
                                      }
                                    } else {
                                      displayMark = parseFloat(assessment.finalMark);
                                      return `${displayMark.toFixed(1)} / ${assignment.fullMark}`;
                                    }
                                  })()}
                                </div>
                                <div style={{ fontSize: '0.85rem', opacity: '0.8' }}>
                                  {(() => {
                                    // Calculate percentage for display
                                    let displayMark;
                                    
                                    if (assessment.teacherMark !== null && assessment.teacherMark !== undefined) {
                                      displayMark = parseFloat(assessment.teacherMark);
                                      
                                      if (assessment.copyPenaltyApplied) {
                                        return '-100% (Copy Detected)';
                                      } else if (assessment.isLateSubmission || assessment.submissionStatus === 'LATE') {
                                        displayMark = displayMark * 0.95;
                                        return `${((displayMark / assignment.fullMark) * 100).toFixed(1)}% (Late -5%)`;
                                      } else {
                                        return `${((displayMark / assignment.fullMark) * 100).toFixed(1)}% Grade`;
                                      }
                                    } else {
                                      displayMark = parseFloat(assessment.finalMark);
                                      return `${((displayMark / assignment.fullMark) * 100).toFixed(1)}% Grade`;
                                    }
                                  })()}
                                </div>
                                
                                {assessment.copyPenaltyApplied && (
                                  <div style={{ 
                                    fontSize: '0.8rem', 
                                    marginTop: '0.6rem',
                                    padding: '0.4rem 0.8rem',
                                    background: 'rgba(239, 68, 68, 0.3)',
                                    borderRadius: '6px',
                                    color: '#7f1d1d',
                                    fontWeight: 'bold'
                                  }}>
                                    COPY DETECTED: Full marks deducted
                                  </div>
                                )}
                                {(assessment.isLateSubmission || assessment.submissionStatus === 'LATE') && !assessment.copyPenaltyApplied && (
                                  <div style={{ 
                                    fontSize: '0.8rem', 
                                    marginTop: '0.6rem',
                                    padding: '0.4rem 0.8rem',
                                    background: 'rgba(245, 158, 11, 0.3)',
                                    borderRadius: '6px',
                                    color: '#92400e'
                                  }}>
                                    Late penalty applied: -5% of obtained mark
                                  </div>
                                )}
                              </div>
                            ) : null}
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
                            <FiFileText className="assessment-empty-icon" />
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
      padding: '1.5rem 0'
    }}>
      <div style={{ 
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 0.75rem'
      }}>
        {/* Modern Header */}
        <div style={{
          background: 'white',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
          marginBottom: '1.5rem',
          overflow: 'hidden'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
            padding: '1.5rem',
            color: 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h1 style={{ margin: 0, fontWeight: '600', fontSize: '1.8rem' }}>
                  <FiBarChart2 aria-hidden="true" /> Assessment Grid
                </h1>
                <p style={{ margin: '0.5rem 0 0 0', opacity: '0.9', fontSize: '1rem' }}>
                  {courseName} • Modern grading interface with real-time updates
                </p>
              </div>
              
              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button 
                  className="btn btn-light"
                  onClick={() => setShowCopyCheckerModal(true)}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '0.6rem 1rem',
                    borderRadius: '10px',
                    fontWeight: '600',
                    fontSize: '0.9rem',
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
                  <FiUpload aria-hidden="true" /> Copy Checker
                </button>
                <button 
                  className="btn btn-light"
                  onClick={handleUpdateLatePenalties}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '0.6rem 1rem',
                    borderRadius: '10px',
                    fontWeight: '600',
                    fontSize: '0.9rem',
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
                  <FiClock aria-hidden="true" /> Update Penalties
                </button>
                <button 
                  className="btn btn-light"
                  onClick={fetchAssessmentGrid}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    padding: '0.6rem 1rem',
                    borderRadius: '10px',
                    fontWeight: '600',
                    fontSize: '0.9rem',
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
                  <FiRefreshCw aria-hidden="true" /> Refresh
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
      {showCopyCheckerModal && createPortal((
        <div 
          className="copy-checker-overlay"
          style={{ 
            backgroundColor: 'rgba(0,0,0,0.7)',
            zIndex: 1055
          }} 
          tabIndex="-1"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowCopyCheckerModal(false);
            }
          }}
        >
          <div 
            className="copy-checker-dialog"
            style={{
              maxWidth: '600px'
            }}
          >
            <div className="modal-content copy-checker-content" style={{
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
                  <FiUpload aria-hidden="true" /> Upload Copy Checker File
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
                    CSV File <span style={{ color: '#ef4444', fontSize: '0.85rem' }}>*</span>
                  </label>
                  <input 
                    type="file" 
                    className="form-control"
                    accept=".csv,text/csv"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const isCSV = file.name.toLowerCase().endsWith('.csv');
                        if (!isCSV) {
                          setMessage('Please select a .csv file only');
                          setMessageType('error');
                          e.target.value = '';
                          setCopyCheckerFile(null);
                          return;
                        }
                      }
                      setCopyCheckerFile(file || null);
                    }}
                    style={{
                      borderColor: copyCheckerFile ? '#22c55e' : '#d1d5db',
                      borderRadius: '12px',
                      padding: '1rem',
                      fontSize: '1rem',
                      transition: 'border-color 0.2s ease'
                    }}
                  />
                  {copyCheckerFile && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginTop: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      background: '#f0fdf4',
                      borderRadius: '8px',
                      border: '1px solid #bbf7d0',
                      fontSize: '0.875rem',
                      color: '#15803d'
                    }}>
                      <FiCheckCircle size={14} />
                      <span>{copyCheckerFile.name}</span>
                      <span style={{ color: '#64748b', marginLeft: 'auto' }}>
                        {(copyCheckerFile.size / 1024).toFixed(1)} KB
                      </span>
                    </div>
                  )}
                  {/* CSV Format Guide */}
                  <div style={{
                    marginTop: '0.75rem',
                    padding: '0.75rem 1rem',
                    background: '#eff6ff',
                    borderRadius: '8px',
                    border: '1px solid #bfdbfe',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ fontWeight: '600', color: '#1d4ed8', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <FiFileText size={13} /> Expected CSV Format
                    </div>
                    <div style={{ color: '#1e40af', fontFamily: 'monospace', fontSize: '0.8rem', marginBottom: '0.3rem' }}>
                      studentEmail (or studentId),isFlagged
                    </div>
                    <div style={{ color: '#3b82f6', fontFamily: 'monospace', fontSize: '0.8rem' }}>
                      student@university.edu,true<br />
                      another@university.edu,false
                    </div>
                    <div style={{ color: '#64748b', marginTop: '0.4rem', fontSize: '0.78rem' }}>
                      Only rows with <strong>true</strong> in the second column will have penalties applied.
                    </div>
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
      ), document.body)}

      {/* Add CSS for spinning animation and number input fixes */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* Remove number input spinners only - input remains fully functional */
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        
        input[type=number] {
          -moz-appearance: textfield;
        }
      `}</style>
    </div>
  );
};

export default AssessmentGrid;
