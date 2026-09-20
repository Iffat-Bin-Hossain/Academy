import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from '../api/axiosInstance';
import Linkify from 'react-linkify';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { 
    FiPaperclip, 
    FiSmile, 
    FiCornerUpLeft, 
    FiCornerUpRight, 
    FiCheck, 
    FiTrash2, 
    FiX, 
    FiFolder,
    FiHeart,
    FiThumbsUp,
    FiThumbsDown,
    FiZap,
    FiStar,
    FiMessageSquare,
    FiSend,
    FiPlus,
    FiArrowLeft,
    FiMaximize2,
    FiMinimize2,
    FiSearch,
    FiAlertCircle,
    FiInfo,
    FiFileText,
    FiDownload,
    FiShare2
} from 'react-icons/fi';
import { auth } from '../utils/auth';
import './MessageIcon.css';

// Available smart reactions with native emojis
const SMART_REACTIONS = [
    { id: 'like', label: 'Like', emoji: '👍' },
    { id: 'heart', label: 'Love', emoji: '❤️' },
    { id: 'smile', label: 'Laugh', emoji: '😂' },
    { id: 'zap', label: 'Fire', emoji: '🔥' },
    { id: 'star', label: 'Star', emoji: '⭐' },
    { id: 'check', label: 'Check', emoji: '✅' },
];

const renderReactionBadge = (reactionKey) => {
    switch (reactionKey) {
        case 'like':
        case '👍':
            return <span className="reaction-badge-symbol" role="img" aria-label="like">👍</span>;
        case 'heart':
        case '❤️':
        case '❤':
            return <span className="reaction-badge-symbol" role="img" aria-label="heart">❤️</span>;
        case 'smile':
        case 'laugh':
        case '😂':
        case '😊':
            return <span className="reaction-badge-symbol" role="img" aria-label="smile">😂</span>;
        case 'zap':
        case 'fire':
        case '🔥':
        case '⚡':
            return <span className="reaction-badge-symbol" role="img" aria-label="fire">🔥</span>;
        case 'star':
        case '⭐':
        case '✨':
            return <span className="reaction-badge-symbol" role="img" aria-label="star">⭐</span>;
        case 'check':
        case '✅':
            return <span className="reaction-badge-symbol" role="img" aria-label="check">✅</span>;
        case 'dislike':
        case '👎':
            return <span className="reaction-badge-symbol" role="img" aria-label="dislike">👎</span>;
        default:
            return <span className="reaction-badge-symbol">{reactionKey}</span>;
    }
};

const MessageIcon = ({ userId }) => {
    const [showModal, setShowModal] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [forwardSearchTerm, setForwardSearchTerm] = useState('');
    const [availableUsers, setAvailableUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [filteredConversations, setFilteredConversations] = useState([]);
    const [currentView, setCurrentView] = useState('conversations');
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [showImageModal, setShowImageModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [currentUserName, setCurrentUserName] = useState('');

    // Toast notification state
    const [toast, setToast] = useState(null);
    const toastTimeoutRef = useRef(null);

    // Message interaction states
    const [selectedMessages, setSelectedMessages] = useState(new Set());
    const [selectionMode, setSelectionMode] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(null);
    const [forwardingMessages, setForwardingMessages] = useState([]);
    const [hoveredMessage, setHoveredMessage] = useState(null);
    const [showForwardModal, setShowForwardModal] = useState(false);
    const [selectedForwardRecipients, setSelectedForwardRecipients] = useState(new Set());
    const [messageReactions, setMessageReactions] = useState({});
    const [dragOver, setDragOver] = useState(false);
    const [highlightedMessageId, setHighlightedMessageId] = useState(null);

    // WebSocket connection status indicator
    const [wsConnected, setWsConnected] = useState(false);

    const modalRef = useRef(null);
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);
    const hoverTimeoutRef = useRef(null);
    // WebSocket STOMP client ref — replaces all polling interval refs
    const stompClientRef = useRef(null);
    const selectedConversationRef = useRef(null);

    // Helper: Show smooth in-app toast notification
    const showToast = useCallback((message, type = 'info', duration = 3200) => {
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }
        setToast({ message, type, id: Date.now() });
        toastTimeoutRef.current = setTimeout(() => {
            setToast(null);
        }, duration);
    }, []);

    // Initialize current user name from auth token on mount
    useEffect(() => {
        try {
            const user = auth.getCurrentUser();
            if (user && user.name) {
                setCurrentUserName(user.name);
            }
        } catch (e) {
            console.debug('Failed to get user name from auth token:', e);
        }
    }, []);

    // Global keyboard shortcuts (Escape to close modals / exit reply)
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (showForwardModal) {
                    setShowForwardModal(false);
                    setForwardSearchTerm('');
                    setForwardingMessages([]);
                    setSelectedForwardRecipients(new Set());
                } else if (replyingTo) {
                    setReplyingTo(null);
                } else if (selectionMode) {
                    setSelectionMode(false);
                    setSelectedMessages(new Set());
                } else if (showImageModal) {
                    setShowImageModal(false);
                    setSelectedImage(null);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showForwardModal, replyingTo, selectionMode, showImageModal]);

    // Keep selectedConversationRef in sync with state for use inside WS callbacks
    useEffect(() => {
        selectedConversationRef.current = selectedConversation;
    }, [selectedConversation]);

    // ─── WebSocket lifecycle ──────────────────────────────────────────────────
    const connectWebSocket = useCallback(() => {
        if (stompClientRef.current?.connected) return;

        const token = localStorage.getItem('token');
        const backendBase = window.location.hostname === 'localhost'
            ? 'http://localhost:8081'
            : window.location.origin;

        const client = new Client({
            webSocketFactory: () => new SockJS(`${backendBase}/ws`),
            connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
            reconnectDelay: 3000,
            heartbeatIncoming: 4000,
            heartbeatOutgoing: 4000,
            onConnect: () => {
                setWsConnected(true);

                // Subscribe: incoming messages for this user's conversations
                client.subscribe(`/topic/messages/${userId}-*`, () => {}); // wildcard not supported — use dynamic subscriptions below

                // Subscribe: unread count updates
                client.subscribe(`/topic/unread/${userId}`, (frame) => {
                    try {
                        const count = JSON.parse(frame.body);
                        setUnreadCount(count);
                    } catch (e) { /* ignore */ }
                });
            },
            onDisconnect: () => {
                setWsConnected(false);
            },
            onStompError: (frame) => {
                console.warn('STOMP error:', frame.headers?.message);
                setWsConnected(false);
            },
        });

        client.activate();
        stompClientRef.current = client;
    }, [userId]);

    const disconnectWebSocket = useCallback(() => {
        if (stompClientRef.current) {
            stompClientRef.current.deactivate();
            stompClientRef.current = null;
            setWsConnected(false);
        }
    }, []);

    // Subscribe to a specific conversation's message and reaction topics
    const subscribeToConversation = useCallback((otherUserId) => {
        const client = stompClientRef.current;
        if (!client?.connected) return;

        // Messages: both directions
        client.subscribe(`/topic/messages/${userId}-${otherUserId}`, (frame) => {
            try {
                const newMsg = JSON.parse(frame.body);
                setMessages(prev => {
                    // Deduplicate: don't add if already present by id
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                });
                // Refresh conversation list to update last message preview
                fetchConversationsQuietly();
            } catch (e) { /* ignore */ }
        });

        client.subscribe(`/topic/messages/${otherUserId}-${userId}`, (frame) => {
            try {
                const newMsg = JSON.parse(frame.body);
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) return prev;
                    return [...prev, newMsg];
                });
                fetchConversationsQuietly();
            } catch (e) { /* ignore */ }
        });

        // Reactions: both directions
        client.subscribe(`/topic/reactions/${userId}-${otherUserId}`, (frame) => {
            try {
                const update = JSON.parse(frame.body);
                if (update.messageId && update.reactions) {
                    const reactionsArray = Object.entries(update.reactions).map(([emoji, data]) => ({
                        emoji,
                        count: data.count,
                        users: data.users,
                        userName: data.users?.join(', ')
                    }));
                    setMessageReactions(prev => ({ ...prev, [update.messageId]: reactionsArray }));
                }
            } catch (e) { /* ignore */ }
        });

        client.subscribe(`/topic/reactions/${otherUserId}-${userId}`, (frame) => {
            try {
                const update = JSON.parse(frame.body);
                if (update.messageId && update.reactions) {
                    const reactionsArray = Object.entries(update.reactions).map(([emoji, data]) => ({
                        emoji,
                        count: data.count,
                        users: data.users,
                        userName: data.users?.join(', ')
                    }));
                    setMessageReactions(prev => ({ ...prev, [update.messageId]: reactionsArray }));
                }
            } catch (e) { /* ignore */ }
        });
    }, [userId]);

    // Connect WebSocket when component mounts with a valid userId
    useEffect(() => {
        if (userId) {
            fetchUnreadCount();
            connectWebSocket();
        }
        return () => disconnectWebSocket();
    }, [userId]);

    // When modal opens: load data; when it closes: nothing to stop (WS stays open)
    useEffect(() => {
        if (showModal && userId) {
            fetchConversations();
            fetchAvailableUsers();
            fetchUnreadCount();
            // Ensure WS is connected when modal is open
            if (!stompClientRef.current?.connected) {
                connectWebSocket();
            }
        }
    }, [showModal, userId]);

    // When conversation changes: subscribe to its topics and load messages
    useEffect(() => {
        if (selectedConversation && showModal) {
            subscribeToConversation(selectedConversation.userId);
        }
    }, [selectedConversation, showModal]);

    const lastReactionFetchRef = useRef(0);


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

    // Handle click outside to close emoji picker
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showEmojiPicker !== null) {
                // Check if the click is outside the emoji picker
                const emojiPicker = document.querySelector('.emoji-picker');
                const emojiButton = event.target.closest('.reaction-btn');

                if (emojiPicker && !emojiPicker.contains(event.target) && !emojiButton) {
                    setShowEmojiPicker(null);
                }
            }
        };

        if (showEmojiPicker !== null) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmojiPicker]);

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

            // Always fetch reactions immediately after loading messages to prevent vanishing
            if (response.data.length > 0) {
                await fetchReactionsForMessages(response.data);
            }

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
            showToast('Failed to send message. Please try again.', 'error');
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
                showToast('Unable to add reaction. Please try again.', 'error');
            } else {
                showToast('Failed to process reaction. Please check your connection.', 'error');
            }
        }
    };

    const startReply = (messageIndex) => {
        const message = messages[messageIndex];
        if (!message) return;
        setReplyingTo({
            id: message.id,
            content: message.content || (message.attachmentFilename ? `📎 ${message.attachmentFilename}` : 'Attachment'),
            sender: message.senderName || 'User'
        });
        setSelectionMode(false);
        setSelectedMessages(new Set());
    };

    const cancelReply = () => {
        setReplyingTo(null);
    };

    // Direct 1-click forward for a single message
    const startForwardSingle = (message) => {
        if (!message) return;
        setForwardingMessages([message]);
        setSelectedForwardRecipients(new Set());
        setForwardSearchTerm('');
        setShowForwardModal(true);
    };

    // Direct 1-click delete for an owned message
    const handleDeleteSingle = async (messageId) => {
        if (!messageId) return;
        if (window.confirm('Delete this message? This action cannot be undone.')) {
            try {
                await axios.delete(`/messages/${messageId}?userId=${userId}`);
                showToast('Message deleted', 'success');
                if (selectedConversation) {
                    await fetchConversationQuietly(selectedConversation.userId);
                }
                fetchConversations();
            } catch (error) {
                console.error('Error deleting message:', error);
                showToast('Failed to delete message', 'error');
            }
        }
    };

    // Smooth scroll to quoted message and flash highlight
    const scrollToMessage = (targetMessageId) => {
        if (!targetMessageId) return;
        const elem = document.getElementById(`chat-message-${targetMessageId}`);
        if (elem) {
            elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setHighlightedMessageId(targetMessageId);
            setTimeout(() => {
                setHighlightedMessageId(null);
            }, 1800);
        } else {
            showToast('Quoted message not visible in current view', 'info');
        }
    };

    // Multi-message forward from selection mode
    const forwardMessages = () => {
        if (selectedMessages.size === 0) {
            showToast('Please select messages to forward.', 'warning');
            return;
        }

        const messagesToForward = Array.from(selectedMessages).map(index => {
            const message = messages[index];
            if (!message) {
                console.error('No message found at index:', index);
                return null;
            }
            return message;
        }).filter(Boolean);

        if (messagesToForward.length === 0) {
            showToast('No valid messages selected for forwarding.', 'warning');
            return;
        }

        setForwardingMessages(messagesToForward);
        setSelectedForwardRecipients(new Set());
        setForwardSearchTerm('');
        setShowForwardModal(true);
        setSelectionMode(false);
        setSelectedMessages(new Set());
    };

    const toggleRecipientSelection = (targetUserId) => {
        setSelectedForwardRecipients(prev => {
            const newSet = new Set(prev);
            if (newSet.has(targetUserId)) {
                newSet.delete(targetUserId);
            } else {
                newSet.add(targetUserId);
            }
            return newSet;
        });
    };

    const sendForwardedMessages = async () => {
        try {
            if (selectedForwardRecipients.size === 0) {
                showToast('Please select at least one recipient.', 'warning');
                return;
            }

            if (forwardingMessages.length === 0) {
                showToast('No messages to forward.', 'warning');
                return;
            }

            const recipientCount = selectedForwardRecipients.size;
            const messageCount = forwardingMessages.length;

            for (const recipientId of selectedForwardRecipients) {
                for (const message of forwardingMessages) {
                    if (!message) continue;

                    if (message.attachmentUrl && message.attachmentContentType) {
                        let cleanContent = message.content || 'File attachment';
                        const params = new URLSearchParams();
                        params.append('senderId', userId);
                        params.append('recipientId', recipientId);
                        params.append('content', cleanContent);
                        params.append('attachmentUrl', message.attachmentUrl);
                        params.append('attachmentFilename', message.attachmentFilename || 'forwarded_file');
                        params.append('attachmentSize', message.attachmentSize || 0);
                        params.append('attachmentContentType', message.attachmentContentType);
                        params.append('isForwarded', 'true');

                        await axios.post('/messages/send-with-attachment', params, {
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded'
                            }
                        });
                    } else if (message.content) {
                        const forwardData = {
                            recipientId: recipientId,
                            content: message.content,
                            isForwarded: true
                        };
                        await axios.post(`/messages/send?senderId=${userId}`, forwardData);
                    }
                }
            }

            setShowForwardModal(false);
            setForwardingMessages([]);
            setSelectedForwardRecipients(new Set());
            setForwardSearchTerm('');
            exitSelectionMode();

            // Refresh conversations and active chat
            fetchConversations();
            if (selectedConversation) {
                fetchConversation(selectedConversation.userId);
            }

            showToast(`Forwarded ${messageCount} message${messageCount !== 1 ? 's' : ''} to ${recipientCount} recipient${recipientCount !== 1 ? 's' : ''}!`, 'success');
        } catch (error) {
            console.error('Error forwarding messages:', error);
            showToast('Failed to forward messages. Please try again.', 'error');
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
                    if (!message || !message.id) return null;
                    return message.id;
                }).filter(Boolean);

                if (messageIds.length === 0) {
                    showToast('No valid messages selected for deletion.', 'warning');
                    return;
                }

                await axios.post(`/messages/delete-multiple?userId=${userId}`, messageIds);
                showToast(`Deleted ${messageCount} ${messageText}`, 'success');
                await fetchConversation(selectedConversation.userId);
                exitSelectionMode();
                fetchConversations();
            } catch (error) {
                console.error('Error deleting messages:', error);
                showToast('Failed to delete messages. You may not have permission.', 'error');
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
        if (conversation.userName === 'disabled user') {
            return;
        }

        setSelectedConversation(conversation);

        if (!conversation.profilePhotoUrl) {
            fetchUserProfilePhoto(conversation.userId, conversation);
        }

        fetchConversation(conversation.userId);
        setSearchTerm('');
        setCurrentView('chat');
        setConversations(prevConversations =>
            prevConversations.map(conv =>
                conv.userId === conversation.userId
                    ? { ...conv, unreadCount: 0 }
                    : conv
            )
        );
    };

    const fetchUserProfilePhoto = async (targetUserId, conversation) => {
        try {
            const response = await axios.get(`/profile/${targetUserId}`);
            if (response.data?.profilePhotoUrl) {
                setSelectedConversation(prev => ({
                    ...prev,
                    profilePhotoUrl: response.data.profilePhotoUrl
                }));

                setConversations(prevConversations =>
                    prevConversations.map(conv =>
                        conv.userId === targetUserId
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
        setShowModal(false);
        setSearchTerm('');
    };

    const processSelectedFile = (file) => {
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) {
            showToast('File size too large. Maximum 10MB allowed.', 'error');
            return;
        }

        setSelectedFile(file);

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setFilePreview(e.target.result);
            reader.readAsDataURL(file);
        } else {
            setFilePreview(null);
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        processSelectedFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!dragOver) setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOver(false);
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processSelectedFile(e.dataTransfer.files[0]);
            showToast('File attached', 'info');
        }
    };

    const handlePaste = (e) => {
        if (e.clipboardData && e.clipboardData.items) {
            for (let i = 0; i < e.clipboardData.items.length; i++) {
                const item = e.clipboardData.items[i];
                if (item.type.indexOf('image') !== -1) {
                    const file = item.getAsFile();
                    if (file) {
                        processSelectedFile(file);
                        showToast('Image pasted from clipboard', 'info');
                        break;
                    }
                }
            }
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
            showToast('Failed to download file. Please try again.', 'error');
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
                    if (hoverTimeoutRef.current) {
                        clearTimeout(hoverTimeoutRef.current);
                    }
                    hoverTimeoutRef.current = setTimeout(() => {
                        setHoveredMessage(messageIndex);
                    }, 200);
                }}
                onMouseLeave={() => {
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

                {/* Reply indicator - Interactive click-to-scroll quote */}
                {message.replyToMessageId && (
                    <div 
                        className="modern-reply-indicator clickable-quote"
                        onClick={(e) => {
                            e.stopPropagation();
                            scrollToMessage(message.replyToMessageId);
                        }}
                        title="Click to jump to quoted message"
                    >
                        <div className="reply-line"></div>
                        <div className="reply-content">
                            <div className="reply-to-name">
                                <FiCornerUpLeft size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                {message.replyToSenderName || 'Previous message'}
                            </div>
                            <div className="reply-to-text">
                                {message.replyToContent ?
                                    (message.replyToContent.length > 55 ?
                                        message.replyToContent.substring(0, 55) + '...' :
                                        message.replyToContent
                                    ) :
                                    'Message / Attachment'
                                }
                            </div>
                        </div>
                    </div>
                )}

                {/* Message text with linkify */}
                {message.content && (!hasAttachment || (message.content !== 'File attachment' && message.content !== 'Attachment')) && (
                    <div className="message-text">
                        {/* Check if this is a forwarded message */}
                        {(message.isForwarded === true || message.forwarded === true) ? (
                            <>
                                <div className="forwarded-indicator">
                                    <span className="forwarded-arrow">↩</span>
                                    <span className="forwarded-label">
                                        {String(message.senderId) === String(userId) ? "You forwarded" : "Forwarded"}
                                    </span>
                                </div>
                                <div className="forwarded-content">
                                    <Linkify properties={{ target: '_blank', rel: 'noopener noreferrer' }}>
                                        {message.content}
                                    </Linkify>
                                </div>
                            </>
                        ) : (
                            <Linkify properties={{ target: '_blank', rel: 'noopener noreferrer' }}>
                                {message.content}
                            </Linkify>
                        )}
                    </div>
                )}

                {/* Modern File / Image Attachment */}
                {hasAttachment && (
                    <div className="message-attachment">
                        {isImageFile(message.attachmentContentType) ? (
                            <div className="attachment-image">
                                <img
                                    src={message.attachmentUrl}
                                    alt={message.attachmentFilename}
                                    onClick={() => openImageModal(message.attachmentUrl)}
                                    className="attachment-img-preview"
                                />
                                {message.attachmentFilename && (
                                    <div className="attachment-filename">{message.attachmentFilename}</div>
                                )}
                            </div>
                        ) : (
                            <div className="modern-file-card">
                                <div className="file-card-icon">
                                    <FiFileText size={20} />
                                </div>
                                <div className="file-card-info">
                                    <div className="file-card-name" title={message.attachmentFilename}>
                                        {message.attachmentFilename || 'Attached file'}
                                    </div>
                                    <div className="file-card-size">
                                        {formatFileSize(message.attachmentSize)}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleFileView(message.attachmentUrl, message.attachmentFilename);
                                    }}
                                    className="file-download-btn"
                                    type="button"
                                    title="Download file"
                                >
                                    <FiDownload size={13} />
                                    <span>Download</span>
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Reactions display pills */}
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
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleReaction(messageIndex, reactionGroup.emoji);
                                    }}
                                >
                                    {renderReactionBadge(reactionGroup.emoji)}
                                    {reactionGroup.count > 1 && (
                                        <span className="reaction-count">{reactionGroup.count}</span>
                                    )}
                                </span>
                            );
                        })}
                    </div>
                )}

                {/* Message interaction buttons (Hover Toolbar) */}
                {!selectionMode && isHovered && (
                    <div className={`message-actions ${isSent ? 'actions-left' : 'actions-right'}`}>
                        <button
                            className="action-btn reaction-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowEmojiPicker(showEmojiPicker === messageIndex ? null : messageIndex);
                            }}
                            title="Add reaction"
                            type="button"
                        >
                            <FiSmile size={14} />
                        </button>
                        <button
                            className="action-btn reply-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                startReply(messageIndex);
                            }}
                            title="Reply"
                            type="button"
                        >
                            <FiCornerUpLeft size={14} />
                        </button>
                        <button
                            className="action-btn forward-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                startForwardSingle(message);
                            }}
                            title="Forward"
                            type="button"
                        >
                            <FiCornerUpRight size={14} />
                        </button>
                        {isSent && (
                            <button
                                className="action-btn delete-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteSingle(message.id);
                                }}
                                title="Delete"
                                type="button"
                            >
                                <FiTrash2 size={14} />
                            </button>
                        )}
                        <button
                            className="action-btn select-btn"
                            onClick={(e) => {
                                e.stopPropagation();
                                enterSelectionMode(messageIndex);
                            }}
                            title="Select"
                            type="button"
                        >
                            <FiCheck size={14} />
                        </button>
                    </div>
                )}

                {/* Reaction picker popover */}
                {showEmojiPicker === messageIndex && (
                    <div className={`modern-reaction-picker ${isSent ? 'picker-right' : 'picker-left'}`}>
                        {SMART_REACTIONS.map((r) => (
                            <button
                                key={r.id}
                                className="reaction-emoji-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleReaction(messageIndex, r.id);
                                }}
                                title={r.label}
                                type="button"
                            >
                                <span className="reaction-picker-emoji">{r.emoji}</span>
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
            // Prevent too frequent calls - minimum 5 seconds between fetches for better real-time experience
            const now = Date.now();
            if (now - lastReactionFetchRef.current < 5000) {
                return;
            }
            lastReactionFetchRef.current = now;

            try {
                // Always fetch reactions for all messages to ensure they're up to date
                await fetchReactionsForMessages(messages);
            } catch (error) {
                // Silently handle errors to prevent console spam
                console.debug('Silent reaction sync error:', error);
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

                // Fetch reactions for new messages to ensure they appear immediately
                if (response.data.length > 0) {
                    await fetchReactionsForMessages(response.data);
                }
            }
        } catch (error) {
            console.error('Error quietly fetching conversation:', error);
        }
    };

    return (
        <div className="message-icon-container">
            <button
                className="message-icon-btn"
                onClick={() => {
                    // Close forward modal if it's open when main modal is clicked
                    if (showForwardModal) {
                        setShowForwardModal(false);
                        setForwardSearchTerm('');
                        setSelectedForwardRecipients(new Set());
                    }
                    setShowModal(!showModal);
                }}
                aria-label="Messages"
                title="Messages"
            >
                <FiMessageSquare size={20} />
                {unreadCount > 0 && (
                    <span className="message-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {showModal && (
                <div
                    className={`message-dropdown ${isExpanded ? 'is-expanded' : ''}`}
                    ref={modalRef}
                >
                    {/* In-app Toast Notification */}
                    {toast && (
                        <div className={`chat-toast chat-toast-${toast.type}`}>
                            {toast.type === 'success' && <FiCheck size={14} />}
                            {toast.type === 'error' && <FiAlertCircle size={14} />}
                            {toast.type === 'info' && <FiInfo size={14} />}
                            {toast.type === 'warning' && <FiAlertCircle size={14} />}
                            <span>{toast.message}</span>
                            <button className="chat-toast-close" onClick={() => setToast(null)} type="button">
                                <FiX size={12} />
                            </button>
                        </div>
                    )}

                    {/* Header with back button for chat view */}
                    {currentView === 'chat' ? (
                        <div className="message-dropdown-header messenger-chat-header">
                            <div className="header-left">
                                <button
                                    className="chat-back-btn"
                                    onClick={() => {
                                        setCurrentView('conversations');
                                        setSelectedConversation(null);
                                    }}
                                    title="Back to chats"
                                    type="button"
                                >
                                    <FiArrowLeft size={18} />
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
                                            <span className={`messenger-online-dot ${wsConnected ? 'active' : ''}`}></span>
                                        </div>
                                        <div className="chat-header-text">
                                            <div className="chat-user-name">{selectedConversation.userName}</div>
                                            <div className="chat-user-role">{selectedConversation.userRole}</div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="header-actions">
                                <span 
                                    className={`ws-status-dot ${wsConnected ? 'connected' : 'connecting'}`} 
                                    title={wsConnected ? 'Connected (live)' : 'Connecting live...'} 
                                />
                                <button
                                    className="header-action-btn expand-btn"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    title={isExpanded ? "Standard size" : "Expand window"}
                                    type="button"
                                >
                                    {isExpanded ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
                                </button>
                                <button
                                    className="header-action-btn close-btn"
                                    onClick={() => setShowModal(false)}
                                    title="Close"
                                    type="button"
                                >
                                    <FiX size={18} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="message-dropdown-header messenger-inbox-header">
                            <div className="header-left">
                                {currentView === 'newChat' && (
                                    <button
                                        className="chat-back-btn"
                                        onClick={() => setCurrentView('conversations')}
                                        title="Back to chats"
                                        type="button"
                                    >
                                        <FiArrowLeft size={18} />
                                    </button>
                                )}
                                <h4>{currentView === 'newChat' ? 'New Message' : 'Chats'}</h4>
                            </div>
                            <div className="message-header-actions">
                                <span 
                                    className={`ws-status-dot ${wsConnected ? 'connected' : 'connecting'}`} 
                                    title={wsConnected ? 'Connected (live)' : 'Connecting live...'} 
                                />
                                {currentView === 'conversations' && (
                                    <button
                                        className="new-chat-btn"
                                        onClick={() => {
                                            setCurrentView('newChat');
                                        }}
                                        title="Start new conversation"
                                        type="button"
                                    >
                                        <FiPlus size={18} />
                                    </button>
                                )}
                                <button
                                    className="header-action-btn expand-btn"
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    title={isExpanded ? "Standard size" : "Expand window"}
                                    type="button"
                                >
                                    {isExpanded ? <FiMinimize2 size={16} /> : <FiMaximize2 size={16} />}
                                </button>
                                <button
                                    className="header-action-btn close-btn"
                                    onClick={() => setShowModal(false)}
                                    title="Close"
                                    type="button"
                                >
                                    <FiX size={18} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Content based on current view */}
                    <div className={`message-dropdown-content ${currentView === 'chat' ? 'chat-view' : ''}`}>
                        {currentView === 'conversations' && (
                            <>
                                <div className="message-search-container">
                                    <div className="message-search-input-wrapper">
                                        <svg className="message-search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="11" cy="11" r="8" />
                                            <path d="M21 21l-4.35-4.35" />
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
                                                    <path d="M18 6L6 18M6 6l12 12" />
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
                                                    <span className="messenger-online-dot"></span>
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
                                            <circle cx="11" cy="11" r="8" />
                                            <path d="M21 21l-4.35-4.35" />
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
                                                    <path d="M18 6L6 18M6 6l12 12" />
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
                            <div 
                                className={`chat-content ${dragOver ? 'drag-over' : ''}`}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                            >
                                {/* Drag & Drop visual overlay */}
                                {dragOver && (
                                    <div className="chat-dropzone-overlay">
                                        <div className="dropzone-box">
                                            <FiPaperclip size={36} className="dropzone-icon" />
                                            <p>Drop file here to send</p>
                                            <span>Images or documents up to 10MB</span>
                                        </div>
                                    </div>
                                )}

                                <div className="chat-messages">
                                    {messages.length > 0 ? (
                                        messages.map((message, index) => (
                                            <div
                                                key={message.id || index}
                                                id={`chat-message-${message.id}`}
                                                className={`message-bubble ${message.senderId === userId ? 'sent' : 'received'} ${highlightedMessageId === message.id ? 'message-highlight-pulse' : ''}`}
                                            >
                                                {renderMessageContent(message, index)}
                                                <div className="message-time">{formatTime(message.timestamp)}</div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="no-messages">
                                            <div className="no-messages-icon">
                                                <FiMessageSquare size={36} />
                                            </div>
                                            <p className="no-messages-title">Start your conversation</p>
                                            <span className="no-messages-sub">with {selectedConversation.userName}</span>
                                        </div>
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                {/* Selection mode toolbar */}
                                {selectionMode && selectedMessages.size > 0 && (
                                    <div className="selection-toolbar">
                                        <div className="selection-info">
                                            {selectedMessages.size} selected
                                        </div>
                                        <div className="selection-actions">
                                            <button
                                                className="toolbar-btn forward-btn"
                                                onClick={forwardMessages}
                                                title="Forward selected"
                                                type="button"
                                            >
                                                <FiCornerUpRight style={{ marginRight: '5px' }} /> Forward
                                            </button>
                                            <button
                                                className="toolbar-btn delete-btn"
                                                onClick={deleteSelectedMessages}
                                                title="Delete selected"
                                                type="button"
                                            >
                                                <FiTrash2 style={{ marginRight: '5px' }} /> Delete
                                            </button>
                                            <button
                                                className="toolbar-btn cancel-btn"
                                                onClick={exitSelectionMode}
                                                title="Cancel"
                                                type="button"
                                            >
                                                <FiX style={{ marginRight: '4px' }} /> Cancel
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
                                                    <div className="file-icon"><FiFolder /></div>
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
                                                type="button"
                                            >
                                                <FiX />
                                            </button>
                                        </div>
                                    )}

                                    {/* Reply indicator banner above input */}
                                    {replyingTo && (
                                        <div className="reply-indicator-input">
                                            <div className="reply-content">
                                                <span className="reply-label">
                                                    <FiCornerUpLeft size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                                                    Replying to {replyingTo.sender}:
                                                </span>
                                                <span className="reply-text">{replyingTo.content}</span>
                                            </div>
                                            <button
                                                className="cancel-reply-btn"
                                                onClick={cancelReply}
                                                title="Cancel reply (Esc)"
                                                type="button"
                                            >
                                                <FiX size={14} />
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
                                            title="Attach file or drop here"
                                            type="button"
                                        >
                                            <FiPaperclip size={18} />
                                        </button>
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                            onPaste={handlePaste}
                                            placeholder={replyingTo ? "Type your reply..." : "Type a message..."}
                                            className="message-input"
                                        />
                                        <button
                                            onClick={sendMessage}
                                            disabled={!newMessage.trim() && !selectedFile}
                                            className="send-btn"
                                            title="Send message"
                                            type="button"
                                        >
                                            <FiSend size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Integrated In-Chat Forward Overlay */}
                    {showForwardModal && (
                        <div className="chat-forward-overlay" onClick={() => {
                            setShowForwardModal(false);
                            setForwardSearchTerm('');
                            setForwardingMessages([]);
                            setSelectedForwardRecipients(new Set());
                        }}>
                            <div className="chat-forward-container" onClick={(e) => e.stopPropagation()}>
                                {/* Header */}
                                <div className="chat-forward-header">
                                    <button
                                        className="chat-back-btn forward-back-btn"
                                        onClick={() => {
                                            setShowForwardModal(false);
                                            setForwardSearchTerm('');
                                            setForwardingMessages([]);
                                            setSelectedForwardRecipients(new Set());
                                        }}
                                        title="Back"
                                        type="button"
                                    >
                                        <FiArrowLeft size={18} />
                                    </button>
                                    <div className="forward-header-info">
                                        <h4>Forward Message</h4>
                                        <span className="forward-subtitle">
                                            {forwardingMessages.length} message{forwardingMessages.length !== 1 ? 's' : ''} queued
                                        </span>
                                    </div>
                                    {selectedForwardRecipients.size > 0 && (
                                        <button
                                            className="forward-send-quick-btn"
                                            onClick={sendForwardedMessages}
                                            title="Send forward now"
                                            type="button"
                                        >
                                            <FiSend size={15} />
                                        </button>
                                    )}
                                </div>

                                {/* Forward Preview Box */}
                                {forwardingMessages.length > 0 && (
                                    <div className="forward-preview-banner">
                                        <div className="forward-preview-tag">
                                            <FiShare2 size={12} style={{ marginRight: '5px' }} />
                                            <span>Forwarding Preview</span>
                                        </div>
                                        <div className="forward-preview-body">
                                            {forwardingMessages.slice(0, 2).map((msg, i) => (
                                                <div key={i} className="preview-snippet">
                                                    <span className="snippet-sender">{msg.senderName || 'Message'}:</span>
                                                    <span className="snippet-text">
                                                        {msg.content || (msg.attachmentFilename ? `📎 ${msg.attachmentFilename}` : 'Attachment')}
                                                    </span>
                                                </div>
                                            ))}
                                            {forwardingMessages.length > 2 && (
                                                <div className="preview-more">+{forwardingMessages.length - 2} more</div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Selected Recipients Bar */}
                                {selectedForwardRecipients.size > 0 && (
                                    <div className="selected-recipients-bar">
                                        <div className="selected-recipients-scroll">
                                            {Array.from(selectedForwardRecipients).map(uId => {
                                                const user = [...conversations, ...availableUsers].find(
                                                    u => u.userId === uId || u.id === uId
                                                );
                                                const userName = user?.userName || user?.name || 'Unknown';
                                                return (
                                                    <div key={uId} className="selected-recipient-chip">
                                                        <span className="chip-avatar">
                                                            {userName.charAt(0).toUpperCase()}
                                                        </span>
                                                        <span className="chip-name">{userName}</span>
                                                        <button
                                                            className="chip-remove"
                                                            onClick={() => toggleRecipientSelection(uId)}
                                                            type="button"
                                                        >
                                                            <FiX size={12} />
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
                                        <FiSearch className="search-icon" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search people to forward..."
                                            className="forward-search-input"
                                            value={forwardSearchTerm}
                                            onChange={(e) => setForwardSearchTerm(e.target.value)}
                                        />
                                        {forwardSearchTerm && (
                                            <button
                                                className="clear-search-btn"
                                                onClick={() => setForwardSearchTerm('')}
                                                type="button"
                                            >
                                                <FiX size={13} />
                                            </button>
                                        )}
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
                                                        !forwardSearchTerm ||
                                                        conv.userName.toLowerCase().includes(forwardSearchTerm.toLowerCase())
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
                                                                        {isSelected && <FiCheck size={12} />}
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

                                        {/* All Available Users */}
                                        {availableUsers.length > 0 && (
                                            <>
                                                <div className="recipient-section-header">All Users</div>
                                                {availableUsers
                                                    .filter(user =>
                                                        (!forwardSearchTerm ||
                                                            user.name.toLowerCase().includes(forwardSearchTerm.toLowerCase())) &&
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
                                                                        {isSelected && <FiCheck size={12} />}
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

                                {/* Forward Action Button Footer */}
                                <div className="forward-modal-footer">
                                    <button
                                        className={`forward-action-btn ${selectedForwardRecipients.size > 0 ? 'active' : 'disabled'}`}
                                        onClick={sendForwardedMessages}
                                        disabled={selectedForwardRecipients.size === 0}
                                        type="button"
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
                </div>
            )}

            {/* Image Lightbox Modal */}
            {showImageModal && selectedImage && (
                <div className="image-modal-overlay" onClick={closeImageModal}>
                    <div className="image-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="close-image-modal" onClick={closeImageModal} type="button"><FiX /></button>
                        <img src={selectedImage} alt="Full size attachment" className="modal-image" />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessageIcon;