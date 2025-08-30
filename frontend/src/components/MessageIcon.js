import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/axiosInstance';
import Linkify from 'react-linkify';
import './MessageIcon.css';

// Available reaction emojis
const REACTION_EMOJIS = ['❤️', '😂', '😮', '😢', '😠', '👍', '👎', '🔥', '❤️‍🔥', '✨'];

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
    const [currentUserName, setCurrentUserName] = useState(''); // Add current user name state
    
    // New states for message interactions
    const [selectedMessages, setSelectedMessages] = useState(new Set());
    const [selectionMode, setSelectionMode] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(null);
    const [forwardingMessages, setForwardingMessages] = useState([]);
    const [hoveredMessage, setHoveredMessage] = useState(null);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [selectedForwardRecipients, setSelectedForwardRecipients] = useState(new Set());
    const [messageReactions, setMessageReactions] = useState({});
    
    const modalRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const pollingIntervalRef = useRef(null);
    const hoverTimeoutRef = useRef(null);

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
            
            // Start polling for real-time updates
            startRealtimePolling();
        } else {
            // Stop polling when modal is closed
            stopRealtimePolling();
        }
        
        return () => {
            stopRealtimePolling();
        };
    }, [showModal, userId]);

    useEffect(() => {
        if (selectedConversation && showModal) {
            // Start polling for this conversation
            startConversationPolling();
        } else {
            stopConversationPolling();
        }
        
        return () => {
            stopConversationPolling();
        };
    }, [selectedConversation, showModal]);

    const startRealtimePolling = () => {
        // Poll for unread count only every 10 seconds to avoid refreshing
        pollingIntervalRef.current = setInterval(() => {
            if (userId && showModal) {
                fetchUnreadCount();
                // Only fetch conversations if we're on the conversations view
                if (currentView === 'conversations') {
                    fetchConversationsQuietly();
                }
            }
        }, 10000);
    };

    const stopRealtimePolling = () => {
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
        }
    };

    const conversationPollingRef = useRef(null);
    const reactionPollingRef = useRef(null);
    const lastReactionFetchRef = useRef(0);

    const startConversationPolling = () => {
        if (selectedConversation) {
            // Poll for new messages every 3 seconds for balance between responsiveness and performance
            conversationPollingRef.current = setInterval(() => {
                fetchConversationQuietly(selectedConversation.userId);
            }, 3000);
            
            // Greatly reduce reaction polling frequency to every 15 seconds to prevent errors
            reactionPollingRef.current = setInterval(() => {
                syncReactionsOnly();
            }, 15000);
        }
    };

    const stopConversationPolling = () => {
        if (conversationPollingRef.current) {
            clearInterval(conversationPollingRef.current);
            conversationPollingRef.current = null;
        }
        if (reactionPollingRef.current) {
            clearInterval(reactionPollingRef.current);
            reactionPollingRef.current = null;
        }
    };

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
            let conversationsData = response.data;
            
            // Fetch profile photos for each conversation if not already included
            const conversationsWithPhotos = await Promise.all(
                conversationsData.map(async (conversation) => {
                    if (!conversation.profilePhotoUrl && conversation.userId) {
                        try {
                            const profileResponse = await axios.get(`/profile/${conversation.userId}`);
                            return {
                                ...conversation,
                                profilePhotoUrl: profileResponse.data?.profilePhotoUrl || null
                            };
                        } catch (error) {
                            console.error(`Error fetching profile for user ${conversation.userId}:`, error);
                            return conversation;
                        }
                    }
                    return conversation;
                })
            );
            
            setConversations(conversationsWithPhotos);
            
            // Don't mark messages as seen just by viewing the conversation list
            // Messages should only be marked as read when user opens specific conversations
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
            
            let usersData = response.data;
            
            // Fetch profile photos for users if not already included
            const usersWithPhotos = await Promise.all(
                usersData.map(async (user) => {
                    if (!user.profilePhotoUrl && user.id) {
                        try {
                            const profileResponse = await axios.get(`/profile/${user.id}`);
                            return {
                                ...user,
                                profilePhotoUrl: profileResponse.data?.profilePhotoUrl || null
                            };
                        } catch (error) {
                            console.error(`Error fetching profile for user ${user.id}:`, error);
                            return user;
                        }
                    }
                    return user;
                })
            );
            
            setAvailableUsers(usersWithPhotos);
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
            
            // Extract current user's name from messages where they are the sender
            if (response.data.length > 0 && !currentUserName) {
                const currentUserMessage = response.data.find(msg => msg.senderId === userId);
                if (currentUserMessage && currentUserMessage.senderName) {
                    setCurrentUserName(currentUserMessage.senderName);
                }
            }
            
            // Don't fetch reactions immediately - let the polling handle it
            // This reduces initial load time and prevents errors
            
            // Mark messages as read when conversation is opened
            await markMessagesAsRead(otherUserId);
        } catch (error) {
            console.error('Error fetching conversation:', error);
        }
    };

    const fetchReactionsForMessages = async (messages) => {
        try {
            const messageIds = messages.map(msg => msg.id);
            if (messageIds.length > 0) {
                const response = await axios.post('/messages/reactions/bulk', {
                    messageIds: messageIds
                });
                
                // Convert the bulk response structure to match what frontend expects
                const convertedReactions = {};
                Object.entries(response.data).forEach(([messageId, reactions]) => {
                    // reactions is already an array of {emoji, count, users}
                    convertedReactions[messageId] = reactions.map(reaction => ({
                        emoji: reaction.emoji,
                        count: reaction.count,
                        users: reaction.users,
                        userName: reaction.users.join(', ')
                    }));
                });
                
                // Merge with existing reactions instead of replacing completely
                setMessageReactions(prevReactions => ({
                    ...prevReactions,
                    ...convertedReactions
                }));
            }
        } catch (error) {
            // Silently handle all errors - 400/404 are normal when no reactions exist
            // Don't spam console with expected errors
            if (error.response?.status >= 500) {
                console.warn('Server error fetching reactions:', error.response?.status);
            }
            // Don't reset reactions on error - keep existing ones
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

            // Prepare message content with reply if applicable
            let messageContent = newMessage.trim();
            let replyToMessageId = null;
            
            if (replyingTo) {
                // Don't modify the content for replies - let backend handle the reply relationship
                replyToMessageId = replyingTo.id;
            }

            // Send message
            if (attachmentInfo) {
                // Send with attachment using form data
                const formData = new FormData();
                formData.append('senderId', userId);
                formData.append('recipientId', selectedConversation.userId);
                formData.append('content', messageContent || 'File attachment');
                formData.append('attachmentUrl', attachmentInfo.url);
                formData.append('attachmentFilename', attachmentInfo.filename);
                formData.append('attachmentSize', attachmentInfo.size);
                formData.append('attachmentContentType', attachmentInfo.contentType);
                
                if (replyingTo) {
                    formData.append('replyToMessageId', replyingTo.id);
                }

                await axios.post('/messages/send-with-attachment', formData);
            } else {
                // Send regular message
                const messageData = {
                    recipientId: selectedConversation.userId,
                    content: messageContent,
                    replyToMessageId: replyToMessageId
                };

                await axios.post(`/messages/send?senderId=${userId}`, messageData);
            }
            
            setNewMessage('');
            setSelectedFile(null);
            setFilePreview(null);
            setReplyingTo(null);
            fetchConversation(selectedConversation.userId);
            fetchConversations();
            fetchUnreadCount();
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        }
    };

    const startNewConversation = async (user) => {
        // Prevent starting conversation with disabled users
        if (user.name === 'disabled user' || user.status === 'DISABLED') {
            return; // Do nothing for disabled users
        }
        
        // Check if conversation already exists
        const existingConv = conversations.find(conv => conv.userId === user.id);
        if (existingConv) {
            setSelectedConversation(existingConv);
            
            // Fetch profile photo if not already available
            if (!existingConv.profilePhotoUrl) {
                fetchUserProfilePhoto(existingConv.userId, existingConv);
            }
            
            fetchConversation(existingConv.userId);
        } else {
            // Create a new conversation object
            const newConv = {
                userId: user.id,
                userName: user.name,
                userEmail: user.email,
                userRole: user.role,
                profilePhotoUrl: user.profilePhotoUrl, // Add profile photo URL
                lastMessage: '',
                lastMessageTime: new Date(),
                unreadCount: 0
            };
            setSelectedConversation(newConv);
            
            // Fetch profile photo if not available in user data
            if (!user.profilePhotoUrl) {
                fetchUserProfilePhoto(user.id, newConv);
            }
            
            setMessages([]);
        }
        setCurrentView('chat');
        setSearchTerm('');
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // New functions for message interactions
    const toggleMessageSelection = (messageIndex) => {
        const newSelected = new Set(selectedMessages);
        if (newSelected.has(messageIndex)) {
            newSelected.delete(messageIndex);
        } else {
            newSelected.add(messageIndex);
        }
        setSelectedMessages(newSelected);
        
        if (newSelected.size === 0) {
            setSelectionMode(false);
        }
    };

    const enterSelectionMode = (messageIndex) => {
        setSelectionMode(true);
        setSelectedMessages(new Set([messageIndex]));
    };

    const exitSelectionMode = () => {
        setSelectionMode(false);
        setSelectedMessages(new Set());
    };

    const handleReaction = async (messageIndex, emoji) => {
        try {
            const message = messages[messageIndex];
            const userNameToUse = currentUserName || 'Unknown User';
            
            // Optimistic update - immediately show the reaction change for instant feedback
            const currentReactions = messageReactions[message.id] || [];
            const existingReaction = currentReactions.find(r => 
                r.emoji === emoji && r.users.includes(userNameToUse)
            );
            
            // Create optimistic reaction state
            let optimisticReactions = [...currentReactions];
            
            // Remove any existing reactions from this user
            optimisticReactions = optimisticReactions.map(r => {
                if (r.users.includes(userNameToUse)) {
                    return {
                        ...r,
                        users: r.users.filter(user => user !== userNameToUse),
                        count: Math.max(0, r.count - 1)
                    };
                }
                return r;
            }).filter(r => r.count > 0);
            
            // If toggling on (not removing), add the new reaction
            if (!existingReaction) {
                const existingEmojiReaction = optimisticReactions.find(r => r.emoji === emoji);
                if (existingEmojiReaction) {
                    existingEmojiReaction.users.push(userNameToUse);
                    existingEmojiReaction.count += 1;
                    existingEmojiReaction.userName = existingEmojiReaction.users.join(', ');
                } else {
                    optimisticReactions.push({
                        emoji: emoji,
                        count: 1,
                        users: [userNameToUse],
                        userName: userNameToUse
                    });
                }
            }
            
            // Apply optimistic update immediately
            setMessageReactions(prev => ({
                ...prev,
                [message.id]: optimisticReactions
            }));
            
            // Check if user has already reacted with this emoji
            const userHasOtherReactions = currentReactions.filter(r => 
                r.users.includes(userNameToUse) && r.emoji !== emoji
            );
            
            // Remove any existing reactions from this user first
            for (const reaction of userHasOtherReactions) {
                console.log('Removing other reaction:', { messageId: message.id, userId, emoji: reaction.emoji });
                await axios.delete('/messages/react', {
                    params: {
                        messageId: message.id,
                        userId: userId,
                        emoji: reaction.emoji
                    }
                });
            }
            
            let response;
            if (existingReaction) {
                // Remove existing reaction (toggle off)
                console.log('Removing reaction:', { messageId: message.id, userId, emoji });
                response = await axios.delete('/messages/react', {
                    params: {
                        messageId: message.id,
                        userId: userId,
                        emoji: emoji
                    }
                });
            } else {
                // Add new reaction (toggle on)
                console.log('Adding reaction:', { messageId: message.id, userId, emoji });
                response = await axios.post('/messages/react', null, {
                    params: {
                        messageId: message.id,
                        userId: userId,
                        emoji: emoji
                    }
                });
            }
            
            console.log('Reaction response:', response.data);
            
            // Convert the response.data structure to match what frontend expects
            const reactionsArray = Object.entries(response.data).map(([emojiKey, emojiData]) => ({
                emoji: emojiKey,
                count: emojiData.count,
                users: emojiData.users,
                userName: emojiData.users.join(', ')
            }));
            
            // Update local state with new reaction immediately
            setMessageReactions(prev => ({
                ...prev,
                [message.id]: reactionsArray
            }));
            
            // Trigger real-time update for the other user by refreshing their conversation quietly
            // This will make reactions appear on both sides almost instantly
            if (selectedConversation) {
                // Immediate reaction sync for faster updates
                setTimeout(() => {
                    syncReactionsOnly();
                }, 50);
                
                // Also do a full conversation refresh for other users
                setTimeout(() => {
                    fetchConversationQuietly(selectedConversation.userId);
                }, 200);
            }
            
            setShowEmojiPicker(null);
        } catch (error) {
            console.error('Error handling reaction:', error);
            console.error('Error response:', error.response?.data);
            
            // Show user-friendly error message
            if (error.response?.status === 400) {
                alert('Unable to add reaction. Please try again.');
            } else {
                alert('Failed to process reaction. Please check your connection.');
            }
        }
    };

    const startReply = (messageIndex) => {
        const message = messages[messageIndex];
        setReplyingTo({
            id: message.id,
            content: message.content,
            sender: message.senderName || 'User'
        });
        setSelectionMode(false);
        setSelectedMessages(new Set());
    };

    const cancelReply = () => {
        setReplyingTo(null);
    };

    const forwardMessages = () => {
        if (selectedMessages.size === 0) {
            alert('Please select messages to forward.');
            return;
        }
        
        const messagesToForward = Array.from(selectedMessages).map(index => {
            const message = messages[index];
            if (!message) {
                console.error('No message found at index:', index);
                return null;
            }
            return message;
        }).filter(message => message !== null);
        
        if (messagesToForward.length === 0) {
            alert('No valid messages selected for forwarding.');
            return;
        }
        
        console.log('Messages to forward:', messagesToForward);
        setForwardingMessages(messagesToForward);
        setSelectedForwardRecipients(new Set());
        setShowForwardModal(true);
    };

    const toggleRecipientSelection = (userId) => {
        setSelectedForwardRecipients(prev => {
            const newSet = new Set(prev);
            if (newSet.has(userId)) {
                newSet.delete(userId);
            } else {
                newSet.add(userId);
            }
            return newSet;
        });
    };

    const sendForwardedMessages = async () => {
        try {
            if (selectedForwardRecipients.size === 0) {
                alert('Please select at least one recipient.');
                return;
            }
            
            if (forwardingMessages.length === 0) {
                alert('No messages to forward.');
                return;
            }
            
            console.log('Forwarding messages to recipients:', Array.from(selectedForwardRecipients));
            console.log('Messages to forward:', forwardingMessages);
            
            for (const recipientId of selectedForwardRecipients) {
                for (const message of forwardingMessages) {
                    if (!message) {
                        console.warn('Skipping invalid message:', message);
                        continue;
                    }
                    
                    // Handle both text messages and file attachments
                    if (message.attachmentUrl && message.attachmentContentType) {
                        // Forward file attachment using the correct parameter structure
                        // Send the original content without adding forwarding labels
                        let cleanContent = message.content || 'File attachment';
                        // Remove any existing forwarding labels to avoid repetition
                        if (cleanContent.startsWith('📨 Forwarded message:')) {
                            cleanContent = cleanContent.replace(/^📨 Forwarded message:\s*\n*\n*/, '');
                        }
                        
                        const forwardData = {
                            senderId: userId,
                            recipientId: recipientId,
                            content: cleanContent, // Clean content without forwarding labels
                            attachmentUrl: message.attachmentUrl,
                            attachmentFilename: message.attachmentFilename || 'forwarded_file',
                            attachmentSize: message.attachmentSize || 0,
                            attachmentContentType: message.attachmentContentType
                        };
                        
                        console.log('Forwarding message with attachment:', forwardData);
                        
                        // Create URLSearchParams for form data
                        const params = new URLSearchParams();
                        params.append('senderId', forwardData.senderId);
                        params.append('recipientId', forwardData.recipientId);
                        params.append('content', forwardData.content);
                        params.append('attachmentUrl', forwardData.attachmentUrl);
                        params.append('attachmentFilename', forwardData.attachmentFilename);
                        params.append('attachmentSize', forwardData.attachmentSize);
                        params.append('attachmentContentType', forwardData.attachmentContentType);
                        
                        await axios.post('/messages/send-with-attachment', params, {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            }
                        });
                    } else if (message.content) {
                        // Forward text message
                        // Send the original content without adding forwarding labels
                        let cleanContent = message.content;
                        // Remove any existing forwarding labels to avoid repetition
                        if (cleanContent.startsWith('📨 Forwarded message:')) {
                            cleanContent = cleanContent.replace(/^📨 Forwarded message:\s*\n*\n*/, '');
                        }
                        
                        const forwardData = {
                            recipientId: recipientId,
                            content: cleanContent // Clean content without forwarding labels
                        };
                        
                        console.log('Forwarding text message:', forwardData);
                        await axios.post(`/messages/send?senderId=${userId}`, forwardData);
                    } else {
                        console.warn('Message has no content or attachment to forward:', message);
                    }
                }
            }
            
            setShowForwardModal(false);
            setForwardingMessages([]);
            setSelectedForwardRecipients(new Set());
            exitSelectionMode();
            
            // Refresh conversations to show the new forwarded messages
            fetchConversations();
            
            const recipientCount = selectedForwardRecipients.size;
            const messageCount = forwardingMessages.length;
            alert(`Successfully forwarded ${messageCount} message(s) to ${recipientCount} recipient(s)!`);
        } catch (error) {
            console.error('Error forwarding messages:', error);
            console.error('Error response:', error.response?.data);
            alert('Failed to forward messages. Please try again.');
        }
    };

    const deleteSelectedMessages = async () => {
        if (selectedMessages.size === 0) return;
        
        const messageCount = selectedMessages.size;
        const messageText = messageCount === 1 ? 'message' : 'messages';
        
        if (window.confirm(`Are you sure you want to delete ${messageCount} ${messageText}? This action cannot be undone.`)) {
            try {
                const messageIds = Array.from(selectedMessages).map(index => {
                    const message = messages[index];
                    if (!message || !message.id) {
                        console.error('Invalid message at index:', index, message);
                        return null;
                    }
                    return message.id;
                }).filter(id => id !== null);
                
                if (messageIds.length === 0) {
                    alert('No valid messages selected for deletion.');
                    return;
                }
                
                console.log('Deleting message IDs:', messageIds);
                
                // Use the correct delete endpoint with POST request body
                await axios.post(`/messages/delete-multiple?userId=${userId}`, messageIds);
                
                // Refresh the conversation
                await fetchConversation(selectedConversation.userId);
                exitSelectionMode();
                
                // Update conversations list to reflect changes
                fetchConversations();
                
                console.log('Messages deleted successfully');
            } catch (error) {
                console.error('Error deleting messages:', error);
                console.error('Error response:', error.response?.data);
                alert('Failed to delete messages. You may not have permission to delete these messages.');
            }
        }
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
        // Prevent opening chat with disabled users
        if (conversation.userName === 'disabled user') {
            return; // Do nothing for disabled users
        }
        
        setSelectedConversation(conversation);
        
        // Fetch profile photo if not already available
        if (!conversation.profilePhotoUrl) {
            fetchUserProfilePhoto(conversation.userId, conversation);
        }
        
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

    const fetchUserProfilePhoto = async (userId, conversation) => {
        try {
            const response = await axios.get(`/profile/${userId}`);
            if (response.data?.profilePhotoUrl) {
                // Update the selected conversation with profile photo
                setSelectedConversation(prev => ({
                    ...prev,
                    profilePhotoUrl: response.data.profilePhotoUrl
                }));
                
                // Also update the conversations list
                setConversations(prevConversations => 
                    prevConversations.map(conv => 
                        conv.userId === userId 
                            ? { ...conv, profilePhotoUrl: response.data.profilePhotoUrl }
                            : conv
                    )
                );
            }
        } catch (error) {
            console.error('Error fetching user profile photo:', error);
        }
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

    const renderMessageContent = (message, messageIndex) => {
        const hasAttachment = message.attachmentUrl;
        const isSelected = selectedMessages.has(messageIndex);
        const isSent = message.senderId === userId;
        const messageReactionsData = messageReactions[message.id] || [];
        const isHovered = hoveredMessage === messageIndex;
        
        return (
            <div 
                className={`message-content-wrapper ${isSelected ? 'selected' : ''}`}
                onMouseEnter={() => {
                    // Clear any existing timeout
                    if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                    }
                    // Add delay before showing hover actions
                    hoverTimeoutRef.current = setTimeout(() => {
                        setHoveredMessage(messageIndex);
                    }, 300); // 300ms delay
                }}
                onMouseLeave={() => {
                    // Clear timeout and immediately hide hover actions
                    if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                    }
                    setHoveredMessage(null);
                }}
            >
                {/* Selection checkbox */}
                {selectionMode && (
                    <div className="message-selection">
                        <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleMessageSelection(messageIndex)}
                        />
                    </div>
                )}
                
                {/* Reply indicator - Modern messenger style */}
                {message.replyToMessageId && (
                    <div className="modern-reply-indicator">
                        <div className="reply-line"></div>
                        <div className="reply-content">
                            <div className="reply-to-name">
                                {message.replyToSenderName || 'Previous message'}
                            </div>
                            <div className="reply-to-text">
                                {message.replyToContent ? 
                                    (message.replyToContent.length > 50 ? 
                                        message.replyToContent.substring(0, 50) + '...' : 
                                        message.replyToContent
                                    ) : 
                                    'Message'
                                }
                            </div>
                        </div>
                    </div>
                )}
                
                {message.content && (
                    <div className="message-text">
                        {/* Check if this is a forwarded message */}
                        {message.content.startsWith('📨 Forwarded message:') ? (
                            <div className="forwarded-message">
                                <div className="forwarded-header">
                                    <span className="forwarded-icon">→</span>
                                    <span className="forwarded-text">You forwarded a message</span>
                                </div>
                                <div className="forwarded-content">
                                    <Linkify properties={{ target: '_blank', rel: 'noopener noreferrer' }}>
                                        {message.content.replace('📨 Forwarded message:\n\n', '')}
                                    </Linkify>
                                </div>
                            </div>
                        ) : (
                            <Linkify properties={{ target: '_blank', rel: 'noopener noreferrer' }}>
                                {message.content}
                            </Linkify>
                        )}
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
                
                {/* Reactions display */}
                {messageReactionsData.length > 0 && (
                    <div className="message-reactions">
                        {messageReactionsData.map((reactionGroup, index) => {
                            const userNameToUse = currentUserName || 'Unknown User';
                            const currentUserReacted = reactionGroup.users.includes(userNameToUse);
                            
                            return (
                                <span 
                                    key={index} 
                                    className={`reaction clickable-reaction ${currentUserReacted ? 'user-reacted' : ''}`}
                                    title={`${reactionGroup.users.join(', ')}`}
                                    onClick={() => handleReaction(messageIndex, reactionGroup.emoji)}
                                >
                                    {reactionGroup.emoji}
                                    {reactionGroup.count > 1 && (
                                        <span className="reaction-count">{reactionGroup.count}</span>
                                    )}
                                </span>
                            );
                        })}
                    </div>
                )}
                
                {/* Message interaction buttons */}
                {!selectionMode && isHovered && (
                    <div className={`message-actions ${isSent ? 'actions-left' : 'actions-right'}`}>
                        <button
                            className="action-btn reaction-btn"
                            onClick={() => setShowEmojiPicker(showEmojiPicker === messageIndex ? null : messageIndex)}
                            title="Add reaction"
                        >
                            😊
                        </button>
                        <button
                            className="action-btn reply-btn"
                            onClick={() => startReply(messageIndex)}
                            title="Reply"
                        >
                            ↩️
                        </button>
                        <button
                            className="action-btn select-btn"
                            onClick={() => enterSelectionMode(messageIndex)}
                            title="Select"
                        >
                            ✓
                        </button>
                    </div>
                )}
                
                {/* Emoji picker */}
                {showEmojiPicker === messageIndex && (
                    <div className="emoji-picker">
                        {REACTION_EMOJIS.map((emoji, index) => (
                            <button
                                key={index}
                                className="emoji-btn"
                                onClick={() => handleReaction(messageIndex, emoji)}
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Quiet fetching functions for real-time updates (no loading states)
    const fetchConversationsQuietly = async () => {
        try {
            const response = await axios.get(`/messages/conversations?userId=${userId}`);
            let conversationsData = response.data;
            
            // Only update if there are actual changes to prevent unnecessary re-renders
            const currentIds = conversations.map(c => c.userId).sort().join(',');
            const newIds = conversationsData.map(c => c.userId).sort().join(',');
            
            if (currentIds !== newIds || JSON.stringify(conversations) !== JSON.stringify(conversationsData)) {
                // Fetch profile photos for new conversations only
                const conversationsWithPhotos = await Promise.all(
                    conversationsData.map(async (conversation) => {
                        if (!conversation.profilePhotoUrl && conversation.userId) {
                            try {
                                const profileResponse = await axios.get(`/profile/${conversation.userId}`);
                                return {
                                    ...conversation,
                                    profilePhotoUrl: profileResponse.data?.profilePhotoUrl || null
                                };
                            } catch (error) {
                                return conversation;
                            }
                        }
                        return conversation;
                    })
                );
                
                setConversations(conversationsWithPhotos);
            }
        } catch (error) {
            console.error('Error quietly fetching conversations:', error);
        }
    };

    // Specific function to sync reactions in real-time without affecting conversation
    const syncReactionsOnly = async () => {
        if (messages.length > 0 && selectedConversation) {
            // Prevent too frequent calls - minimum 10 seconds between fetches
            const now = Date.now();
            if (now - lastReactionFetchRef.current < 10000) {
                return;
            }
            lastReactionFetchRef.current = now;
            
            try {
                // Only fetch reactions if we don't already have them cached
                const messagesToCheck = messages.filter(msg => !messageReactions[msg.id]);
                if (messagesToCheck.length > 0) {
                    await fetchReactionsForMessages(messagesToCheck);
                }
            } catch (error) {
                // Silently handle errors to prevent console spam
            }
        }
    };

    const fetchConversationQuietly = async (otherUserId) => {
        try {
            const response = await axios.get(
                `/messages/conversation/${otherUserId}?userId=${userId}`
            );
            
            // Only update if there are new messages to prevent UI flicker
            if (response.data.length !== messages.length || 
                JSON.stringify(response.data) !== JSON.stringify(messages)) {
                
                // Extract current user's name from messages where they are the sender
                if (response.data.length > 0 && !currentUserName) {
                    const currentUserMessage = response.data.find(msg => msg.senderId === userId);
                    if (currentUserMessage && currentUserMessage.senderName) {
                        setCurrentUserName(currentUserMessage.senderName);
                    }
                }
                
                setMessages(response.data);
                
                // Don't fetch reactions here - let the dedicated reaction polling handle it
                // This prevents duplicate API calls and errors
            }
        } catch (error) {
            console.error('Error quietly fetching conversation:', error);
        }
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
                                        {selectedConversation.profilePhotoUrl ? (
                                            <img 
                                                src={selectedConversation.profilePhotoUrl} 
                                                alt={selectedConversation.userName} 
                                                className="chat-avatar-image"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                    e.target.nextSibling.style.display = 'flex';
                                                }}
                                            />
                                        ) : null}
                                        <div 
                                            className="chat-avatar-initials" 
                                            style={{ display: selectedConversation.profilePhotoUrl ? 'none' : 'flex' }}
                                        >
                                            {selectedConversation.userName?.charAt(0).toUpperCase() || 'U'}
                                        </div>
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
                                                className={`conversation-item ${conversation.unreadCount > 0 ? 'unread' : ''} ${conversation.userName === 'disabled user' ? 'disabled-user' : ''}`}
                                                onClick={() => {
                                                    // Prevent interaction with disabled users
                                                    if (conversation.userName === 'disabled user') {
                                                        return; // Do nothing for disabled users
                                                    }
                                                    setSelectedConversation(conversation);
                                                    // Open chat in the same modal and mark messages as read
                                                    openChatModal(conversation);
                                                }}
                                            >
                                                <div className="conversation-avatar">
                                                    {conversation.profilePhotoUrl ? (
                                                        <img 
                                                            src={conversation.profilePhotoUrl} 
                                                            alt={conversation.userName} 
                                                            className="conversation-avatar-image"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div 
                                                        className="conversation-avatar-initials" 
                                                        style={{ display: conversation.profilePhotoUrl ? 'none' : 'flex' }}
                                                    >
                                                        {conversation.userName?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
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
                                                    {user.profilePhotoUrl ? (
                                                        <img 
                                                            src={user.profilePhotoUrl} 
                                                            alt={user.name} 
                                                            className="user-avatar-image"
                                                            onError={(e) => {
                                                                e.target.style.display = 'none';
                                                                e.target.nextSibling.style.display = 'flex';
                                                            }}
                                                        />
                                                    ) : null}
                                                    <div 
                                                        className="user-avatar-initials" 
                                                        style={{ display: user.profilePhotoUrl ? 'none' : 'flex' }}
                                                    >
                                                        {user.name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
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
                                                {renderMessageContent(message, index)}
                                                <div className="message-time">{formatTime(message.timestamp)}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-messages">
                                            Start your conversation with {selectedConversation.userName}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Selection mode toolbar */}
                                {selectionMode && selectedMessages.size > 0 && (
                                    <div className="selection-toolbar">
                                        <div className="selection-info">
                                            {selectedMessages.size} message(s) selected
                                        </div>
                                        <div className="selection-actions">
                                            <button 
                                                className="toolbar-btn forward-btn"
                                                onClick={forwardMessages}
                                                title="Forward"
                                            >
                                                📤 Forward
                                            </button>
                                            <button 
                                                className="toolbar-btn delete-btn"
                                                onClick={deleteSelectedMessages}
                                                title="Delete"
                                            >
                                                🗑️ Delete
                                            </button>
                                            <button 
                                                className="toolbar-btn cancel-btn"
                                                onClick={exitSelectionMode}
                                                title="Cancel"
                                            >
                                                ✕ Cancel
                                            </button>
                                        </div>
                                    </div>
                                )}
                                
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
                                    
                                    {/* Reply indicator */}
                                    {replyingTo && (
                                        <div className="reply-indicator-input">
                                            <div className="reply-content">
                                                <span className="reply-label">Replying to {replyingTo.sender}:</span>
                                                <span className="reply-text">{replyingTo.content}</span>
                                            </div>
                                            <button 
                                                className="cancel-reply-btn"
                                                onClick={cancelReply}
                                                title="Cancel reply"
                                            >
                                                ✕
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
                                            +
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

            {/* Modern Forward Modal - Messenger/Telegram Style */}
            {showForwardModal && (
                <div className="modern-forward-overlay" onClick={() => setShowForwardModal(false)}>
                    <div className="modern-forward-modal" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="modern-forward-header">
                            <button 
                                className="forward-back-btn"
                                onClick={() => setShowForwardModal(false)}
                            >
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
                                </svg>
                            </button>
                            <div className="forward-header-info">
                                <h3>Forward Messages</h3>
                                <span className="forward-subtitle">{forwardingMessages.length} message{forwardingMessages.length !== 1 ? 's' : ''}</span>
                            </div>
                            {selectedForwardRecipients.size > 0 && (
                                <button 
                                    className="forward-send-btn"
                                    onClick={sendForwardedMessages}
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                                    </svg>
                                </button>
                            )}
                        </div>

                        {/* Selected Recipients Bar */}
                        {selectedForwardRecipients.size > 0 && (
                            <div className="selected-recipients-bar">
                                <div className="selected-recipients-scroll">
                                    {Array.from(selectedForwardRecipients).map(userId => {
                                        const user = [...conversations, ...availableUsers].find(
                                            u => u.userId === userId || u.id === userId
                                        );
                                        const userName = user?.userName || user?.name || 'Unknown';
                                        return (
                                            <div key={userId} className="selected-recipient-chip">
                                                <span className="chip-avatar">
                                                    {userName.charAt(0).toUpperCase()}
                                                </span>
                                                <span className="chip-name">{userName}</span>
                                                <button 
                                                    className="chip-remove"
                                                    onClick={() => toggleRecipientSelection(userId)}
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="recipient-count">
                                    {selectedForwardRecipients.size} selected
                                </div>
                            </div>
                        )}

                        {/* Search Bar */}
                        <div className="forward-search-container">
                            <div className="forward-search-wrapper">
                                <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                                </svg>
                                <input
                                    type="text"
                                    placeholder="Search for people..."
                                    className="forward-search-input"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Recipients List */}
                        <div className="forward-recipients-container">
                            <div className="forward-recipients-list">
                                {/* Recent Conversations */}
                                {conversations.length > 0 && (
                                    <>
                                        <div className="recipient-section-header">Recent Chats</div>
                                        {conversations
                                            .filter(conv => 
                                                !searchTerm || 
                                                conv.userName.toLowerCase().includes(searchTerm.toLowerCase())
                                            )
                                            .map((conversation) => {
                                                const isSelected = selectedForwardRecipients.has(conversation.userId);
                                                return (
                                                    <div
                                                        key={`conv-${conversation.userId}`}
                                                        className={`modern-recipient-item ${isSelected ? 'selected' : ''}`}
                                                        onClick={() => toggleRecipientSelection(conversation.userId)}
                                                    >
                                                        <div className="recipient-checkbox">
                                                            <div className={`checkbox ${isSelected ? 'checked' : ''}`}>
                                                                {isSelected && <span className="checkmark">✓</span>}
                                                            </div>
                                                        </div>
                                                        <div className="modern-recipient-avatar">
                                                            {conversation.profilePhotoUrl ? (
                                                                <img 
                                                                    src={conversation.profilePhotoUrl} 
                                                                    alt={conversation.userName} 
                                                                    className="recipient-avatar-image"
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none';
                                                                        e.target.nextSibling.style.display = 'flex';
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div 
                                                                className="recipient-avatar-initials" 
                                                                style={{ display: conversation.profilePhotoUrl ? 'none' : 'flex' }}
                                                            >
                                                                {conversation.userName?.charAt(0).toUpperCase() || 'U'}
                                                            </div>
                                                        </div>
                                                        <div className="modern-recipient-info">
                                                            <span className="modern-recipient-name">{conversation.userName}</span>
                                                            <span className="modern-recipient-role">{conversation.userRole}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </>
                                )}
                                
                                {/* All Users */}
                                {availableUsers.length > 0 && (
                                    <>
                                        <div className="recipient-section-header">All Users</div>
                                        {availableUsers
                                            .filter(user => 
                                                (!searchTerm || 
                                                user.name.toLowerCase().includes(searchTerm.toLowerCase())) &&
                                                !conversations.some(conv => conv.userId === user.id)
                                            )
                                            .map((user) => {
                                                const isSelected = selectedForwardRecipients.has(user.id);
                                                return (
                                                    <div
                                                        key={`user-${user.id}`}
                                                        className={`modern-recipient-item ${isSelected ? 'selected' : ''}`}
                                                        onClick={() => toggleRecipientSelection(user.id)}
                                                    >
                                                        <div className="recipient-checkbox">
                                                            <div className={`checkbox ${isSelected ? 'checked' : ''}`}>
                                                                {isSelected && <span className="checkmark">✓</span>}
                                                            </div>
                                                        </div>
                                                        <div className="modern-recipient-avatar">
                                                            {user.profilePhotoUrl ? (
                                                                <img 
                                                                    src={user.profilePhotoUrl} 
                                                                    alt={user.name} 
                                                                    className="recipient-avatar-image"
                                                                    onError={(e) => {
                                                                        e.target.style.display = 'none';
                                                                        e.target.nextSibling.style.display = 'flex';
                                                                    }}
                                                                />
                                                            ) : null}
                                                            <div 
                                                                className="recipient-avatar-initials" 
                                                                style={{ display: user.profilePhotoUrl ? 'none' : 'flex' }}
                                                            >
                                                                {user.name?.charAt(0).toUpperCase() || 'U'}
                                                            </div>
                                                        </div>
                                                        <div className="modern-recipient-info">
                                                            <span className="modern-recipient-name">{user.name}</span>
                                                            <span className="modern-recipient-role">{user.role}</span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                    </>
                                )}
                            </div>
                        </div>
                        
                        {/* Forward Action Button */}
                        <div className="forward-modal-footer">
                            <button 
                                className={`forward-action-btn ${selectedForwardRecipients.size > 0 ? 'active' : 'disabled'}`}
                                onClick={sendForwardedMessages}
                                disabled={selectedForwardRecipients.size === 0}
                            >
                                {selectedForwardRecipients.size > 0 
                                    ? `Forward to ${selectedForwardRecipients.size} recipient${selectedForwardRecipients.size > 1 ? 's' : ''}` 
                                    : 'Select recipients to forward'
                                }
                            </button>
                        </div>
                    </div>
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