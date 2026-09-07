import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../api/axiosInstance';
import Layout from './Layout';
import { 
  FiArrowLeft, 
  FiSearch, 
  FiCalendar, 
  FiAward, 
  FiFileText, 
  FiSliders, 
  FiRefreshCw, 
  FiBarChart2, 
  FiDownload, 
  FiFolder, 
  FiCpu, 
  FiEye, 
  FiCheckCircle, 
  FiAlertTriangle, 
  FiX, 
  FiClock,
  FiShield,
  FiUsers,
  FiGitCommit,
  FiCheckSquare,
  FiMessageSquare,
  FiLayers,
  FiInfo,
  FiCheck
} from 'react-icons/fi';

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
    threshold: 65,
    fileFilters: ['cpp', 'c', 'h', 'java', 'py', 'js', 'ts', 'kt', 'cs', 'go'],
    fastSimilarityOnly: false
  });
  
  // Baseline starter code state
  const [showBaselineModal, setShowBaselineModal] = useState(false);
  const [baselineFilename, setBaselineFilename] = useState('StarterCode.java');
  const [baselineCode, setBaselineCode] = useState('');
  const [baselineUploaded, setBaselineUploaded] = useState(false);

  // Analysis progress
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    stage: ''
  });
  
  // Detailed review & diff modal
  const [selectedPair, setSelectedPair] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [activeEvidenceFilter, setActiveEvidenceFilter] = useState('ALL');
  const [reviewDecision, setReviewDecision] = useState({
    decision: 'NEEDS_INVESTIGATION',
    penaltyPercentage: 0,
    notes: ''
  });
  const [savingDecision, setSavingDecision] = useState(false);
  const [filterRisk, setFilterRisk] = useState('ALL');

  const fetchUserInfo = useCallback(async () => {
    try {
      const response = await axios.get('/auth/me');
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user info:', error);
      navigate('/login');
    }
  }, [navigate]);

  const fetchAssignmentData = useCallback(async () => {
    try {
      setLoading(true);
      const userResponse = await axios.get('/auth/me');
      const currentUser = userResponse.data;
      setUser(currentUser);

      const assignmentResponse = await axios.get(`/assignments/${assignmentId}?userId=${currentUser.id}`);
      setAssignment(assignmentResponse.data);

      const submissionsUrl = `/assignments/${assignmentId}/submissions/all?teacherId=${currentUser.id}`;
      const submissionsResponse = await axios.get(submissionsUrl);
      const submissionsData = submissionsResponse.data || [];
      setSubmissions(submissionsData);
    } catch (error) {
      console.error('Error fetching assignment data:', error);
      setMessage('Failed to load assignment data');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  useEffect(() => {
    fetchUserInfo();
  }, [fetchUserInfo]);

  useEffect(() => {
    if (assignmentId) {
      fetchAssignmentData();
    }
  }, [assignmentId, fetchAssignmentData]);

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
    if (submissions.length < 2) {
      showMessage('At least 2 submissions are required for plagiarism checking', 'warning');
      return;
    }

    setAnalyzing(true);
    setAnalysisResults(null);
    setProgress({ current: 0, total: 10, stage: 'Initializing forensic static-analysis pipeline...' });
    
    try {
      const response = await axios.post(`/plagiarism/check/${assignmentId}`, {
        settings: settings,
        teacherId: user.id
      });
      
      if (response.data.analysisId) {
        pollAnalysisStatus(response.data.analysisId);
      } else {
        setAnalyzing(false);
        showMessage('Unable to initialize analysis job', 'error');
      }
    } catch (error) {
      console.error('Error starting copy check:', error);
      let errorMsg = error.response?.data?.error || 'Failed to start plagiarism check';
      showMessage(errorMsg, 'error');
      setAnalyzing(false);
    }
  };

  const pollAnalysisStatus = (analysisId) => {
    const pollInterval = setInterval(async () => {
      try {
        const statusResponse = await axios.get(`/plagiarism/status/${analysisId}`);
        const { status, progress: currentProgress } = statusResponse.data;
        
        if (currentProgress) {
          setProgress(currentProgress);
        }
        
        if (status === 'completed') {
          clearInterval(pollInterval);
          // Fetch final results
          const resultsResponse = await axios.get(`/plagiarism/results/${analysisId}`);
          setAnalysisResults(resultsResponse.data.results);
          setAnalyzing(false);
          showMessage('Forensic plagiarism analysis completed successfully!', 'success');
        } else if (status === 'failed') {
          clearInterval(pollInterval);
          setAnalyzing(false);
          showMessage('Plagiarism analysis failed or encountered an error', 'error');
        } else if (status === 'cancelled') {
          clearInterval(pollInterval);
          setAnalyzing(false);
          showMessage('Plagiarism analysis was cancelled', 'warning');
        }
      } catch (error) {
        console.error('Error polling status:', error);
        clearInterval(pollInterval);
        setAnalyzing(false);
        showMessage('Failed to retrieve analysis status', 'error');
      }
    }, 1500);
  };

  const handleUploadBaseline = async () => {
    if (!baselineCode.trim()) {
      showMessage('Please provide starter code or template content', 'warning');
      return;
    }

    try {
      await axios.post(`/plagiarism/baseline/${assignmentId}`, {
        filename: baselineFilename,
        codeContent: baselineCode,
        language: 'AUTO'
      });
      setBaselineUploaded(true);
      setShowBaselineModal(false);
      showMessage('Assignment starter code registered! Overlap with this code will be deducted from suspicion scores.', 'success');
    } catch (error) {
      console.error('Error saving baseline:', error);
      showMessage('Failed to register starter code', 'error');
    }
  };

  const handleSaveDecision = async () => {
    if (!selectedPair) return;
    setSavingDecision(true);
    try {
      await axios.post(`/plagiarism/review/${selectedPair.pairId}?reviewerId=${user.id}`, reviewDecision);
      showMessage('Human review decision recorded successfully', 'success');
      setShowReviewModal(false);
    } catch (error) {
      console.error('Error saving decision:', error);
      showMessage('Failed to save review decision', 'error');
    } finally {
      setSavingDecision(false);
    }
  };

  const openReviewModal = (pair) => {
    setSelectedPair(pair);
    setShowReviewModal(true);
  };

  const getRiskBadge = (risk, suspicion) => {
    if (risk === 'STRONG_EVIDENCE' || suspicion >= 75) {
      return { label: 'Strong Evidence', bg: '#dc2626', color: '#fff', border: '#b91c1c' };
    }
    if (risk === 'REVIEW_RECOMMENDED' || suspicion >= 50) {
      return { label: 'Review Recommended', bg: '#f59e0b', color: '#fff', border: '#d97706' };
    }
    return { label: 'No Concern', bg: '#10b981', color: '#fff', border: '#059669' };
  };

  const exportResults = () => {
    if (!analysisResults || !analysisResults.similarities) return;
    
    const csvContent = [
      ['Student 1', 'Student 2', 'Suspicion %', 'Raw Similarity %', 'Confidence %', 'Risk Level', 'Dominant Language', 'Files Compared', 'Starter Code Contribution %'],
      ...analysisResults.similarities.map(p => [
        `"${p.student1Name}"`,
        `"${p.student2Name}"`,
        p.suspicionScore?.toFixed(1) || p.similarity?.toFixed(1),
        p.similarity?.toFixed(1),
        p.confidenceScore?.toFixed(1) || 'N/A',
        p.riskCategory || 'N/A',
        p.type || 'N/A',
        `"${p.filesCompared || ''}"`,
        p.baselineContribution?.toFixed(1) || '0.0'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plagiarism-forensic-report-${assignment?.id || 'assignment'}.csv`;
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

  // Metrics
  const similarities = analysisResults?.similarities || [];
  const strongEvidenceCount = similarities.filter(p => (p.suspicionScore || p.similarity) >= 75).length;
  const reviewRecommendedCount = similarities.filter(p => (p.suspicionScore || p.similarity) >= 50 && (p.suspicionScore || p.similarity) < 75).length;
  const clusterList = analysisResults?.clusters || [];

  const filteredPairs = similarities.filter(p => {
    const s = p.suspicionScore || p.similarity;
    if (filterRisk === 'STRONG') return s >= 75;
    if (filterRisk === 'RECOMMENDED') return s >= 50 && s < 75;
    if (filterRisk === 'LOW') return s < 50;
    return true;
  });

  if (loading) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
          <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid #e2e8f0', borderTop: '4px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <span style={{ marginLeft: '1rem', color: '#475569', fontWeight: '500' }}>Loading assessment forensic system...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout user={user} onLogout={handleLogout}>
      <style>
        {`
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
          .diff-line-match { background-color: #dcfce7; color: #166534; font-weight: 600; padding: 2px 4px; border-left: 3px solid #16a34a; }
          .diff-line-diff { background-color: #fee2e2; color: #991b1b; padding: 2px 4px; border-left: 3px solid #dc2626; }
        `}
      </style>

      {/* Message Alert */}
      {message && (
        <div className={`alert alert-${messageType === 'error' ? 'danger' : messageType}`} style={{ marginBottom: '1.5rem' }}>
          {message}
        </div>
      )}

      {/* Header & Back Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <button 
          className="btn btn-secondary"
          onClick={() => navigate('/teacher')}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <FiArrowLeft /> Back to Dashboard
        </button>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowBaselineModal(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', border: baselineUploaded ? '1.5px solid #16a34a' : '1px solid #cbd5e1' }}
          >
            <FiShield style={{ color: baselineUploaded ? '#16a34a' : '#475569' }} /> 
            {baselineUploaded ? 'Starter Code Configured' : 'Configure Starter Code'}
            {baselineUploaded && <FiCheck style={{ color: '#16a34a', marginLeft: '0.2rem' }} />}
          </button>
        </div>
      </div>

      {/* Assessment Header Card */}
      <div className="card" style={{ marginBottom: '1.5rem', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
              <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase' }}>
                Forensic Engine v2.0
              </span>
              <h2 style={{ margin: 0, color: '#0f172a', fontSize: '1.5rem', fontWeight: '700' }}>
                {assignment?.title}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><FiCalendar /> Deadline: {formatDate(assignment?.deadline)}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><FiAward /> Max Marks: {assignment?.maxMarks}</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}><FiFileText /> Total Submissions: {submissions.length}</span>
            </div>
          </div>
          <button
            className="btn btn-primary"
            onClick={startPlagiarismCheck}
            disabled={analyzing || submissions.length < 2}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', fontSize: '1rem', fontWeight: '600' }}
          >
            {analyzing ? <><FiClock /> Analyzing Submissions...</> : analysisResults ? <><FiRefreshCw /> Re-run Full Analysis</> : <><FiSearch /> Run Forensic Plagiarism Check</>}
          </button>
        </div>
      </div>

      {/* Progress Bar (Visible while analyzing) */}
      {analyzing && (
        <div className="card" style={{ marginBottom: '1.5rem', padding: '1.5rem', textAlign: 'center', background: '#f8fafc', border: '1.5px solid #bfdbfe', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div className="spinner" style={{ width: '22px', height: '22px', border: '3px solid #e2e8f0', borderTop: '3px solid #2563eb', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
            <h4 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem' }}>{progress.stage || 'Analyzing student submissions...'}</h4>
          </div>
          <div style={{ width: '100%', height: '12px', background: '#e2e8f0', borderRadius: '6px', overflow: 'hidden', margin: '0.75rem 0' }}>
            <div style={{
              width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 25}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #2563eb, #3b82f6, #60a5fa)',
              transition: 'width 0.4s ease'
            }}></div>
          </div>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
            Multi-stage pipeline: Zip extraction → Inverted Winnowing → AST Subtree Comparison → CFG & Semantic Vector Alignment
          </p>
        </div>
      )}

      {/* Analysis Results Section */}
      {analysisResults && (
        <>
          {/* Executive Metrics Overview */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div className="card" style={{ padding: '1.25rem', borderRadius: '10px', background: '#fff', border: '1px solid #e2e8f0', borderLeft: '4px solid #3b82f6' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>TOTAL COMPARISONS</div>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', marginTop: '0.25rem' }}>
                {analysisResults.metadata?.comparisons || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Across {submissions.length} submissions</div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderRadius: '10px', background: '#fff', border: '1px solid #e2e8f0', borderLeft: '4px solid #dc2626' }}>
              <div style={{ fontSize: '0.8rem', color: '#dc2626', fontWeight: '600' }}>STRONG EVIDENCE PAIRS</div>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#dc2626', marginTop: '0.25rem' }}>
                {strongEvidenceCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Suspicion ≥ 75%</div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderRadius: '10px', background: '#fff', border: '1px solid #e2e8f0', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: '0.8rem', color: '#d97706', fontWeight: '600' }}>REVIEW RECOMMENDED</div>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#d97706', marginTop: '0.25rem' }}>
                {reviewRecommendedCount}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Suspicion 50% - 74%</div>
            </div>

            <div className="card" style={{ padding: '1.25rem', borderRadius: '10px', background: '#fff', border: '1px solid #e2e8f0', borderLeft: '4px solid #8b5cf6' }}>
              <div style={{ fontSize: '0.8rem', color: '#7c3aed', fontWeight: '600' }}>COLLUSION CLUSTERS</div>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#7c3aed', marginTop: '0.25rem' }}>
                {clusterList.length}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>Collaboration groups identified</div>
            </div>
          </div>

          {/* Collusion Clusters Panel (if any) */}
          {clusterList.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem', borderRadius: '12px', border: '1.5px solid #ddd6fe', background: '#f5f3ff', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <FiUsers style={{ color: '#7c3aed', fontSize: '1.25rem' }} />
                <h4 style={{ margin: 0, color: '#5b21b6', fontSize: '1.1rem', fontWeight: '700' }}>
                  Collusion Rings & Collaboration Clusters Detected
                </h4>
              </div>
              <p style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#6d28d9' }}>
                The system analyzed the multi-submission similarity matrix using graph connected components to detect potential student collusion groups.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                {clusterList.map((cl, idx) => (
                  <div key={idx} style={{ background: '#fff', border: '1px solid #c4b5fd', borderRadius: '8px', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontWeight: '700', color: '#4c1d95', fontSize: '0.95rem' }}>Cluster #{cl.clusterNumber}</span>
                      <span style={{ background: cl.riskLevel === 'HIGH' ? '#fee2e2' : '#fef3c7', color: cl.riskLevel === 'HIGH' ? '#991b1b' : '#92400e', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '700' }}>
                        {cl.riskLevel} RISK
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#4b5563', marginBottom: '0.5rem' }}>
                      <strong>{cl.studentCount} Students:</strong> {cl.students ? cl.students.map(s => s.name).join(', ') : 'Collaborating group'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      Avg. Suspicion: <strong>{cl.averageSimilarity?.toFixed(1)}%</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suspicious Pairs Listing with Filters */}
          <div className="card" style={{ marginBottom: '2rem', border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.2rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FiBarChart2 style={{ color: '#2563eb' }} /> Cross-Submission Comparison Pairs
                </h3>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                  Showing comparisons exceeding sensitivity thresholds with multi-signal explainable evidence
                </p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                  <button 
                    onClick={() => setFilterRisk('ALL')}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: filterRisk === 'ALL' ? '#2563eb' : '#fff', color: filterRisk === 'ALL' ? '#fff' : '#475569', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                  >
                    All ({similarities.length})
                  </button>
                  <button 
                    onClick={() => setFilterRisk('STRONG')}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: filterRisk === 'STRONG' ? '#dc2626' : '#fff', color: filterRisk === 'STRONG' ? '#fff' : '#475569', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Strong Evidence ({strongEvidenceCount})
                  </button>
                  <button 
                    onClick={() => setFilterRisk('RECOMMENDED')}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', background: filterRisk === 'RECOMMENDED' ? '#f59e0b' : '#fff', color: filterRisk === 'RECOMMENDED' ? '#fff' : '#475569', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                  >
                    Review ({reviewRecommendedCount})
                  </button>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={exportResults} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <FiDownload /> Export CSV
                </button>
              </div>
            </div>

            <div style={{ padding: '1.25rem' }}>
              {filteredPairs.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {filteredPairs.map((pair, index) => {
                    const suspicion = pair.suspicionScore || pair.similarity || 0;
                    const badge = getRiskBadge(pair.riskCategory, suspicion);
                    return (
                      <div key={index} style={{
                        border: `1.5px solid ${badge.border}`,
                        borderRadius: '10px',
                        background: '#fff',
                        padding: '1.25rem',
                        transition: 'box-shadow 0.2s ease',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                          <div style={{ flex: 1, minWidth: '300px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                              <h4 style={{ margin: 0, color: '#0f172a', fontSize: '1.1rem', fontWeight: '700' }}>
                                {pair.student1Name} ↔ {pair.student2Name}
                              </h4>
                              <span style={{
                                padding: '0.25rem 0.6rem',
                                borderRadius: '20px',
                                background: badge.bg,
                                color: badge.color,
                                fontSize: '0.75rem',
                                fontWeight: '700'
                              }}>
                                {badge.label}
                              </span>
                              {pair.clusterId && (
                                <span style={{ background: '#ede9fe', color: '#6d28d9', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>
                                  Cluster #{pair.clusterId}
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: '#475569', marginBottom: '0.6rem', flexWrap: 'wrap' }}>
                              <span>Suspicion Score: <strong>{suspicion.toFixed(1)}%</strong></span>
                              <span>Raw Similarity: <strong>{(pair.similarity || 0).toFixed(1)}%</strong></span>
                              <span>Confidence: <strong>{(pair.confidenceScore || 85).toFixed(1)}%</strong></span>
                              {pair.baselineContribution > 0 && (
                                <span style={{ color: '#059669' }}>Starter Code Discount: <strong>{pair.baselineContribution.toFixed(1)}%</strong></span>
                              )}
                            </div>

                            {/* Summary Rationale */}
                            {pair.summaryRationale && (
                              <div style={{ fontSize: '0.825rem', color: '#334155', background: '#f1f5f9', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '0.75rem' }}>
                                <strong>Forensic Summary:</strong> {pair.summaryRationale}
                              </div>
                            )}

                            {/* Engine Signal Pills */}
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {pair.exactMatchScore > 0 && (
                                <span style={{ background: '#fef2f2', color: '#991b1b', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600' }}>
                                  Exact Match: {pair.exactMatchScore.toFixed(0)}%
                                </span>
                              )}
                              <span style={{ background: '#eff6ff', color: '#1e40af', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600' }}>
                                AST Structure: {(pair.astScore || 0).toFixed(0)}%
                              </span>
                              <span style={{ background: '#f0fdf4', color: '#166534', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600' }}>
                                Token Winnowing: {(pair.tokenScore || 0).toFixed(0)}%
                              </span>
                              <span style={{ background: '#faf5ff', color: '#6b21a8', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600' }}>
                                CFG Flow: {(pair.cfgScore || 0).toFixed(0)}%
                              </span>
                            </div>
                          </div>

                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => openReviewModal(pair)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontWeight: '600', padding: '0.5rem 1rem' }}
                            >
                              <FiEye /> Inspect Forensic Evidence & Diff
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <FiCheckCircle style={{ fontSize: '3rem', color: '#10b981', marginBottom: '0.75rem' }} />
                  <h4 style={{ margin: 0, color: '#1e293b' }}>No Submissions Exceeded the Suspicion Threshold</h4>
                  <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>All submitted code exhibits original variation or is accounted for by assignment baseline starter code.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Starter Code Configuration Modal */}
      {showBaselineModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1050
        }} onClick={() => setShowBaselineModal(false)}>
          <div style={{ background: '#fff', borderRadius: '16px', width: '640px', maxWidth: '94vw', padding: '1.75rem', boxShadow: '0 25px 60px -15px rgba(15, 23, 42, 0.3)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem' }}>
                <FiShield style={{ color: '#2563eb' }} /> Configure Assignment Starter Code
              </h3>
              <button onClick={() => setShowBaselineModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.25rem' }}><FiX /></button>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Filename (e.g. Solution.java, main.cpp):</label>
              <input 
                type="text" 
                value={baselineFilename} 
                onChange={e => setBaselineFilename(e.target.value)} 
                className="form-control" 
                style={{ width: '100%', padding: '0.5rem', borderRadius: '6px', border: '1px solid #cbd5e1' }}
              />
            </div>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontWeight: '600', fontSize: '0.85rem', marginBottom: '0.25rem' }}>Starter / Boilerplate Code:</label>
              <textarea 
                rows="8" 
                value={baselineCode} 
                onChange={e => setBaselineCode(e.target.value)} 
                placeholder="// Paste assignment starter code, skeleton methods, or header files here..."
                style={{ width: '100%', padding: '0.75rem', borderRadius: '6px', border: '1px solid #cbd5e1', fontFamily: 'monospace', fontSize: '0.85rem' }}
              ></textarea>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowBaselineModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUploadBaseline}>Save Starter Code Baseline</button>
            </div>
          </div>
        </div>
      )}

      {/* Forensic Deep Review Modal (Side-by-Side Code View & Evidence Items) */}
      {showReviewModal && selectedPair && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100
        }} onClick={() => setShowReviewModal(false)}>
          <div style={{
            background: '#fff', borderRadius: '16px', width: '96vw', maxWidth: '1440px', height: '92vh', maxHeight: '92vh',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)'
          }} onClick={e => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <h3 style={{ margin: 0, color: '#0f172a', fontSize: '1.25rem', fontWeight: '700' }}>
                    Forensic Comparison: {selectedPair.student1Name} ↔ {selectedPair.student2Name}
                  </h3>
                  <span style={{
                    padding: '0.25rem 0.6rem', borderRadius: '20px',
                    background: getRiskBadge(selectedPair.riskCategory, selectedPair.suspicionScore || selectedPair.similarity).bg,
                    color: '#fff', fontSize: '0.75rem', fontWeight: '700'
                  }}>
                    {getRiskBadge(selectedPair.riskCategory, selectedPair.suspicionScore || selectedPair.similarity).label}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.8rem', color: '#64748b', marginTop: '0.35rem' }}>
                  <span>Suspicion: <strong>{(selectedPair.suspicionScore || selectedPair.similarity).toFixed(1)}%</strong></span>
                  <span>Raw Overlap: <strong>{(selectedPair.similarity || 0).toFixed(1)}%</strong></span>
                  <span>Confidence: <strong>{(selectedPair.confidenceScore || 85).toFixed(1)}%</strong></span>
                  <span>Files: <strong>{selectedPair.filesCompared || 'Source files'}</strong></span>
                </div>
              </div>
              <button onClick={() => setShowReviewModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}><FiX /></button>
            </div>

            {/* Modal Content: 2-Column Split (Left: Evidence Drawer & Verdict, Right: Dual-Pane Code) */}
            <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', flex: 1, overflow: 'hidden' }}>
              
              {/* Left Column: Forensic Evidence & Human Verdict */}
              <div style={{ borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', background: '#f8fafc', overflowY: 'auto', padding: '1rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.95rem', fontWeight: '700', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FiInfo style={{ color: '#2563eb' }} /> Evidence Items ({selectedPair.evidenceItems?.length || 0})
                </h4>
                
                {/* Evidence List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginBottom: '1.5rem' }}>
                  {selectedPair.evidenceItems && selectedPair.evidenceItems.length > 0 ? (
                    selectedPair.evidenceItems.map((ev, i) => (
                      <div key={i} style={{
                        background: '#fff', border: ev.isBaseline ? '1px solid #86efac' : '1px solid #cbd5e1',
                        borderRadius: '6px', padding: '0.75rem', fontSize: '0.8rem'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '600', marginBottom: '0.25rem' }}>
                          <span style={{ color: ev.isBaseline ? '#16a34a' : '#1e40af' }}>{ev.evidenceType}</span>
                          <span style={{ color: '#64748b' }}>{ev.similarityScore?.toFixed(0)}% match</span>
                        </div>
                        <p style={{ margin: 0, color: '#334155' }}>{ev.explanation}</p>
                        {ev.startLine1 > 0 && (
                          <div style={{ marginTop: '0.35rem', fontSize: '0.7rem', color: '#64748b' }}>
                            Line {ev.startLine1}–{ev.endLine1} (File A) ↔ Line {ev.startLine2}–{ev.endLine2} (File B)
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                      No isolated anomalies found; overall similarity is distributed across general file structures.
                    </div>
                  )}
                </div>

                {/* Human Review Decision Panel */}
                <div style={{ background: '#fff', border: '1.5px solid #cbd5e1', borderRadius: '8px', padding: '1rem', marginTop: 'auto' }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                    <FiCheckSquare style={{ color: '#16a34a' }} /> Human Instructor Verdict
                  </h4>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569' }}>Decision:</label>
                    <select 
                      value={reviewDecision.decision} 
                      onChange={e => setReviewDecision({ ...reviewDecision, decision: e.target.value })}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                    >
                      <option value="CONFIRMED_PLAGIARISM">Confirmed Plagiarism (Violation)</option>
                      <option value="FALSE_POSITIVE">False Positive (Independent Work)</option>
                      <option value="NEEDS_INVESTIGATION">Needs Investigation (Interview Student)</option>
                      <option value="CLEARED">Cleared (Permitted Collaboration)</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569' }}>Penalty Percentage (%):</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={reviewDecision.penaltyPercentage} 
                      onChange={e => setReviewDecision({ ...reviewDecision, penaltyPercentage: parseFloat(e.target.value) || 0 })}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                    />
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: '#475569' }}>Audit Notes:</label>
                    <textarea 
                      rows="2"
                      value={reviewDecision.notes} 
                      onChange={e => setReviewDecision({ ...reviewDecision, notes: e.target.value })}
                      placeholder="Notes for student disciplinary or grading records..."
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '0.8rem' }}
                    ></textarea>
                  </div>
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={handleSaveDecision}
                    disabled={savingDecision}
                    style={{ width: '100%', fontWeight: '600' }}
                  >
                    {savingDecision ? 'Saving...' : 'Record Human Verdict'}
                  </button>
                </div>
              </div>

              {/* Right Column: Dual-Pane Synchronized Code Viewer */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden', height: '100%' }}>
                {/* Student 1 Code Pane */}
                <div style={{ borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ padding: '0.6rem 1rem', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontWeight: '700', fontSize: '0.85rem', color: '#1e293b' }}>
                    Student A: {selectedPair.student1Name}
                  </div>
                  <pre style={{
                    margin: 0, padding: '1rem', flex: 1, overflow: 'auto',
                    fontFamily: 'Consolas, Monaco, monospace', fontSize: '0.8rem', lineHeight: '1.5',
                    background: '#ffffff', color: '#1e293b', whiteSpace: 'pre-wrap', wordBreak: 'break-all'
                  }}>
                    {selectedPair.code1 || '// No source code available'}
                  </pre>
                </div>

                {/* Student 2 Code Pane */}
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <div style={{ padding: '0.6rem 1rem', background: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontWeight: '700', fontSize: '0.85rem', color: '#1e293b' }}>
                    Student B: {selectedPair.student2Name}
                  </div>
                  <pre style={{
                    margin: 0, padding: '1rem', flex: 1, overflow: 'auto',
                    fontFamily: 'Consolas, Monaco, monospace', fontSize: '0.8rem', lineHeight: '1.5',
                    background: '#ffffff', color: '#1e293b', whiteSpace: 'pre-wrap', wordBreak: 'break-all'
                  }}>
                    {selectedPair.code2 || '// No source code available'}
                  </pre>
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
