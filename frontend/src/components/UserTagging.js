import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/axiosInstance';
import './UserTagging.css';

const UserTagging = ({ 
  courseId, 
  userId, 
  content, 
  setContent, 
  onMention,
  placeholder = "Write your post...",
  className = "form-control"
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionStart, setMentionStart] = useState(-1);
  const textareaRef = useRef(null);

  // Fetch enrolled students when component mounts
  useEffect(() => {
    fetchEnrolledStudents();
  }, [courseId]);

  const fetchEnrolledStudents = async () => {
    try {
      const response = await axios.get(`/discussions/course/${courseId}/students?userId=${userId}`);
      setSuggestions(response.data);
    } catch (error) {
      console.error('Error fetching enrolled students:', error);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    const cursorPos = e.target.selectionStart;
    
    setContent(value);
    setCursorPosition(cursorPos);

    // Check if user typed # symbol
    const textBeforeCursor = value.substring(0, cursorPos);
    const hashIndex = textBeforeCursor.lastIndexOf('#');
    
    if (hashIndex !== -1) {
      const textAfterHash = textBeforeCursor.substring(hashIndex + 1);
      // Check if there's no space after # (indicating active mention)
      if (!textAfterHash.includes(' ') && !textAfterHash.includes('\n')) {
        setMentionStart(hashIndex);
        setShowSuggestions(true);
        setSelectedIndex(-1);
        
        // Filter suggestions based on text after #
        if (textAfterHash) {
          const filtered = suggestions.filter(user =>
            user.name.toLowerCase().includes(textAfterHash.toLowerCase())
          );
          setSuggestions(filtered);
        } else {
          fetchEnrolledStudents(); // Show all when just # is typed
        }
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e) => {
    if (showSuggestions && suggestions.length > 0) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (selectedIndex >= 0) {
            selectUser(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          setShowSuggestions(false);
          setSelectedIndex(-1);
          break;
      }
    }
  };

  const selectUser = (user) => {
    const beforeMention = content.substring(0, mentionStart);
    const afterCursor = content.substring(cursorPosition);
    
    // Replace # and any text after it with @userId format and display name
    const newContent = `${beforeMention}@${user.id} ${afterCursor}`;
    setContent(newContent);
    
    // Close suggestions
    setShowSuggestions(false);
    setSelectedIndex(-1);
    
    // Focus back to textarea
    if (textareaRef.current) {
      const newCursorPos = beforeMention.length + `@${user.id} `.length;
      setTimeout(() => {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }, 0);
    }
    
    // Notify parent component about mention
    if (onMention) {
      onMention(user);
    }
  };

  // Process content for display (convert @userId to @displayName for better UX)
  const processDisplayContent = (text) => {
    let displayText = text;
    suggestions.forEach(user => {
      const regex = new RegExp(`@${user.id}(?=\\s|$)`, 'g');
      displayText = displayText.replace(regex, `<span class="user-tag">@${user.name}</span>`);
    });
    return displayText;
  };

  return (
    <div className="user-tagging-container">
      <textarea
        ref={textareaRef}
        className={className}
        value={content}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={`${placeholder} (Type # to mention someone)`}
        rows="4"
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="tagging-suggestions">
          {suggestions.map((user, index) => (
            <div
              key={user.id}
              className={`suggestion-item ${index === selectedIndex ? 'selected' : ''}`}
              onClick={() => selectUser(user)}
            >
              <div className="suggestion-avatar">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="suggestion-info">
                <div className="suggestion-name">{user.name}</div>
                <div className="suggestion-role">
                  {user.role === 'TEACHER' ? '👨‍🏫 Teacher' : '👨‍🎓 Student'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {content && (
        <div className="mention-preview">
          <small className="text-muted">
            Preview: <span dangerouslySetInnerHTML={{ __html: processDisplayContent(content) }}></span>
          </small>
        </div>
      )}
    </div>
  );
};

export default UserTagging;
