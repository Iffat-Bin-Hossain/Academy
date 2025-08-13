import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';
import Layout from './Layout';

const PlagiarismChecker = () => {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  
  const [user, setUser] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  
    // Plagiarism settings
  const [settings, setSettings] = useState({
    threshold: 70, // Similarity threshold percentage
    fileFilters: ['cpp', 'c', 'h', 'java', 'py', 'js', 'ts', 'kt', 'sh', 'txt'], // Supported file extensions
    fastSimilarityOnly: true // Use only fast local similarity first
  });
  
  // Analysis progress
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    stage: ''
  });
  
  // Results display
  const [selectedPair, setSelectedPair] = useState(null);
  const [showDiffModal, setShowDiffModal] = useState(false);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (user && assignmentId) {
      fetchAssignmentData();
    }
  }, [user, assignmentId]);

  const fetchUserInfo = async () => {
    try {
      const response = await axios.get('/user/me');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user info:', error);
      showMessage('Failed to load user information', 'error');
    }
  };

  const fetchAssignmentData = async () => {
    try {
      console.log('📥 Fetching assignment data for ID:', assignmentId);
      console.log('👤 User ID:', user.id);
      setLoading(true);
      
      // Fetch assignment details
      console.log('🎯 Fetching assignment details...');
      const assignmentResponse = await axios.get(`/assignments/${assignmentId}`);
      console.log('✅ Assignment response:', assignmentResponse.data);
      setAssignment(assignmentResponse.data);
      
      // Fetch submissions for this assignment
      console.log('📄 Fetching submissions...');
      const submissionsUrl = `/submissions/assignment/${assignmentId}?teacherId=${user.id}`;
      console.log('🌐 Submissions URL:', submissionsUrl);
      const submissionsResponse = await axios.get(submissionsUrl);
      console.log('✅ Submissions response:', submissionsResponse.data);
      const submissionsData = submissionsResponse.data || [];
      console.log('📊 Total submissions found:', submissionsData.length);
      setSubmissions(submissionsData);
      
    } catch (error) {
      console.error('❌ Error fetching assignment data:', error);
      console.error('📤 Error response:', error.response);
      console.error('📦 Error data:', error.response?.data);
      console.error('🔢 Error status:', error.response?.status);
      showMessage('Failed to load assignment data', 'error');
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
    }, 5000);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const startPlagiarismCheck = async () => {
    console.log('🚀 startPlagiarismCheck called');
    console.log('📝 Submissions count:', submissions.length);
    console.log('👤 User:', user);
    console.log('🆔 Assignment ID:', assignmentId);
    
    if (submissions.length < 2) {
      console.log('⚠️ Not enough submissions');
      showMessage('At least 2 submissions are required for plagiarism checking', 'warning');
      return;
    }

    console.log('✅ Starting analysis...');
    setAnalyzing(true);
    setAnalysisResults(null); // Clear previous results
    setProgress({ current: 0, total: submissions.length, stage: 'Initializing...' });
    
    try {
      console.log('🔍 Starting plagiarism check for assignment:', assignmentId);
      console.log('⚙️ Settings:', settings);
      
      // Simulate progress stages for better UX
      setTimeout(() => {
        console.log('📊 Progress stage 1');
        setProgress({ current: 1, total: submissions.length, stage: 'Processing submissions...' });
      }, 1000);
      
      setTimeout(() => {
        console.log('📊 Progress stage 2');
        setProgress({ current: Math.floor(submissions.length/2), total: submissions.length, stage: 'Running similarity analysis...' });
      }, 2000);
      
      setTimeout(() => {
        console.log('📊 Progress stage 3');
        setProgress({ current: submissions.length-1, total: submissions.length, stage: 'Generating results...' });
      }, 3000);
      
      console.log('🌐 Making API request to:', `/plagiarism/check/${assignmentId}`);
      console.log('📤 Request payload:', {
        settings: settings,
        teacherId: user.id
      });
      
      // Call backend API to start plagiarism analysis
      const response = await axios.post(`/plagiarism/check/${assignmentId}`, {
        settings: settings,
        teacherId: user.id
      });
      
      console.log('✅ Plagiarism API response received:', response);
      console.log('📦 Response data:', response.data);
      
      if (response.data.analysisId) {
        console.log('🔄 Analysis ID received, starting polling:', response.data.analysisId);
        setAnalyzing(true);
        pollAnalysisStatus(response.data.analysisId);
      } else if (response.data.results) {
        console.log('📋 Results received directly from API');
        setTimeout(() => {
          setProgress({ current: submissions.length, total: submissions.length, stage: 'Complete!' });
          setAnalysisResults(response.data.results);
          setAnalyzing(false);
          showMessage('Plagiarism analysis completed!', 'success');
        }, 4000);
      } else {
        console.log('🎭 No results or analysis ID, showing demo results');
        // Handle case where no results are returned
        setTimeout(() => {
          // Create mock results for demonstration
          const mockResults = {
            similarities: [
              {
                student1Name: "Student A",
                student2Name: "Student B", 
                similarity: 75.5,
                filesCompared: "main.cpp, utils.h",
                detectionMethod: "Local Shingles + Jaccard",
                code1: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World!" << endl;\n    return 0;\n}`,
                code2: `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello World!" << endl;\n    return 0;\n}`
              }
            ]
          };
          
          console.log('🎯 Displaying mock results');
          setProgress({ current: submissions.length, total: submissions.length, stage: 'Complete!' });
          setAnalysisResults(mockResults);
          setAnalyzing(false);
          showMessage('Plagiarism analysis completed! (Demo results shown)', 'success');
        }, 4000);
      }
    } catch (error) {
      console.error('❌ Error starting plagiarism check:', error);
      console.error('📤 Error response:', error.response);
      console.error('📦 Error data:', error.response?.data);
      console.error('🔢 Error status:', error.response?.status);
      
      let errorMessage = 'Failed to start plagiarism check';
      if (error.response?.status === 403) {
        errorMessage = 'Access denied. Only teachers can run plagiarism checks.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Assignment not found or no submissions available.';
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      console.log('💬 Showing error message:', errorMessage);
      showMessage(errorMessage, 'error');
      setAnalyzing(false);
    }
  };

  const pollAnalysisStatus = async (analysisId) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(`/plagiarism/status/${analysisId}`);
        const { status, progress: currentProgress, results } = response.data;
        
        if (currentProgress) {
          setProgress(currentProgress);
        }
        
        if (status === 'completed') {
          setAnalysisResults(results);
          setAnalyzing(false);
          clearInterval(pollInterval);
          showMessage('Plagiarism analysis completed successfully!', 'success');
        } else if (status === 'failed') {
          setAnalyzing(false);
          clearInterval(pollInterval);
          showMessage('Plagiarism analysis failed', 'error');
        }
      } catch (error) {
        console.error('Error polling analysis results:', error);
        clearInterval(pollInterval);
        setAnalyzing(false);
        showMessage('Failed to get analysis status', 'error');
      }
    }, 2000); // Poll every 2 seconds
  };

  const getSimilarityColor = (similarity) => {
    if (similarity >= 80) return '#dc2626'; // High similarity - red
    if (similarity >= 60) return '#f59e0b'; // Medium similarity - amber
    if (similarity >= 40) return '#10b981'; // Low similarity - green
    return '#64748b'; // Very low similarity - gray
  };

  const openDiffModal = (pair) => {
    setSelectedPair(pair);
    setShowDiffModal(true);
  };

  const exportResults = () => {
    if (!analysisResults) return;
    
    const csvContent = [
      ['Student 1', 'Student 2', 'Similarity %', 'Type', 'Files Compared'],
      ...analysisResults.similarities.map(pair => [
        pair.student1Name,
        pair.student2Name,
        pair.similarity.toFixed(2),
        pair.type || 'Code',
        pair.filesCompared || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plagiarism-report-${assignment?.title || 'assignment'}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
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

  if (loading) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="loading">
          <div className="spinner"></div>
          Loading assignment data...
        </div>
      </Layout>
    );
  }

  if (!assignment) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div className="card">
          <div className="card-body">
            <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
              <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>⚠️</span>
              <h4>Assignment Not Found</h4>
              <p>The assignment you're looking for doesn't exist or you don't have permission to view it.</p>
              <button className="btn btn-primary" onClick={() => navigate('/teacher')}>
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
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
          }
          .loading {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 200px;
          }
          .spinner {
            border: 4px solid #f3f4f6;
            border-top: 4px solid #3b82f6;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
          }
        `}
      </style>
      {/* Message Alert */}
      {message && (
        <div className={`alert alert-${messageType === 'error' ? 'danger' : messageType}`} style={{ marginBottom: '2rem' }}>
          {message}
        </div>
      )}

      {/* Back Button */}
      <div style={{ marginBottom: '2rem' }}>
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/teacher')}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          ← Back to Assignments
        </button>
      </div>

      {/* Assignment Header */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-body">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ margin: '0 0 0.5rem 0', color: '#1e293b' }}>
                🔍 Smart Copy Checker
              </h2>
              <h3 style={{ margin: '0 0 1rem 0', color: '#374151' }}>
                {assignment.title}
              </h3>
              <div style={{ display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#64748b', marginBottom: '1rem' }}>
                <span>📅 Due: {formatDate(assignment.deadline)}</span>
                <span>📊 Max Marks: {assignment.maxMarks}</span>
                <span>📝 Submissions: {submissions.length}</span>
              </div>
              <p style={{ margin: 0, color: '#64748b' }}>{assignment.content}</p>
            </div>
            <div style={{
              padding: '1rem 1.5rem',
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              borderRadius: '12px',
              color: 'white',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '1.125rem', fontWeight: '600' }}>
                Plagiarism Detector
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Panel */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">⚙️ Analysis Settings</h3>
          <p className="card-subtitle">Configure plagiarism detection parameters</p>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
            <div>
              <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  Similarity Threshold: {settings.threshold}%
                </label>
                <input
                  type="range"
                  min="30"
                  max="95"
                  value={settings.threshold}
                  onChange={(e) => setSettings({ ...settings, threshold: parseInt(e.target.value) })}
                  style={{ width: '100%' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                  <span>30%</span>
                  <span>95%</span>
                </div>
              </div>
            </div>

            <div>
              <div className="form-group">
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>
                  File Extensions to Analyze
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {['cpp', 'c', 'h', 'java', 'py', 'js', 'ts', 'kt', 'sh', 'txt'].map(ext => (
                    <label key={ext} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={settings.fileFilters.includes(ext)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSettings({ ...settings, fileFilters: [...settings.fileFilters, ext] });
                          } else {
                            setSettings({ ...settings, fileFilters: settings.fileFilters.filter(f => f !== ext) });
                          }
                        }}
                      />
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        background: settings.fileFilters.includes(ext) ? '#3b82f6' : '#e5e7eb',
                        color: settings.fileFilters.includes(ext) ? 'white' : '#374151',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '600'
                      }}>
                        .{ext}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
                {submissions.length} submissions ready for analysis
              </p>
            </div>
            <button
              className="btn btn-primary btn-lg"
              onClick={startPlagiarismCheck}
              disabled={analyzing || submissions.length < 2}
              style={{ minWidth: '200px' }}
            >
              {analyzing ? (
                <>
                  <span style={{ marginRight: '0.5rem' }}>⏳</span>
                  Analyzing...
                </>
              ) : analysisResults ? (
                <>
                  <span style={{ marginRight: '0.5rem' }}>🔄</span>
                  Re-run Analysis
                </>
              ) : (
                <>
                  <span style={{ marginRight: '0.5rem' }}>🔍</span>
                  Start Copy Check
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {analyzing && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-body">
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>🔍 Analysis in Progress</h4>
              <div style={{
                width: '100%',
                height: '20px',
                background: '#e5e7eb',
                borderRadius: '10px',
                overflow: 'hidden',
                marginBottom: '1rem'
              }}>
                <div style={{
                  width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 10}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #3b82f6, #1d4ed8, #7c3aed)',
                  borderRadius: '10px',
                  transition: 'width 0.8s ease',
                  animation: 'pulse 2s infinite'
                }} />
              </div>
              <p style={{ margin: '0 0 1rem 0', color: '#374151', fontSize: '1.1rem', fontWeight: '600' }}>
                {progress.stage}
              </p>
              <p style={{ margin: 0, color: '#64748b', fontSize: '0.875rem' }}>
                Processing: {progress.current}/{progress.total} submissions
              </p>
              <div style={{ marginTop: '1rem' }}>
                <div className="spinner" style={{
                  border: '4px solid #f3f4f6',
                  borderTop: '4px solid #3b82f6',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  animation: 'spin 2s linear infinite',
                  margin: '0 auto'
                }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results Panel */}
      {analysisResults && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <div className="card-header">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 className="card-title">📊 Analysis Results</h3>
                <p className="card-subtitle">
                  Found {analysisResults.similarities?.length || 0} similar pairs above {settings.threshold}% threshold
                </p>
              </div>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button className="btn btn-secondary" onClick={() => setAnalysisResults(null)}>
                  Clear Results
                </button>
                <button className="btn btn-primary" onClick={exportResults}>
                  📥 Export CSV
                </button>
              </div>
            </div>
          </div>
          <div className="card-body">
            {analysisResults.similarities && analysisResults.similarities.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {analysisResults.similarities
                  .sort((a, b) => b.similarity - a.similarity)
                  .map((pair, index) => (
                  <div key={index} className="card" style={{
                    border: `2px solid ${getSimilarityColor(pair.similarity)}`,
                    borderRadius: '8px'
                  }}>
                    <div className="card-body" style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '0.5rem' }}>
                            <h5 style={{ margin: 0, color: '#1e293b' }}>
                              {pair.student1Name} ↔ {pair.student2Name}
                            </h5>
                            <span style={{
                              padding: '0.5rem 1rem',
                              borderRadius: '20px',
                              background: getSimilarityColor(pair.similarity),
                              color: 'white',
                              fontWeight: '600',
                              fontSize: '1rem'
                            }}>
                              {pair.similarity.toFixed(1)}% Similar
                            </span>
                          </div>
                          <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                            <span style={{ marginRight: '2rem' }}>
                              📁 Files: {pair.filesCompared || 'Multiple'}
                            </span>
                            <span style={{ marginRight: '2rem' }}>
                              🔍 Method: {pair.detectionMethod || 'Local Similarity'}
                            </span>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => openDiffModal(pair)}
                          >
                            👁️ View Diff
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                <span style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem' }}>✅</span>
                <h4>No Significant Similarities Found</h4>
                <p>All submissions appear to be original work based on the current threshold settings.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Diff Modal */}
      {showDiffModal && selectedPair && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setShowDiffModal(false)}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            maxWidth: '90vw',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, color: '#1e293b' }}>
                Code Comparison - {selectedPair.similarity.toFixed(1)}% Similar
              </h3>
              <button
                onClick={() => setShowDiffModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  borderRadius: '4px'
                }}
              >
                ✕
              </button>
            </div>
            <div style={{
              padding: '1.5rem',
              overflow: 'auto',
              flex: 1,
              minHeight: '400px'
            }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', height: '100%' }}>
                <div>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>
                    {selectedPair.student1Name}
                  </h4>
                  <pre 
                    style={{
                      background: 'transparent',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      overflow: 'auto',
                      fontSize: '0.875rem',
                      lineHeight: '1.5',
                      maxHeight: '500px',
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word'
                    }}
                    className="diff-container"
                    dangerouslySetInnerHTML={{
                      __html: selectedPair.code1 || 'Code content not available'
                    }}
                  ></pre>
                </div>
                <div>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#374151' }}>
                    {selectedPair.student2Name}
                  </h4>
                  <pre 
                    style={{
                      background: 'transparent',
                      padding: '1rem',
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      overflow: 'auto',
                      fontSize: '0.875rem',
                      lineHeight: '1.5',
                      maxHeight: '500px',
                      whiteSpace: 'pre-wrap',
                      wordWrap: 'break-word'
                    }}
                    className="diff-container"
                    dangerouslySetInnerHTML={{
                      __html: selectedPair.code2 || 'Code content not available'
                    }}
                  ></pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default PlagiarismChecker;
