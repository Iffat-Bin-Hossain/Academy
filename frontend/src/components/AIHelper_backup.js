import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';

const AIHelper = ({ courseId, user, onShowMessage }) => {
  // Main state
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resources, setResources] = useState([]);
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
    loadSuggestions();
    loadStudyPlan();
  }, [courseId, user]);

  const loadSuggestions = async () => {
    try {
      const response = await axios.get(`/ai-helper/suggestions/${courseId}`, {
        params: { studentId: user.id }
      });
      setSuggestions(response.data.suggestions || []);
    } catch (error) {
      console.error('Error loading suggestions:', error);
    }
  };

  const loadStudyPlan = async () => {
    try {
      const response = await axios.get(`/ai-helper/study-plan/${courseId}`, {
        params: { studentId: user.id }
      });
      setStudyPlan(response.data.studyPlan || []);
    } catch (error) {
      console.error('Error loading study plan:', error);
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

      setResources(response.data.resources || []);
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

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div style={{ 
      position: 'relative', 
      zIndex: 1,
      maxWidth: '100%',
      overflow: 'hidden'
    }}>
      {/* AI Helper Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
        color: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '2rem',
        position: 'relative',
        zIndex: 2,
        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
      }}>
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
      <div style={{ 
        display: 'flex', 
        gap: '0.25rem', 
        marginBottom: '2rem',
        backgroundColor: '#f8fafc',
        padding: '0.5rem',
        borderRadius: '12px',
        flexWrap: 'wrap',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
      }}>
        {[
          { id: 'search', label: 'Find Resources', icon: '🔍', desc: 'Search for learning materials' },
          { id: 'chat', label: 'AI Chat', icon: '💬', desc: 'Ask questions directly' },
          { id: 'suggestions', label: 'Quick Help', icon: '💡', desc: 'Get study tips' },
          { id: 'plan', label: 'Study Plan', icon: '📋', desc: 'View your schedule' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`btn ${activeTab === tab.id ? '' : 'btn-light'}`}
            style={{ 
              textTransform: 'none', 
              letterSpacing: 'normal',
              border: 'none',
              backgroundColor: activeTab === tab.id ? '#3b82f6' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#64748b',
              fontSize: '0.875rem',
              padding: '0.75rem 1rem',
              borderRadius: '8px',
              flex: '1',
              minWidth: '140px',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem',
              boxShadow: activeTab === tab.id ? '0 2px 8px rgba(59, 130, 246, 0.3)' : 'none'
            }}
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
          <div style={{ 
            background: '#fff',
            padding: '1.5rem',
            borderRadius: '12px',
            marginBottom: '1.5rem',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: '1px solid #e5e7eb'
          }}>
            <form onSubmit={handleSearch}>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch' }}>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What would you like to learn? (e.g., 'Java programming basics', 'data structures tutorial')"
                  className="form-control"
                  style={{ 
                    flex: 1, 
                    minHeight: '56px',
                    fontSize: '16px',
                    borderRadius: '12px',
                    border: '2px solid #e5e7eb',
                    padding: '1rem 1.25rem',
                    transition: 'all 0.2s ease',
                    backgroundColor: '#fff',
                    outline: 'none',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                  }}
                  disabled={isLoading}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#3b82f6';
                    e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e5e7eb';
                    e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
                  }}
                />
                <button 
                  type="submit"
                  className="btn btn-primary"
                  disabled={isLoading || !query.trim()}
                  style={{ 
                    minWidth: '140px',
                    height: '56px',
                    whiteSpace: 'nowrap',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    background: isLoading || !query.trim() ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                    border: 'none',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                    transition: 'all 0.2s ease'
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
          {resources.length > 0 && !isLoading && (
            <div>
              <h4 style={{ marginBottom: '1rem', color: '#1e293b' }}>
                📚 Learning Resources ({resources.length})
              </h4>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                {resources.map((resource, index) => (
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
          {resources.length === 0 && !isLoading && query && (
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
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            border: '1px solid #e5e7eb', 
            borderRadius: '8px',
            padding: '1rem',
            background: '#f8fafc',
            marginBottom: '1rem',
            minHeight: '400px'
          }}>
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
          <form onSubmit={handleChatSend} style={{ 
            display: 'flex', 
            gap: '0.75rem',
            padding: '1.5rem',
            background: '#fff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)'
          }}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask me anything about your course..."
              className="form-control"
              style={{ 
                flex: 1, 
                minHeight: '56px',
                fontSize: '16px',
                borderRadius: '12px',
                border: '2px solid #e5e7eb',
                padding: '1rem 1.25rem',
                transition: 'all 0.2s ease',
                backgroundColor: '#fff',
                outline: 'none',
                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#3b82f6';
                e.target.style.backgroundColor = '#fff';
                e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e5e7eb';
                e.target.style.backgroundColor = '#fff';
                e.target.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)';
              }}
              disabled={isChatLoading}
            />
            <button 
              type="submit"
              className="btn btn-primary"
              disabled={isChatLoading || !chatInput.trim()}
              style={{ 
                minWidth: '80px',
                height: '56px',
                borderRadius: '12px',
                fontSize: '14px',
                fontWeight: '600',
                background: isChatLoading || !chatInput.trim() ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
                border: 'none',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
                transition: 'all 0.2s ease'
              }}
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
