import React, { useState, useEffect, useCallback } from 'react';
import axios from '../api/axiosInstance';
import {
  FiSearch,
  FiMessageSquare,
  FiZap,
  FiCalendar,
  FiBookOpen,
  FiVideo,
  FiActivity,
  FiFileText,
  FiMapPin,
  FiLink,
  FiExternalLink,
  FiCpu,
  FiClock,
  FiSend,
  FiRefreshCw
} from 'react-icons/fi';
import { FaGraduationCap } from 'react-icons/fa6';
import './AIHelper.css';

const AIHelper = ({ courseId, user, onShowMessage, course, assignments = [], resources = [], announcements = [], submissionStatuses = {} }) => {
  // Main state
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResources, setSearchResources] = useState([]);
  const [studyTips, setStudyTips] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [studyPlan, setStudyPlan] = useState([]);
  const [activeTab, setActiveTab] = useState('search');
  const [queryHistory, setQueryHistory] = useState([]);
  
  // Chat state
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  const getAssignmentType = useCallback((title) => {
    const t = (title || '').toLowerCase();
    if (t.includes('java') || t.includes('code') || t.includes('program') || t.includes('lab')) return 'programming';
    if (t.includes('algorithm') || t.includes('structure') || t.includes('tree') || t.includes('graph')) return 'algorithm';
    if (t.includes('sql') || t.includes('data') || t.includes('db')) return 'database';
    if (t.includes('report') || t.includes('essay') || t.includes('paper')) return 'report';
    return 'general';
  }, []);

  const getRelevantResources = useCallback((type, resList) => {
    if (!resList || resList.length === 0) return [];
    return resList.filter(r => {
      const title = (r.title || '').toLowerCase();
      if (type === 'programming' && (title.includes('java') || title.includes('code') || title.includes('syntax'))) return true;
      if (type === 'algorithm' && (title.includes('algo') || title.includes('data') || title.includes('sort'))) return true;
      if (type === 'database' && (title.includes('sql') || title.includes('db') || title.includes('query'))) return true;
      return false;
    });
  }, []);

  // Generate intelligent suggestions based on course content
  const generateIntelligentSuggestions = useCallback(() => {
    const suggs = [];
    
    if (assignments && assignments.length > 0) {
      const runningAssignments = assignments.filter(assignment => {
        const deadline = new Date(assignment.deadline);
        const lateDeadline = assignment.lateSubmissionDeadline ? new Date(assignment.lateSubmissionDeadline) : null;
        const now = new Date();
        const finalDeadline = lateDeadline || deadline;
        return finalDeadline >= now;
      });

      const overdueAssignments = runningAssignments.filter(assignment => {
        const deadline = new Date(assignment.deadline);
        const now = new Date();
        const hasSubmitted = submissionStatuses[assignment.id]?.hasSubmitted;
        return deadline < now && !hasSubmitted;
      });

      const upcomingAssignments = runningAssignments.filter(assignment => {
        const deadline = new Date(assignment.deadline);
        const now = new Date();
        const daysDiff = (deadline - now) / (1000 * 60 * 60 * 24);
        return daysDiff > 0 && daysDiff <= 7;
      });

      if (overdueAssignments.length > 0) {
        suggs.push(`URGENT: ${overdueAssignments.length} overdue assignment${overdueAssignments.length > 1 ? 's' : ''} need immediate attention!`);
        
        overdueAssignments.slice(0, 2).forEach(assignment => {
          const assignmentType = getAssignmentType(assignment.title);
          const relevantResources = getRelevantResources(assignmentType, resources);
          const deadline = new Date(assignment.deadline);
          const lateDeadline = assignment.lateSubmissionDeadline ? new Date(assignment.lateSubmissionDeadline) : null;
          const now = new Date();
          
          if (lateDeadline && lateDeadline >= now) {
            const daysUntilLateDeadline = Math.ceil((lateDeadline - now) / (1000 * 60 * 60 * 24));
            suggs.push(`Complete "${assignment.title}" (Late submission ends in ${daysUntilLateDeadline} day${daysUntilLateDeadline > 1 ? 's' : ''})`);
          } else {
            const daysOverdue = Math.ceil((now - deadline) / (1000 * 60 * 60 * 24));
            suggs.push(`Complete "${assignment.title}" (${daysOverdue} days overdue)`);
          }
          
          if (relevantResources.length > 0) {
            suggs.push(`Use these resources: ${relevantResources.slice(0, 2).map(r => r.title).join(', ')}`);
          }
        });
      }

      if (upcomingAssignments.length > 0) {
        upcomingAssignments.slice(0, 2).forEach(assignment => {
          const deadline = new Date(assignment.deadline);
          const now = new Date();
          const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
          const assignmentType = getAssignmentType(assignment.title);
          const relevantResources = getRelevantResources(assignmentType, resources);
          
          suggs.push(`"${assignment.title}" due in ${daysLeft} day${daysLeft > 1 ? 's' : ''} - start now!`);
          
          if (relevantResources.length > 0) {
            suggs.push(`Recommended materials: ${relevantResources.slice(0, 2).map(r => r.title).join(', ')}`);
          }
        });
      }

      if (runningAssignments.length > 0) {
        const totalRunning = runningAssignments.length;
        if (totalRunning > upcomingAssignments.length + overdueAssignments.length) {
          suggs.push(`You have ${totalRunning - upcomingAssignments.length - overdueAssignments.length} other assignments to plan for`);
        }
      }
    }

    if (course && assignments && assignments.length > 0) {
      const courseTitle = (course.title || '').toLowerCase();
      const courseDesc = (course.description || '').toLowerCase();
      const activeAssignments = assignments.filter(a => !submissionStatuses[a.id]?.hasSubmitted);
      
      const assignmentTypes = activeAssignments.map(a => getAssignmentType(a.title));
      const uniqueTypes = [...new Set(assignmentTypes)];
      
      uniqueTypes.slice(0, 2).forEach(type => {
        if (type === 'programming' && (courseTitle.includes('java') || courseDesc.includes('java'))) {
          suggs.push(`For Java programming assignments: Set up IDE, practice syntax, test code incrementally`);
        } else if (type === 'algorithm' && (courseTitle.includes('algorithm') || courseDesc.includes('data structure'))) {
          suggs.push(`For algorithm assignments: Understand problem requirements, draw flowcharts, analyze complexity`);
        } else if (type === 'database' && (courseTitle.includes('database') || courseDesc.includes('sql'))) {
          suggs.push(`For database assignments: Practice SQL queries, understand schema design, test with sample data`);
        } else if (type === 'research' || type === 'report') {
          suggs.push(`For ${type} assignments: Gather credible sources, create outline, write incrementally`);
        }
      });
    }

    if (suggs.length < 3 && resources && resources.length > 0) {
      const highPriorityResources = resources.filter(r => 
        (r.title || '').toLowerCase().includes('tutorial') || 
        (r.title || '').toLowerCase().includes('guide') ||
        (r.title || '').toLowerCase().includes('example')
      ).slice(0, 2);
      
      if (highPriorityResources.length > 0) {
        suggs.push(`Start with key resources: ${highPriorityResources.map(r => r.title).join(', ')}`);
      }
    }

    if (suggs.length < 2) {
      suggs.push(`Break down assignment requirements into smaller, manageable tasks`);
      suggs.push(`Set specific time blocks for focused work on each assignment`);
    }

    return suggs.slice(0, 6);
  }, [assignments, course, getAssignmentType, getRelevantResources, resources, submissionStatuses]);

  // Generate personalized study plan based on course content
  const generatePersonalizedStudyPlan = useCallback(() => {
    const plan = [];
    
    if (assignments && assignments.length > 0) {
      const uncompletedAssignments = assignments.filter(a => !submissionStatuses[a.id]?.hasSubmitted);
      
      uncompletedAssignments.forEach(assignment => {
        const deadline = new Date(assignment.deadline);
        const now = new Date();
        const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
        
        let priority = 'Low';
        if (daysLeft < 0) priority = 'High';
        else if (daysLeft <= 3) priority = 'High';
        else if (daysLeft <= 7) priority = 'Medium';
        
        const assignmentType = getAssignmentType(assignment.title);
        const relevantResources = getRelevantResources(assignmentType, resources);
        
        plan.push({
          title: `Work on "${assignment.title}"`,
          description: daysLeft < 0 
            ? `Assignment is overdue by ${Math.abs(daysLeft)} day(s). Complete and submit immediately.`
            : `Due in ${daysLeft} day(s). Break into smaller milestones and review course materials.`,
          priority,
          deadline: assignment.deadline,
          suggestedResources: relevantResources.slice(0, 2).map(r => r.title)
        });
      });
    }

    return plan;
  }, [assignments, getAssignmentType, getRelevantResources, resources, submissionStatuses]);

  useEffect(() => {
    if (course && assignments && resources) {
      setSuggestions(generateIntelligentSuggestions());
      setStudyPlan(generatePersonalizedStudyPlan());
    }
  }, [course, assignments, resources, generateIntelligentSuggestions, generatePersonalizedStudyPlan]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      onShowMessage('Please enter a search query', 'warning');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('/ai-helper/resources', 
        { query: query.trim() },
        { params: { courseId, studentId: user.id } }
      );

      setSearchResources(response.data.resources || []);
      setStudyTips(response.data.studyTips || []);
      
      const newHistory = [query.trim(), ...queryHistory.filter(q => q !== query.trim())].slice(0, 10);
      setQueryHistory(newHistory);
      
      onShowMessage(`Found ${response.data.totalResults || (response.data.resources || []).length} resources for "${query}"`, 'success');
    } catch (error) {
      console.error('Error searching resources:', error);
      onShowMessage(error.response?.data?.error || 'Failed to search resources', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const searchText = suggestion.replace(/[^\w\s]/gi, '').trim();
    setQuery(searchText);
    setActiveTab('search');
  };

  const handleChatSend = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = {
      text: chatInput.trim(),
      isAI: false,
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const response = await axios.post('/chat/message', 
        { message: userMessage.text },
        { params: { courseId, studentId: user.id } }
      );

      const aiMessage = {
        text: response.data.message,
        isAI: true,
        timestamp: response.data.timestamp
      };

      setChatMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending chat message:', error);
      const errorMessage = {
        text: 'I apologize, but I encountered an error. Please try again.',
        isAI: true,
        timestamp: Date.now()
      };
      setChatMessages(prev => [...prev, errorMessage]);
      onShowMessage('Failed to send message', 'error');
    } finally {
      setIsChatLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const renderResourceIcon = (type) => {
    switch (type) {
      case 'video': return <FiVideo className="text-blue-500" />;
      case 'article': return <FiBookOpen className="text-emerald-500" />;
      case 'practice': return <FiActivity className="text-amber-500" />;
      case 'academic': return <FaGraduationCap className="text-indigo-500" />;
      default: return <FiFileText className="text-blue-500" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const tabsConfig = [
    { id: 'search', label: 'Find Resources', icon: <FiSearch size={18} />, desc: 'Search for learning materials' },
    { id: 'chat', label: 'AI Chat', icon: <FiMessageSquare size={18} />, desc: 'Ask questions directly' },
    { id: 'suggestions', label: 'Quick Help', icon: <FiZap size={18} />, desc: 'Get study tips' },
    { id: 'plan', label: 'Study Plan', icon: <FiCalendar size={18} />, desc: 'View your schedule' }
  ];

  return (
    <div className="ai-helper-container">
      {/* AI Helper Header */}
      <div className="ai-helper-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1.5rem', color: '#1e40af' }}>
              <FiCpu size={26} color="#2563eb" /> AI Study Assistant
            </h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '0.95rem' }}>
              Your intelligent companion for finding resources, getting help, and planning your studies
            </p>
          </div>
          <div style={{ 
            background: 'rgba(37, 99, 235, 0.1)', 
            padding: '0.75rem', 
            borderRadius: '12px',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FiBookOpen size={28} />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="ai-helper-tabs">
        {tabsConfig.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`ai-helper-tab ${activeTab === tab.id ? 'active' : 'inactive'}`}
          >
            <div style={{ fontSize: '1.2rem', display: 'flex', justifyContent: 'center' }}>{tab.icon}</div>
            <div style={{ fontWeight: activeTab === tab.id ? '600' : '500' }}>{tab.label}</div>
            <div style={{ 
              fontSize: '0.75rem', 
              opacity: 0.8,
              display: activeTab === tab.id ? 'block' : 'none'
            }}>
              {tab.desc}
            </div>
          </button>
        ))}
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Search Section Header */}
          <div style={{ 
            background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            border: '1px solid #bfdbfe'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FiSearch /> Find Learning Resources
            </h4>
            <p style={{ margin: 0, color: '#1e3a8a', fontSize: '0.9rem' }}>
              Search for tutorials, documentation, and learning materials from trusted educational sources
            </p>
          </div>

          {/* Search Form */}
          <div className="ai-search-form">
            <form onSubmit={handleSearch}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch' }}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What would you like to learn? (e.g., 'Java programming basics', 'data structures tutorial')"
                  className="ai-search-input"
                  disabled={isLoading}
                />
                <button 
                  type="submit"
                  className="ai-search-button btn btn-primary"
                  disabled={isLoading || !query.trim()}
                  style={{ 
                    background: isLoading || !query.trim() ? '#9ca3af' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  {isLoading ? (
                    <>
                      <FiRefreshCw className="spin" size={16} />
                      <span>Searching...</span>
                    </>
                  ) : (
                    <>
                      <FiSearch size={16} />
                      <span>Find Resources</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Query History */}
          {queryHistory.length > 0 && (
            <div style={{ marginBottom: '1.5rem' }}>
              <h5 style={{ marginBottom: '0.5rem', color: '#6b7280', fontSize: '0.875rem' }}>Recent Searches:</h5>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {queryHistory.map((historyQuery, index) => (
                  <button
                    key={index}
                    onClick={() => setQuery(historyQuery)}
                    className="btn btn-outline-secondary btn-sm"
                    style={{ 
                      fontSize: '0.75rem',
                      padding: '0.25rem 0.5rem',
                      zIndex: 1,
                      position: 'relative',
                      borderRadius: '6px'
                    }}
                  >
                    {historyQuery}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem', color: '#2563eb' }}>
                <FiRefreshCw className="spin" size={32} />
              </div>
              <p>Searching for learning resources...</p>
            </div>
          )}

          {/* Search Results */}
          {searchResources.length > 0 && !isLoading && (
            <div>
              <h4 style={{ marginBottom: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiBookOpen className="text-blue-600" /> Learning Resources ({searchResources.length})
              </h4>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                {searchResources.map((resource, index) => (
                  <div 
                    key={index}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '1.5rem',
                      background: '#fff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '1.5rem', flexShrink: 0, marginTop: '2px' }}>
                        {renderResourceIcon(resource.type)}
                      </div>
                      <div style={{ flex: 1, minWidth: '300px' }}>
                        <h6 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', lineHeight: '1.4', fontWeight: '600' }}>
                          {resource.title}
                        </h6>
                        <p style={{ margin: '0 0 0.75rem 0', color: '#64748b', fontSize: '0.875rem', lineHeight: '1.5' }}>
                          {resource.description}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: '#94a3b8', flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <FiMapPin size={12} /> {resource.source}
                          </span>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <FiLink size={12} /> {resource.type}
                          </span>
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, marginTop: '0.5rem' }}>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                          style={{ 
                            fontSize: '0.8rem',
                            padding: '0.5rem 1rem',
                            minWidth: '130px',
                            textAlign: 'center',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '6px',
                            borderRadius: '8px',
                            background: '#2563eb',
                            color: '#ffffff',
                            fontWeight: '500'
                          }}
                        >
                          <FiExternalLink size={14} /> View Resource
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Study Tips */}
              {studyTips.length > 0 && (
                <div>
                  <h4 style={{ marginBottom: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FiZap className="text-amber-500" /> Study Tips
                  </h4>
                  <div style={{ 
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '1rem'
                  }}>
                    {studyTips.map((tip, index) => (
                      <div key={index} style={{ marginBottom: index < studyTips.length - 1 ? '0.5rem' : 0 }}>
                        <span style={{ color: '#475569' }}>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No Results */}
          {searchResources.length === 0 && !isLoading && query && (
            <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#64748b' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#94a3b8' }}>
                <FiSearch size={48} />
              </div>
              <h4>No resources found</h4>
              <p>Try searching with different keywords or check the study suggestions tab.</p>
            </div>
          )}
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div style={{ position: 'relative', zIndex: 1, height: '600px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ marginBottom: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiMessageSquare className="text-blue-600" /> AI Study Assistant
          </h4>
          
          {/* Chat Messages */}
          <div className="ai-chat-messages">
            {chatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#2563eb' }}>
                  <FiCpu size={48} />
                </div>
                <h5 style={{ color: '#1e293b' }}>Welcome to AI Study Assistant!</h5>
                <p>Ask me anything about your course, programming concepts, study tips, or academic help.</p>
                <div style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
                  <strong>Try asking:</strong>
                  <ul style={{ textAlign: 'left', marginTop: '0.5rem', paddingLeft: '1rem' }}>
                    <li>"Explain object-oriented programming"</li>
                    <li>"How do I prepare for my Java exam?"</li>
                    <li>"What are data structures?"</li>
                    <li>"Help me understand algorithms"</li>
                  </ul>
                </div>
              </div>
            ) : (
              chatMessages.map((message, index) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    marginBottom: '1rem',
                    justifyContent: message.isAI ? 'flex-start' : 'flex-end'
                  }}
                >
                  <div style={{
                    maxWidth: '80%',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    background: message.isAI ? '#fff' : '#2563eb',
                    color: message.isAI ? '#1e293b' : '#fff',
                    border: message.isAI ? '1px solid #e2e8f0' : 'none',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {message.isAI && (
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <FiCpu size={12} /> AI Assistant
                      </div>
                    )}
                    {message.text}
                    <div style={{ 
                      fontSize: '0.625rem', 
                      opacity: 0.7, 
                      marginTop: '0.25rem',
                      textAlign: 'right'
                    }}>
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))
            )}
            
            {/* Loading indicator for AI response */}
            {isChatLoading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '1rem' }}>
                <div style={{
                  maxWidth: '80%',
                  padding: '0.75rem 1rem',
                  borderRadius: '12px',
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  color: '#64748b'
                }}>
                  <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <FiCpu size={12} /> AI Assistant
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiClock className="spin" size={14} />
                    <span>Thinking...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleChatSend} className="ai-chat-form">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask me anything about your course..."
              className="ai-chat-input"
              disabled={isChatLoading}
            />
            <button 
              type="submit"
              className="ai-chat-send-button"
              disabled={isChatLoading || !chatInput.trim()}
              style={{
                background: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isChatLoading ? <FiClock className="spin" size={16} /> : <FiSend size={16} />}
            </button>
          </form>
        </div>
      )}

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h4 style={{ marginBottom: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiZap className="text-amber-500" /> Personalized Study Suggestions
          </h4>
          {suggestions.length > 0 ? (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {suggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '1rem',
                    background: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    zIndex: 1
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#eff6ff';
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.borderColor = '#e2e8f0';
                  }}
                >
                  <span style={{ color: '#334155' }}>{suggestion}</span>
                  <div style={{ 
                    marginTop: '0.5rem', 
                    fontSize: '0.75rem', 
                    color: '#2563eb',
                    fontWeight: '500'
                  }}>
                    Click to search for resources →
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#64748b' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#94a3b8' }}>
                <FiZap size={48} />
              </div>
              <h4>No suggestions available</h4>
              <p>Study suggestions will appear here based on your course content.</p>
            </div>
          )}
        </div>
      )}

      {/* Study Plan Tab */}
      {activeTab === 'plan' && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h4 style={{ marginBottom: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FiCalendar className="text-blue-600" /> Your Personalized Study Plan
          </h4>
          {studyPlan.length > 0 ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {studyPlan.map((planItem, index) => (
                <div 
                  key={index}
                  style={{
                    border: '1px solid #e2e8f0',
                    borderLeft: `4px solid ${getPriorityColor(planItem.priority)}`,
                    borderRadius: '8px',
                    padding: '1.5rem',
                    background: '#fff',
                    position: 'relative',
                    zIndex: 1
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'flex-start', 
                    marginBottom: '0.75rem',
                    flexWrap: 'wrap',
                    gap: '0.5rem'
                  }}>
                    <h6 style={{ margin: 0, color: '#1e293b', flex: 1, minWidth: '200px', fontWeight: '600' }}>
                      {planItem.title}
                    </h6>
                    <span 
                      style={{ 
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        background: getPriorityColor(planItem.priority),
                        color: 'white',
                        whiteSpace: 'nowrap',
                        fontWeight: '600'
                      }}
                    >
                      {planItem.priority} Priority
                    </span>
                  </div>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#64748b', fontSize: '0.875rem' }}>
                    {planItem.description}
                  </p>
                  {planItem.deadline && (
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <FiCalendar size={12} /> Due: {formatDate(planItem.deadline)}
                    </div>
                  )}
                  {planItem.suggestedResources && planItem.suggestedResources.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: '600', color: '#475569', marginBottom: '0.25rem' }}>
                        Suggested Resources:
                      </div>
                      {planItem.suggestedResources.map((resource, resourceIndex) => (
                        <div key={resourceIndex} style={{ fontSize: '0.75rem', color: '#64748b', marginLeft: '1rem' }}>
                          • {resource}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 2rem', color: '#64748b' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#94a3b8' }}>
                <FiCalendar size={48} />
              </div>
              <h4>No study plan available</h4>
              <p>Your personalized study plan will appear here based on upcoming assignments and course content.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AIHelper;
