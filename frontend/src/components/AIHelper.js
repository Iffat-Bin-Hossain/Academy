import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';
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

  // UI state
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (course && assignments && resources) {
      loadSuggestions();
      loadStudyPlan();
    }
  }, [courseId, user, course, assignments, resources, announcements, submissionStatuses]);

  const loadSuggestions = () => {
    try {
      const generatedSuggestions = generateIntelligentSuggestions();
      setSuggestions(generatedSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
    }
  };

  const loadStudyPlan = () => {
    try {
      const generatedPlan = generatePersonalizedStudyPlan();
      setStudyPlan(generatedPlan);
    } catch (error) {
      console.error('Error generating study plan:', error);
    }
  };

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
      
      // Add to query history
      const newHistory = [query.trim(), ...queryHistory.filter(q => q !== query.trim())].slice(0, 10);
      setQueryHistory(newHistory);
      
      onShowMessage(`Found ${response.data.totalResults} resources for "${query}"`, 'success');
    } catch (error) {
      console.error('Error searching resources:', error);
      onShowMessage(error.response?.data?.error || 'Failed to search resources', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    // Extract searchable text from suggestion (remove emoji)
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

  const getResourceIcon = (type) => {
    switch (type) {
      case 'video': return '🎥';
      case 'article': return '📖';
      case 'practice': return '🏃‍♂️';
      case 'academic': return '🎓';
      default: return '📚';
    }
  };

  // Generate intelligent suggestions based on course content
  const generateIntelligentSuggestions = () => {
    const suggestions = [];
    
    // Analyze only open assignments (exclude closed ones regardless of submission status)
    if (assignments && assignments.length > 0) {
      const runningAssignments = assignments.filter(assignment => {
        const deadline = new Date(assignment.deadline);
        const lateDeadline = assignment.lateSubmissionDeadline ? new Date(assignment.lateSubmissionDeadline) : null;
        const now = new Date();
        const hasSubmitted = submissionStatuses[assignment.id]?.hasSubmitted;
        
        // Check if assignment is completely closed (past late submission deadline or past regular deadline if no late deadline)
        const finalDeadline = lateDeadline || deadline;
        const isCompletelyClosed = finalDeadline < now;
        
        // Only include assignments that are:
        // 1. Not submitted yet AND
        // 2. Not completely closed (still accepting submissions)
        return !hasSubmitted && !isCompletelyClosed;
      });

      const overdueAssignments = runningAssignments.filter(assignment => {
        const deadline = new Date(assignment.deadline);
        const lateDeadline = assignment.lateSubmissionDeadline ? new Date(assignment.lateSubmissionDeadline) : null;
        const now = new Date();
        
        // Assignment is overdue if past regular deadline but still within late submission window (if exists)
        return deadline < now && (!lateDeadline || lateDeadline >= now);
      });

      const upcomingAssignments = runningAssignments.filter(assignment => {
        const deadline = new Date(assignment.deadline);
        const now = new Date();
        const daysDiff = (deadline - now) / (1000 * 60 * 60 * 24);
        return daysDiff > 0 && daysDiff <= 7; // Due within a week
      });

      // Priority suggestions for overdue assignments
      if (overdueAssignments.length > 0) {
        suggestions.push(`🚨 URGENT: ${overdueAssignments.length} overdue assignment${overdueAssignments.length > 1 ? 's' : ''} need immediate attention!`);
        
        // Show specific overdue assignments with targeted resources
        overdueAssignments.slice(0, 2).forEach(assignment => {
          const assignmentType = getAssignmentType(assignment.title);
          const relevantResources = getRelevantResources(assignmentType, resources);
          const deadline = new Date(assignment.deadline);
          const lateDeadline = assignment.lateSubmissionDeadline ? new Date(assignment.lateSubmissionDeadline) : null;
          const now = new Date();
          
          if (lateDeadline && lateDeadline >= now) {
            // Late submission is still allowed
            const daysUntilLateDeadline = Math.ceil((lateDeadline - now) / (1000 * 60 * 60 * 24));
            suggestions.push(`📝 Complete "${assignment.title}" (Late submission ends in ${daysUntilLateDeadline} day${daysUntilLateDeadline > 1 ? 's' : ''})`);
          } else {
            // Regular overdue assignment
            const daysOverdue = Math.ceil((now - deadline) / (1000 * 60 * 60 * 24));
            suggestions.push(`📝 Complete "${assignment.title}" (${daysOverdue} days overdue)`);
          }
          
          if (relevantResources.length > 0) {
            suggestions.push(`📚 Use these resources: ${relevantResources.slice(0, 2).map(r => r.title).join(', ')}`);
          }
        });
      }

      // Priority suggestions for upcoming assignments
      if (upcomingAssignments.length > 0) {
        upcomingAssignments.slice(0, 2).forEach(assignment => {
          const deadline = new Date(assignment.deadline);
          const now = new Date();
          const daysLeft = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
          const assignmentType = getAssignmentType(assignment.title);
          const relevantResources = getRelevantResources(assignmentType, resources);
          
          suggestions.push(`⏰ "${assignment.title}" due in ${daysLeft} day${daysLeft > 1 ? 's' : ''} - start now!`);
          
          if (relevantResources.length > 0) {
            suggestions.push(`� Recommended materials: ${relevantResources.slice(0, 2).map(r => r.title).join(', ')}`);
          }
        });
      }

      // General assignment preparation tips
      if (runningAssignments.length > 0) {
        const totalRunning = runningAssignments.length;
        if (totalRunning > upcomingAssignments.length + overdueAssignments.length) {
          suggestions.push(`📋 You have ${totalRunning - upcomingAssignments.length - overdueAssignments.length} other assignments to plan for`);
        }
      }
    }

    // Course-specific suggestions based on assignment types and course content
    if (course && assignments && assignments.length > 0) {
      const courseTitle = course.title.toLowerCase();
      const courseDesc = course.description?.toLowerCase() || '';
      const activeAssignments = assignments.filter(a => !submissionStatuses[a.id]?.hasSubmitted);
      
      // Get common assignment types from active assignments
      const assignmentTypes = activeAssignments.map(a => getAssignmentType(a.title));
      const uniqueTypes = [...new Set(assignmentTypes)];
      
      uniqueTypes.slice(0, 2).forEach(type => {
        if (type === 'programming' && (courseTitle.includes('java') || courseDesc.includes('java'))) {
          suggestions.push(`� For Java programming assignments: Set up IDE, practice syntax, test code incrementally`);
        } else if (type === 'algorithm' && (courseTitle.includes('algorithm') || courseDesc.includes('data structure'))) {
          suggestions.push(`🧮 For algorithm assignments: Understand problem requirements, draw flowcharts, analyze complexity`);
        } else if (type === 'database' && (courseTitle.includes('database') || courseDesc.includes('sql'))) {
          suggestions.push(`🗄️ For database assignments: Practice SQL queries, understand schema design, test with sample data`);
        } else if (type === 'research' || type === 'report') {
          suggestions.push(`📄 For ${type} assignments: Gather credible sources, create outline, write incrementally`);
        }
      });
    }

    // Limited resource suggestions (only if no specific assignment guidance was given)
    if (suggestions.length < 3 && resources && resources.length > 0) {
      const highPriorityResources = resources.filter(r => 
        r.title.toLowerCase().includes('tutorial') || 
        r.title.toLowerCase().includes('guide') ||
        r.title.toLowerCase().includes('example')
      ).slice(0, 2);
      
      if (highPriorityResources.length > 0) {
        suggestions.push(`� Start with key resources: ${highPriorityResources.map(r => r.title).join(', ')}`);
      }
    }

    // Only add general tips if we have very few specific suggestions
    if (suggestions.length < 2) {
      suggestions.push(`� Break down assignment requirements into smaller, manageable tasks`);
      suggestions.push(`⏱️ Set specific time blocks for focused work on each assignment`);
    }

    return suggestions.slice(0, 6); // Limit to 6 focused suggestions
  };

  // Generate personalized study plan based on course content
  const generatePersonalizedStudyPlan = () => {
    const studyPlan = [];
    const now = new Date();

    // Analyze assignments and create study plan items (only for open assignments)
    if (assignments && assignments.length > 0) {
      assignments.forEach(assignment => {
        const deadline = new Date(assignment.deadline);
        const lateDeadline = assignment.lateSubmissionDeadline ? new Date(assignment.lateSubmissionDeadline) : null;
        const hasSubmitted = submissionStatuses[assignment.id]?.hasSubmitted;
        
        // Check if assignment is completely closed (past late submission deadline or past regular deadline if no late deadline)
        const finalDeadline = lateDeadline || deadline;
        const isCompletelyClosed = finalDeadline < now;
        
        // Only include assignments that are:
        // 1. Not submitted yet AND
        // 2. Not completely closed (still accepting submissions)
        if (!hasSubmitted && !isCompletelyClosed) {
          const isOverdue = deadline < now;
          const daysUntilDeadline = Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
          
          let priority = 'Medium';
          let description = `Work on the assignment: ${assignment.title}`;
          let suggestedResources = [];

          if (isOverdue && lateDeadline) {
            // Assignment is overdue but late submission is still allowed
            const daysUntilLateDeadline = Math.ceil((lateDeadline - now) / (1000 * 60 * 60 * 24));
            priority = 'High';
            description = `URGENT: Late submission deadline in ${daysUntilLateDeadline} day${daysUntilLateDeadline > 1 ? 's' : ''} - ${assignment.title}`;
          } else if (isOverdue) {
            // Assignment is overdue and no late submission allowed - this shouldn't happen due to the filter above
            priority = 'High';
            description = `URGENT: Complete overdue assignment - ${assignment.title}`;
          } else if (daysUntilDeadline <= 3) {
            priority = 'High';
            description = `Priority assignment due soon - ${assignment.title}`;
          } else if (daysUntilDeadline <= 7) {
            priority = 'Medium';
            description = `Start working on - ${assignment.title}`;
          } else {
            priority = 'Low';
            description = `Review requirements and plan for - ${assignment.title}`;
          }

          // Add relevant resources as suggestions
          if (resources && resources.length > 0) {
            const relevantResources = resources.filter(resource => 
              resource.title.toLowerCase().includes(assignment.title.toLowerCase().split(' ')[0]) ||
              resource.description?.toLowerCase().includes(assignment.title.toLowerCase().split(' ')[0])
            ).slice(0, 3);
            
            if (relevantResources.length > 0) {
              suggestedResources = relevantResources.map(r => r.title);
            } else {
              suggestedResources = resources.slice(0, 2).map(r => r.title);
            }
          }

          studyPlan.push({
            title: assignment.title,
            description,
            priority,
            deadline: assignment.deadline,
            suggestedResources
          });
        }
      });
    }

    // Add general study topics based on course content
    if (course) {
      const courseTitle = course.title.toLowerCase();
      const courseDesc = course.description?.toLowerCase() || '';

      // Add course-specific study topics
      if (courseTitle.includes('java')) {
        studyPlan.push({
          title: 'Master Java Fundamentals',
          description: 'Focus on variables, data types, operators, and control structures',
          priority: 'Medium',
          deadline: null,
          suggestedResources: ['Java documentation', 'Online Java tutorials', 'Practice coding exercises']
        });
      }

      if (courseTitle.includes('data structure') || courseDesc.includes('data structure')) {
        studyPlan.push({
          title: 'Study Core Data Structures',
          description: 'Learn arrays, linked lists, stacks, queues, trees, and graphs',
          priority: 'Medium',
          deadline: null,
          suggestedResources: ['Data Structures textbook', 'Visual algorithm tools', 'Coding practice platforms']
        });
      }
    }

    // Add review sessions based on announcements
    if (announcements && announcements.length > 0) {
      const recentAnnouncements = announcements
        .filter(announcement => {
          const announcementDate = new Date(announcement.createdAt);
          const daysSince = (now - announcementDate) / (1000 * 60 * 60 * 24);
          return daysSince <= 7; // Recent announcements
        })
        .slice(0, 2);

      recentAnnouncements.forEach(announcement => {
        if (announcement.title.toLowerCase().includes('exam') || 
            announcement.title.toLowerCase().includes('test') ||
            announcement.title.toLowerCase().includes('quiz')) {
          studyPlan.push({
            title: 'Prepare for Upcoming Assessment',
            description: `Review materials related to: ${announcement.title}`,
            priority: 'High',
            deadline: null,
            suggestedResources: ['Course notes', 'Practice problems', 'Study group sessions']
          });
        }
      });
    }

    // Sort by priority (High, Medium, Low)
    const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
    studyPlan.sort((a, b) => {
      if (a.deadline && b.deadline) {
        return new Date(a.deadline) - new Date(b.deadline);
      }
      if (a.deadline && !b.deadline) return -1;
      if (!a.deadline && b.deadline) return 1;
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    return studyPlan.slice(0, 10); // Limit to 10 items
  };

  // Helper function to identify assignment type based on title
  const getAssignmentType = (title) => {
    const titleLower = title.toLowerCase();
    
    if (titleLower.includes('program') || titleLower.includes('code') || titleLower.includes('java') || titleLower.includes('implement')) {
      return 'programming';
    } else if (titleLower.includes('algorithm') || titleLower.includes('sort') || titleLower.includes('search') || titleLower.includes('complexity')) {
      return 'algorithm';
    } else if (titleLower.includes('database') || titleLower.includes('sql') || titleLower.includes('query') || titleLower.includes('schema')) {
      return 'database';
    } else if (titleLower.includes('research') || titleLower.includes('study') || titleLower.includes('analysis')) {
      return 'research';
    } else if (titleLower.includes('report') || titleLower.includes('document') || titleLower.includes('write')) {
      return 'report';
    } else if (titleLower.includes('design') || titleLower.includes('model') || titleLower.includes('diagram')) {
      return 'design';
    } else if (titleLower.includes('test') || titleLower.includes('debug') || titleLower.includes('fix')) {
      return 'testing';
    }
    return 'general';
  };

  // Helper function to get relevant resources based on assignment type
  const getRelevantResources = (assignmentType, allResources) => {
    if (!allResources || allResources.length === 0) return [];
    
    const relevantResources = allResources.filter(resource => {
      const resourceTitle = resource.title.toLowerCase();
      const resourceDesc = resource.description?.toLowerCase() || '';
      const searchText = `${resourceTitle} ${resourceDesc}`;
      
      switch (assignmentType) {
        case 'programming':
          return searchText.includes('program') || searchText.includes('code') || 
                 searchText.includes('java') || searchText.includes('tutorial') ||
                 searchText.includes('example') || searchText.includes('implement');
        
        case 'algorithm':
          return searchText.includes('algorithm') || searchText.includes('sort') ||
                 searchText.includes('search') || searchText.includes('complexity') ||
                 searchText.includes('structure') || searchText.includes('tree');
        
        case 'database':
          return searchText.includes('database') || searchText.includes('sql') ||
                 searchText.includes('query') || searchText.includes('schema') ||
                 searchText.includes('table') || searchText.includes('relation');
        
        case 'research':
        case 'report':
          return searchText.includes('research') || searchText.includes('paper') ||
                 searchText.includes('reference') || searchText.includes('citation') ||
                 searchText.includes('methodology') || searchText.includes('analysis');
        
        case 'design':
          return searchText.includes('design') || searchText.includes('model') ||
                 searchText.includes('diagram') || searchText.includes('pattern') ||
                 searchText.includes('architecture') || searchText.includes('uml');
        
        case 'testing':
          return searchText.includes('test') || searchText.includes('debug') ||
                 searchText.includes('junit') || searchText.includes('validation') ||
                 searchText.includes('verification') || searchText.includes('quality');
        
        default:
          return true; // Include all resources for general assignments
      }
    });
    
    // If no specific matches found, return most relevant general resources
    if (relevantResources.length === 0) {
      return allResources.filter(resource => 
        resource.title.toLowerCase().includes('tutorial') ||
        resource.title.toLowerCase().includes('guide') ||
        resource.title.toLowerCase().includes('introduction') ||
        resource.title.toLowerCase().includes('basic')
      ).slice(0, 3);
    }
    
    return relevantResources.slice(0, 4); // Limit to 4 most relevant resources
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="ai-helper-container">
      {/* AI Helper Header */}
      <div className="ai-helper-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 0.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.5rem' }}>
              🤖 AI Study Assistant
            </h3>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '0.95rem' }}>
              Your intelligent companion for finding resources, getting help, and planning your studies
            </p>
          </div>
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.2)', 
            padding: '0.5rem', 
            borderRadius: '8px',
            fontSize: '2rem'
          }}>
            📚
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="ai-helper-tabs">
        {[
          { id: 'search', label: 'Find Resources', icon: '🔍', desc: 'Search for learning materials' },
          { id: 'chat', label: 'AI Chat', icon: '💬', desc: 'Ask questions directly' },
          { id: 'suggestions', label: 'Quick Help', icon: '💡', desc: 'Get study tips' },
          { id: 'plan', label: 'Study Plan', icon: '📋', desc: 'View your schedule' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`ai-helper-tab ${activeTab === tab.id ? 'active' : 'inactive'}`}
          >
            <div style={{ fontSize: '1.2rem' }}>{tab.icon}</div>
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
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            border: '1px solid #e0f2fe'
          }}>
            <h4 style={{ margin: '0 0 0.5rem 0', color: '#0369a1', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🔍 Find Learning Resources
            </h4>
            <p style={{ margin: 0, color: '#0369a1', fontSize: '0.9rem' }}>
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
                    background: isLoading || !query.trim() ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)'
                  }}
                >
                  {isLoading ? (
                    <span>⏳ Searching...</span>
                  ) : (
                    <span>🔍 Find Resources</span>
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
                      position: 'relative'
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
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
              <p>Searching for learning resources...</p>
            </div>
          )}

          {/* Search Results */}
          {searchResources.length > 0 && !isLoading && (
            <div>
              <h4 style={{ marginBottom: '1rem', color: '#1e293b' }}>
                📚 Learning Resources ({searchResources.length})
              </h4>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                {searchResources.map((resource, index) => (
                  <div 
                    key={index}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '1.5rem',
                      background: '#fff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '1.5rem', flexShrink: 0 }}>
                        {getResourceIcon(resource.type)}
                      </div>
                      <div style={{ flex: 1, minWidth: '300px' }}>
                        <h6 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', lineHeight: '1.4' }}>
                          {resource.title}
                        </h6>
                        <p style={{ margin: '0 0 0.75rem 0', color: '#6b7280', fontSize: '0.875rem', lineHeight: '1.5' }}>
                          {resource.description}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.75rem', color: '#9ca3af', flexWrap: 'wrap' }}>
                          <span>📍 {resource.source}</span>
                          <span>🔗 {resource.type}</span>
                        </div>
                      </div>
                      <div style={{ flexShrink: 0, marginTop: '0.5rem' }}>
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-primary btn-sm"
                          style={{ 
                            fontSize: '0.75rem',
                            padding: '0.5rem 1rem',
                            minWidth: '120px',
                            textAlign: 'center',
                            textDecoration: 'none',
                            display: 'inline-block'
                          }}
                        >
                          📖 View Resource
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Study Tips */}
              {studyTips.length > 0 && (
                <div>
                  <h4 style={{ marginBottom: '1rem', color: '#1e293b' }}>
                    💡 Study Tips
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
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
              <h4>No resources found</h4>
              <p>Try searching with different keywords or check the study suggestions tab.</p>
            </div>
          )}
        </div>
      )}

      {/* Chat Tab */}
      {activeTab === 'chat' && (
        <div style={{ position: 'relative', zIndex: 1, height: '600px', display: 'flex', flexDirection: 'column' }}>
          <h4 style={{ marginBottom: '1rem', color: '#1e293b' }}>
            💬 AI Study Assistant
          </h4>
          
          {/* Chat Messages */}
          <div className="ai-chat-messages">
            {chatMessages.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤖</div>
                <h5>Welcome to AI Study Assistant!</h5>
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
                    background: message.isAI ? '#fff' : '#3b82f6',
                    color: message.isAI ? '#1e293b' : '#fff',
                    border: message.isAI ? '1px solid #e5e7eb' : 'none',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}>
                    {message.isAI && (
                      <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                        🤖 AI Assistant
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
                  border: '1px solid #e5e7eb',
                  color: '#6b7280'
                }}>
                  <div style={{ fontSize: '0.75rem', marginBottom: '0.25rem' }}>
                    🤖 AI Assistant
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>🤔</span>
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
            >
              {isChatLoading ? '⏳' : '📤'}
            </button>
          </form>
        </div>
      )}

      {/* Suggestions Tab */}
      {activeTab === 'suggestions' && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h4 style={{ marginBottom: '1rem', color: '#1e293b' }}>
            💡 Personalized Study Suggestions
          </h4>
          {suggestions.length > 0 ? (
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              {suggestions.map((suggestion, index) => (
                <div 
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  style={{
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    padding: '1rem',
                    background: '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    zIndex: 1
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f8fafc';
                    e.currentTarget.style.borderColor = '#3b82f6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                    e.currentTarget.style.borderColor = '#e5e7eb';
                  }}
                >
                  <span style={{ color: '#475569' }}>{suggestion}</span>
                  <div style={{ 
                    marginTop: '0.5rem', 
                    fontSize: '0.75rem', 
                    color: '#9ca3af' 
                  }}>
                    Click to search for resources
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💡</div>
              <h4>No suggestions available</h4>
              <p>Study suggestions will appear here based on your course content.</p>
            </div>
          )}
        </div>
      )}

      {/* Study Plan Tab */}
      {activeTab === 'plan' && (
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h4 style={{ marginBottom: '1rem', color: '#1e293b' }}>
            📋 Your Personalized Study Plan
          </h4>
          {studyPlan.length > 0 ? (
            <div style={{ display: 'grid', gap: '1rem' }}>
              {studyPlan.map((planItem, index) => (
                <div 
                  key={index}
                  style={{
                    border: '1px solid #e5e7eb',
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
                    <h6 style={{ margin: 0, color: '#1e293b', flex: 1, minWidth: '200px' }}>
                      {planItem.title}
                    </h6>
                    <span 
                      style={{ 
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        background: getPriorityColor(planItem.priority),
                        color: 'white',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {planItem.priority} Priority
                    </span>
                  </div>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280', fontSize: '0.875rem' }}>
                    {planItem.description}
                  </p>
                  {planItem.deadline && (
                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
                      📅 Due: {formatDate(planItem.deadline)}
                    </div>
                  )}
                  {planItem.suggestedResources && planItem.suggestedResources.length > 0 && (
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.25rem' }}>
                        Suggested Resources:
                      </div>
                      {planItem.suggestedResources.map((resource, resourceIndex) => (
                        <div key={resourceIndex} style={{ fontSize: '0.75rem', color: '#9ca3af', marginLeft: '1rem' }}>
                          • {resource}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📋</div>
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
