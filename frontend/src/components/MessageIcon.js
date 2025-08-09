import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/axiosInstance';
import Linkify from 'react-linkify';
import './MessageIcon.css';

const MessageIcon = ({ userId }) => {
    const [showModal, setShowModal] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [availableUsers, setAvailableUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [filteredConversations, setFilteredConversations] = useState([]);
    const [currentView, setCurrentView] = useState('conversations'); // 'conversations', 'newChat', 'chat'
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const modalRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (userId) {
            fetchUnreadCount();
        }
    }, [userId]);

    useEffect(() => {
        if (showModal && userId) {
            fetchConversations();
            fetchAvailableUsers();
            // Update unread count when modal is opened (user is viewing messages)
            fetchUnreadCount();
        }
    }, [showModal, userId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Filter conversations based on search term
        if (searchTerm.trim()) {
            const filtered = conversations.filter(conv => 
                conv.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                conv.userRole?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredConversations(filtered);

            // Filter available users for new chat
            const filteredUsersForChat = availableUsers.filter(user => 
                user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.role?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredUsers(filteredUsersForChat);
        } else {
            setFilteredConversations(conversations);
            setFilteredUsers(availableUsers);
        }
    }, [searchTerm, conversations, availableUsers]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchUnreadCount = async () => {
        try {
            const response = await axios.get(`/messages/unread-count?userId=${userId}`);
            setUnreadCount(response.data);
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    const markAllMessagesAsSeen = async () => {
        try {
            await axios.put(`/messages/mark-all-seen?userId=${userId}`);
            // Reset unread count to 0 immediately for better UX
            setUnreadCount(0);
            // Also update conversations to show no unread messages
            setConversations(prevConversations => 
                prevConversations.map(conv => ({ ...conv, unreadCount: 0 }))
            );
        } catch (error) {
            console.error('Error marking all messages as seen:', error);
        }
    };

    const fetchConversations = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/messages/conversations?userId=${userId}`);
            setConversations(response.data);
            
            // When user opens the modal and sees conversations, 
            // mark all messages as seen (common UX pattern)
            if (response.data.some(conv => conv.unreadCount > 0)) {
                markAllMessagesAsSeen();
            }
        } catch (error) {
            console.error('Error fetching conversations:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableUsers = async () => {
        try {
            console.log('Fetching available users for userId:', userId);
            console.log('Making request to:', `/messages/users/available?userId=${userId}`);
            const response = await axios.get(`/messages/users/available?userId=${userId}`);
            console.log('Available users response:', response.data);
            console.log('Number of users found:', response.data ? response.data.length : 0);
            setAvailableUsers(response.data);
        } catch (error) {
            console.error('Error fetching available users:', error);
            console.error('Error status:', error.response?.status);
            console.error('Error data:', error.response?.data);
        }
    };

    const fetchConversation = async (otherUserId) => {
        try {
            const response = await axios.get(
                `/messages/conversation/${otherUserId}?userId=${userId}`
            );
            setMessages(response.data);
            // Mark messages as read when conversation is opened
            await markMessagesAsRead(otherUserId);
        } catch (error) {
            console.error('Error fetching conversation:', error);
        }
    };

    const markMessagesAsRead = async (otherUserId) => {
        try {
            await axios.put(`/messages/mark-read?userId=${userId}&senderId=${otherUserId}`);
            // Update unread count after marking as read
            fetchUnreadCount();
            // Refresh conversations to update unread counts
            fetchConversations();
        } catch (error) {
            console.error('Error marking messages as read:', error);
        }
    };

    const sendMessage = async () => {
        if ((!newMessage.trim() && !selectedFile) || !selectedConversation) return;

        try {
            let attachmentInfo = null;
            
            // Upload file if selected
            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                
                const uploadResponse = await axios.post('/files/upload', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                
                attachmentInfo = uploadResponse.data;
            }

            // Send message
            if (attachmentInfo) {
                // Send with attachment using form data
                const formData = new FormData();
                formData.append('senderId', userId);
                formData.append('recipientId', selectedConversation.userId);
                formData.append('content', newMessage.trim() || 'File attachment');
                formData.append('attachmentUrl', attachmentInfo.url);
                formData.append('attachmentFilename', attachmentInfo.filename);
                formData.append('attachmentSize', attachmentInfo.size);
                formData.append('attachmentContentType', attachmentInfo.contentType);

                await axios.post('/messages/send-with-attachment', formData);
            } else {
                // Send regular message
                const messageData = {
                    recipientId: selectedConversation.userId,
                    content: newMessage.trim()
                };

                await axios.post(`/messages/send?senderId=${userId}`, messageData);
            }
            
            setNewMessage('');
            setSelectedFile(null);
            setFilePreview(null);
            fetchConversation(selectedConversation.userId);
            fetchConversations();
            fetchUnreadCount();
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        }
    };

    const startNewConversation = async (user) => {
        // Check if conversation already exists
        const existingConv = conversations.find(conv => conv.userId === user.id);
        if (existingConv) {
            setSelectedConversation(existingConv);
            fetchConversation(existingConv.userId);
        } else {
            // Create a new conversation object
            const newConv = {
                userId: user.id,
                userName: user.name,
                userEmail: user.email,
                userRole: user.role,
                lastMessage: '',
                lastMessageTime: new Date(),
                unreadCount: 0
            };
            setSelectedConversation(newConv);
            setMessages([]);
        }
        setCurrentView('chat');
        setSearchTerm('');
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else if (diffDays <= 7) {
            return date.toLocaleDateString([], { weekday: 'short' });
        } else {
            return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
        }
    };

    const openChatModal = (conversation) => {
        setSelectedConversation(conversation);
        fetchConversation(conversation.userId);
        setSearchTerm('');
        setCurrentView('chat');
        // Immediately update the unread count in state for this conversation
        setConversations(prevConversations => 
            prevConversations.map(conv => 
                conv.userId === conversation.userId 
                    ? { ...conv, unreadCount: 0 }
                    : conv
            )
        );
    };

    const openFullMessaging = () => {
        // This could open a dedicated messaging page or a larger modal
        // For now, just close the dropdown
        setShowModal(false);
        setSearchTerm('');
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Check file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
            alert('File size too large. Maximum 10MB allowed.');
            return;
        }

        setSelectedFile(file);

        // Create preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setFilePreview(e.target.result);
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }
    };

    const removeSelectedFile = () => {
        setSelectedFile(null);
        setFilePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const openImageModal = (imageSrc) => {
        setSelectedImage(imageSrc);
        setShowImageModal(true);
    };

    const closeImageModal = () => {
        setShowImageModal(false);
        setSelectedImage(null);
    };

    const handleFileView = async (attachmentUrl, filename) => {
        try {
            // Fix URL doubling issue - remove /api prefix if it exists since axiosInstance adds it
            let cleanUrl = attachmentUrl;
            if (attachmentUrl.startsWith('/api/')) {
                cleanUrl = attachmentUrl.substring(4); // Remove '/api' prefix
            }
            
            console.log('Original attachmentUrl:', attachmentUrl);
            console.log('Clean URL for request:', cleanUrl);
            
            // Use exact same pattern as assignments - axios with blob response
            const response = await axios.get(cleanUrl, {
                responseType: 'blob',
            });
            
            // Create blob link to download - identical to assignment pattern
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading file:', error);
            console.error('Failed URL:', attachmentUrl);
            alert('Failed to download file. Please try again.');
        }
    };

    const isImageFile = (contentType) => {
        return contentType && contentType.startsWith('image/');
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const renderMessageContent = (message) => {
        const hasAttachment = message.attachmentUrl;
        
        return (
            <div className="message-content-wrapper">
                {message.content && (
                    <div className="message-text">
                        <Linkify properties={{ target: '_blank', rel: 'noopener noreferrer' }}>
                            {message.content}
                        </Linkify>
                    </div>
                )}
                
                {hasAttachment && (
                    <div className="message-attachment">
                        {isImageFile(message.attachmentContentType) ? (
                            <div className="attachment-image">
                                <img 
                                    src={message.attachmentUrl}
                                    alt={message.attachmentFilename}
                                    onClick={() => openImageModal(message.attachmentUrl)}
                                    style={{ maxWidth: '200px', maxHeight: '200px', cursor: 'pointer', borderRadius: '8px' }}
                                />
                                <div className="attachment-filename">{message.attachmentFilename}</div>
                            </div>
                        ) : (
                            <div className="attachment-file">
                                <div className="file-icon">🔗</div>
                                <div className="file-details">
                                    <div className="file-name">{message.attachmentFilename}</div>
                                    <div className="file-size">{formatFileSize(message.attachmentSize)}</div>
                                </div>
                                <button 
                                    onClick={() => handleFileView(message.attachmentUrl, message.attachmentFilename)}
                                    className="download-link"
                                    type="button"
                                >
                                    Download
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="message-icon-container">
            <button 
                className="message-icon-btn"
                onClick={() => setShowModal(!showModal)}
                aria-label="Messages"
            >
                <svg 
                    width="20" 
                    height="20" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                </svg>
                {unreadCount > 0 && (
                    <span className="message-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {showModal && (
                <div className="message-dropdown" ref={modalRef}>
                    {/* Header with back button for chat view */}
                    {currentView === 'chat' ? (
                        <div className="message-dropdown-header">
                            <button 
                                className="back-btn"
                                onClick={() => {
                                    setCurrentView('conversations');
                                    setSelectedConversation(null);
                                }}
                                title="Back to conversations"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 12H6m6-6l-6 6 6 6"/>
                                </svg>
                            </button>
                            {selectedConversation && (
                                <div className="chat-header-info">
                                    <div className="chat-user-avatar">
                                        {selectedConversation.userName?.charAt(0).toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <div className="chat-user-name">{selectedConversation.userName}</div>
                                        <div className="chat-user-role">{selectedConversation.userRole}</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="message-dropdown-header">
                            <button 
                                className="back-btn"
                                onClick={() => {
                                    if (currentView === 'newChat') {
                                        setCurrentView('conversations');
                                    }
                                }}
                                style={{ visibility: currentView === 'newChat' ? 'visible' : 'hidden' }}
                                title="Back to conversations"
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M19 12H6m6-6l-6 6 6 6"/>
                                </svg>
                            </button>
                            <h4>{currentView === 'newChat' ? 'Start New Chat' : 'Messages'}</h4>
                            {currentView === 'conversations' && (
                                <div className="message-header-actions">
                                    <button 
                                        className="new-chat-btn"
                                        onClick={() => {
                                            console.log('+ button clicked. Current currentView:', currentView);
                                            console.log('Current userId:', userId);
                                            setCurrentView('newChat');
                                        }}
                                        title="Start new conversation"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M12 5v14m7-7H5"/>
                                        </svg>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Content based on current view */}
                    <div className={`message-dropdown-content ${currentView === 'chat' ? 'chat-view' : ''}`}>
                        {currentView === 'conversations' && (
                            <>
                                <div className="message-search-container">
                                    <div className="message-search-input-wrapper">
                                        <svg className="message-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="11" cy="11" r="8"/>
                                            <path d="M21 21l-4.35-4.35"/>
                                        </svg>
                                        <input
                                            type="text"
                                            placeholder="Search conversations..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="message-search-input"
                                        />
                                        {searchTerm && (
                                            <button 
                                                className="message-search-clear"
                                                onClick={() => setSearchTerm('')}
                                            >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M18 6L6 18M6 6l12 12"/>
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="conversations-list">
                                    {loading ? (
                                        <div className="message-loading">Loading conversations...</div>
                                    ) : filteredConversations.length > 0 ? (
                                        filteredConversations.map((conversation, index) => (
                                            <div 
                                                key={index}
                                                className={`conversation-item ${conversation.unreadCount > 0 ? 'unread' : ''}`}
                                                onClick={() => {
                                                    setSelectedConversation(conversation);
                                                    // Open chat in the same modal and mark messages as read
                                                    openChatModal(conversation);
                                                }}
                                            >
                                                <div className="conversation-avatar">
                                                    {conversation.userName?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div className="conversation-info">
                                                    <div className="conversation-header">
                                                        <span className="conversation-name">{conversation.userName}</span>
                                                        <span className="conversation-time">{formatTime(conversation.lastMessageTime)}</span>
                                                    </div>
                                                    <div className="conversation-preview">
                                                        <span className="conversation-role">{conversation.userRole}</span>
                                                        {conversation.lastMessage && (
                                                            <span className="last-message">
                                                                • {conversation.lastMessage.length > 25 
                                                                    ? conversation.lastMessage.substring(0, 25) + '...' 
                                                                    : conversation.lastMessage}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {conversation.unreadCount > 0 && (
                                                    <span className="conversation-unread-badge">
                                                        {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-results">
                                            {searchTerm ? 'No conversations found' : 'No conversations yet. Start a new chat!'}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {currentView === 'newChat' && (
                            <>
                                <div className="message-search-container">
                                    <div className="message-search-input-wrapper">
                                        <svg className="message-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="11" cy="11" r="8"/>
                                            <path d="M21 21l-4.35-4.35"/>
                                        </svg>
                                        <input
                                            type="text"
                                            placeholder="Search users..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="message-search-input"
                                        />
                                        {searchTerm && (
                                            <button 
                                                className="message-search-clear"
                                                onClick={() => setSearchTerm('')}
                                            >
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M18 6L6 18M6 6l12 12"/>
                                                </svg>
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="users-list">
                                    {loading ? (
                                        <div className="message-loading">Loading users...</div>
                                    ) : filteredUsers.length > 0 ? (
                                        filteredUsers.map(user => (
                                            <div 
                                                key={user.id}
                                                className="user-item"
                                                onClick={() => startNewConversation(user)}
                                            >
                                                <div className="user-avatar">
                                                    {user.name?.charAt(0).toUpperCase() || 'U'}
                                                </div>
                                                <div className="user-info">
                                                    <div className="user-name">{user.name}</div>
                                                    <div className="user-role">{user.role}</div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-results">
                                            {searchTerm ? 'No users found' : availableUsers.length === 0 ? 
                                                'No users available for messaging. Note: Currently only users in the same courses or admins can message each other.' : 
                                                'No users available'}
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {currentView === 'chat' && selectedConversation && (
                            <div className="chat-content">
                                <div className="chat-messages">
                                    {messages.length > 0 ? (
                                        messages.map((message, index) => (
                                            <div 
                                                key={index} 
                                                className={`message-bubble ${message.senderId === userId ? 'sent' : 'received'}`}
                                            >
                                                {renderMessageContent(message)}
                                                <div className="message-time">{formatTime(message.timestamp)}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-messages">
                                            Start your conversation with {selectedConversation.userName}
                                        </div>
                                    )}
                                </div>
                                <div className="chat-input">
                                    {/* File preview */}
                                    {selectedFile && (
                                        <div className="file-attachment-area">
                                            <div className="file-preview">
                                                {filePreview ? (
                                                    <img src={filePreview} alt="Preview" />
                                                ) : (
                                                    <div className="file-icon">📁</div>
                                                )}
                                                <div className="file-info">
                                                    <div className="file-name">{selectedFile.name}</div>
                                                    <div className="file-size">{formatFileSize(selectedFile.size)}</div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={removeSelectedFile} 
                                                className="remove-file-btn"
                                                title="Remove file"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    )}
                                    
                                    <div className="message-input-row">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            style={{ display: 'none' }}
                                            accept="*/*"
                                        />
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="file-input-btn"
                                            title="Attach file"
                                        >
                                            📎
                                        </button>
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                            placeholder="Type a message..."
                                            className="message-input"
                                        />
                                        <button 
                                            onClick={sendMessage}
                                            disabled={!newMessage.trim() && !selectedFile}
                                            className="send-btn"
                                        >
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/>
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {currentView === 'conversations' && (
                        <div className="message-dropdown-footer">
                            <button 
                                className="view-all-btn"
                                onClick={() => {
                                    setShowModal(false);
                                    // Open full messaging interface
                                    openFullMessaging();
                                }}
                            >
                                View All Messages
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Image Modal */}
            {showImageModal && selectedImage && (
                <div className="image-modal-overlay" onClick={closeImageModal}>
                    <div className="image-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="close-image-modal" onClick={closeImageModal}>×</button>
                        <img src={selectedImage} alt="Full size" className="modal-image" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessageIcon;