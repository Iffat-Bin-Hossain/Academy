package com.example.demo.service;

import com.example.demo.dto.MessageCreateRequest;
import com.example.demo.dto.MessageResponse;
import com.example.demo.dto.ConversationResponse;
import com.example.demo.model.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;
    private final MessageReactionRepository messageReactionRepository;

    @Transactional
    public MessageResponse sendMessage(MessageCreateRequest request, Long senderId) {
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User recipient = userRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new RuntimeException("Recipient not found"));

        if (!canUsersMessage(sender, recipient)) {
            throw new RuntimeException("Users cannot message each other");
        }

        Message.MessageBuilder messageBuilder = Message.builder()
                .sender(sender)
                .recipient(recipient)
                .subject("Direct Message") // Default subject
                .content(request.getContent())
                .createdAt(LocalDateTime.now())
                .isRead(false)
                .messageType(Message.MessageType.DIRECT)
                .attachmentUrl(request.getAttachmentUrl())
                .attachmentFilename(request.getAttachmentFilename())
                .attachmentSize(request.getAttachmentSize())
                .attachmentContentType(request.getAttachmentContentType());

        // Handle reply functionality
        if (request.getReplyToMessageId() != null) {
            Optional<Message> replyToMessage = messageRepository.findById(request.getReplyToMessageId());
            if (replyToMessage.isPresent()) {
                Message originalMessage = replyToMessage.get();
                messageBuilder
                    .replyToMessage(originalMessage)
                    .replyToContent(originalMessage.getContent())
                    .replyToSenderName(originalMessage.getSender().getName());
            }
        }

        Message message = messageBuilder.build();

        Message savedMessage = messageRepository.save(message);
        return convertToMessageResponse(savedMessage);
    }

    public List<ConversationResponse> getConversations(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Only ACTIVE users can access conversations
        if (user.getStatus() != UserStatus.ACTIVE) {
            return new ArrayList<>();
        }

        List<Message> messages = messageRepository.findAllMessagesForUser(user);
        
        // Group by conversation partner and get the latest message for each
        List<ConversationResponse> conversations = new ArrayList<>();
        
        for (Message message : messages) {
            User partner = message.getSender().getId().equals(userId) ? 
                    message.getRecipient() : message.getSender();
            
            // Skip if already have conversation with this partner
            if (conversations.stream().anyMatch(c -> c.getUserId().equals(partner.getId()))) {
                continue;
            }
            
            // Get unread count from this specific partner to the current user
            long unreadCount = messageRepository.countUnreadMessagesFromSender(partner, user);
            
            // Use display names for privacy protection
            String displayName = (partner.getStatus() == UserStatus.ACTIVE) ? 
                    partner.getName() : "disabled user";
            String displayEmail = (partner.getStatus() == UserStatus.ACTIVE) ? 
                    partner.getEmail() : "disabled@user.com";

            ConversationResponse conversation = new ConversationResponse(
                    partner.getId(),
                    displayName,
                    displayEmail,
                    partner.getRole().toString(),
                    message.getContent(),
                    message.getCreatedAt(),
                    (int) unreadCount
            );

            conversations.add(conversation);
        }

        return conversations;
    }    public List<MessageResponse> getConversation(Long userId, Long otherUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new RuntimeException("Other user not found"));

        if (!canUsersMessage(user, otherUser)) {
            throw new RuntimeException("Users cannot message each other");
        }

        List<Message> messages = messageRepository.findConversationBetweenUsers(user, otherUser);
        
        // Mark messages as read
        List<Message> unreadMessages = messages.stream()
                .filter(m -> m.getRecipient().getId().equals(userId) && !m.getIsRead())
                .collect(Collectors.toList());
        
        for (Message message : unreadMessages) {
            message.setIsRead(true);
        }
        
        if (!unreadMessages.isEmpty()) {
            messageRepository.saveAll(unreadMessages);
        }

        return messages.stream()
                .map(this::convertToMessageResponse)
                .collect(Collectors.toList());
    }

    // Overloaded method for pagination (even though we don't implement pagination yet)
    public List<MessageResponse> getConversation(Long userId, Long otherUserId, int page, int size) {
        // For now, just call the non-paginated version
        return getConversation(userId, otherUserId);
    }

    /**
     * Get conversation without marking messages as read (for quiet polling)
     */
    public List<MessageResponse> getConversationQuiet(Long userId, Long otherUserId, int page, int size) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User otherUser = userRepository.findById(otherUserId)
                .orElseThrow(() -> new RuntimeException("Other user not found"));

        if (!canUsersMessage(user, otherUser)) {
            throw new RuntimeException("Users cannot message each other");
        }

        List<Message> messages = messageRepository.findConversationBetweenUsers(user, otherUser);
        
        // DON'T mark messages as read - this is for quiet polling
        
        return messages.stream()
                .map(this::convertToMessageResponse)
                .collect(Collectors.toList());
    }

    public void markAsRead(Long messageId, Long userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        
        // Only the recipient can mark a message as read
        if (!message.getRecipient().getId().equals(userId)) {
            throw new RuntimeException("User not authorized to mark this message as read");
        }
        
        message.setIsRead(true);
        message.setReadAt(LocalDateTime.now());
        messageRepository.save(message);
    }

    @Transactional
    public void markConversationAsRead(Long userId, Long senderId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        
        // Mark all unread messages from the sender to the user as read
        List<Message> unreadMessages = messageRepository.findBySenderAndRecipientAndIsReadFalse(sender, user);
        
        LocalDateTime now = LocalDateTime.now();
        for (Message message : unreadMessages) {
            message.setIsRead(true);
            message.setReadAt(now);
        }
        
        if (!unreadMessages.isEmpty()) {
            messageRepository.saveAll(unreadMessages);
        }
    }

    @Transactional
    public void markAllMessagesAsSeen(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        // Mark all unread messages for this user as read
        List<Message> unreadMessages = messageRepository.findByRecipientAndIsReadFalse(user);
        
        LocalDateTime now = LocalDateTime.now();
        for (Message message : unreadMessages) {
            message.setIsRead(true);
            message.setReadAt(now);
        }
        
        if (!unreadMessages.isEmpty()) {
            messageRepository.saveAll(unreadMessages);
        }
    }

    public Long getUnreadCount(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return messageRepository.countUnreadMessagesForUser(user);
    }

    /**
     * Get available users that current user can message - SIMPLIFIED VERSION
     * Returns all ACTIVE users except the current user
     */
    public List<User> getAvailableUsers(Long userId) {
        log.info("Getting available users for user ID: {}", userId);
        
        User currentUser = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        log.info("Current user: {} with role: {} and status: {}", 
            currentUser.getName(), currentUser.getRole(), currentUser.getStatus());

        // Only ACTIVE users can use messaging
        if (currentUser.getStatus() != UserStatus.ACTIVE) {
            log.warn("User {} is not ACTIVE, cannot access messaging", currentUser.getName());
            return new ArrayList<>();
        }

        // Get all ACTIVE users except the current user
        List<User> availableUsers = userRepository.findByStatusAndIdNot(UserStatus.ACTIVE, userId);
        
        log.info("Found {} available users", availableUsers.size());
        for (User user : availableUsers) {
            log.info("Available user: {} ({}) - Status: {}", user.getName(), user.getRole(), user.getStatus());
        }
        
        return availableUsers;
    }

    /**
     * Check if two users can message each other - SIMPLIFIED VERSION
     * All ACTIVE users can message each other
     */
    private boolean canUsersMessage(User user1, User user2) {
        // Both users must be ACTIVE to message each other
        return user1.getStatus() == UserStatus.ACTIVE && user2.getStatus() == UserStatus.ACTIVE;
    }

    private MessageResponse convertToMessageResponse(Message message) {
        // Use display names for privacy protection
        String senderName = (message.getSender().getStatus() == UserStatus.ACTIVE || 
                           message.getSender().getStatus() == UserStatus.PENDING) ? 
                message.getSender().getName() : "disabled user";
        String senderEmail = (message.getSender().getStatus() == UserStatus.ACTIVE ||
                            message.getSender().getStatus() == UserStatus.PENDING) ? 
                message.getSender().getEmail() : "disabled@user.com";
        
        String recipientName = (message.getRecipient().getStatus() == UserStatus.ACTIVE ||
                              message.getRecipient().getStatus() == UserStatus.PENDING) ? 
                message.getRecipient().getName() : "disabled user";
        String recipientEmail = (message.getRecipient().getStatus() == UserStatus.ACTIVE ||
                               message.getRecipient().getStatus() == UserStatus.PENDING) ? 
                message.getRecipient().getEmail() : "disabled@user.com";

        // Set attachment fields if present
        MessageResponse response = new MessageResponse(
                message.getId(),
                message.getSender().getId(),
                senderName,
                senderEmail,
                message.getRecipient().getId(),
                recipientName,
                recipientEmail,
                message.getContent(),
                message.getIsRead(),
                message.getCreatedAt()
        );
        
        response.setAttachmentUrl(message.getAttachmentUrl());
        response.setAttachmentFilename(message.getAttachmentFilename());
        response.setAttachmentSize(message.getAttachmentSize());
        response.setAttachmentContentType(message.getAttachmentContentType());
        
        // Set reply fields if present
        if (message.getReplyToMessage() != null) {
            response.setReplyToMessageId(message.getReplyToMessage().getId());
            response.setReplyToContent(message.getReplyToContent());
            response.setReplyToSenderName(message.getReplyToSenderName());
        }
        
        return response;
    }

    @Transactional
    public void deleteMessage(Long messageId, Long userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        
        // Only allow sender or recipient to delete the message
        if (!message.getSender().getId().equals(userId) && 
            !message.getRecipient().getId().equals(userId)) {
            throw new RuntimeException("You don't have permission to delete this message");
        }
        
        messageRepository.delete(message);
        log.info("Message {} deleted by user {}", messageId, userId);
    }

    @Transactional
    public void deleteMultipleMessages(List<Long> messageIds, Long userId) {
        List<Message> messages = messageRepository.findAllById(messageIds);
        
        for (Message message : messages) {
            // Only allow sender or recipient to delete the message
            if (!message.getSender().getId().equals(userId) && 
                !message.getRecipient().getId().equals(userId)) {
                throw new RuntimeException("You don't have permission to delete message " + message.getId());
            }
        }
        
        messageRepository.deleteAll(messages);
        log.info("Deleted {} messages for user {}", messageIds.size(), userId);
    }

    @Transactional
    public Map<String, Object> addReaction(Long messageId, Long userId, String emoji) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new RuntimeException("Message not found"));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Check if reaction already exists
        Optional<MessageReaction> existingReaction = messageReactionRepository
                .findByMessageIdAndUserIdAndEmoji(messageId, userId, emoji);
        
        if (existingReaction.isPresent()) {
            // Remove existing reaction if it exists (toggle behavior)
            messageReactionRepository.delete(existingReaction.get());
        } else {
            // Add new reaction
            MessageReaction reaction = MessageReaction.builder()
                    .message(message)
                    .user(user)
                    .emoji(emoji)
                    .build();
            messageReactionRepository.save(reaction);
        }

        return getMessageReactions(messageId);
    }

    @Transactional
    public Map<String, Object> removeReaction(Long messageId, Long userId, String emoji) {
        messageReactionRepository.deleteByMessageIdAndUserIdAndEmoji(messageId, userId, emoji);
        return getMessageReactions(messageId);
    }

    public Map<String, Object> getMessageReactions(Long messageId) {
        List<MessageReaction> reactions = messageReactionRepository.findByMessageId(messageId);
        Map<String, Object> result = new HashMap<>();
        
        // Group reactions by emoji
        Map<String, List<MessageReaction>> groupedReactions = reactions.stream()
                .collect(Collectors.groupingBy(MessageReaction::getEmoji));
        
        for (Map.Entry<String, List<MessageReaction>> entry : groupedReactions.entrySet()) {
            String emoji = entry.getKey();
            List<MessageReaction> emojiReactions = entry.getValue();
            
            Map<String, Object> emojiData = new HashMap<>();
            emojiData.put("count", emojiReactions.size());
            emojiData.put("users", emojiReactions.stream()
                    .map(r -> r.getUser().getName())
                    .collect(Collectors.toList()));
            
            result.put(emoji, emojiData);
        }
        
        return result;
    }

    public Map<Long, List<Map<String, Object>>> getBulkMessageReactions(List<Long> messageIds) {
        Map<Long, List<Map<String, Object>>> result = new HashMap<>();
        
        for (Long messageId : messageIds) {
            List<MessageReaction> reactions = messageReactionRepository.findByMessageId(messageId);
            List<Map<String, Object>> messageReactions = new ArrayList<>();
            
            // Group reactions by emoji for this message
            Map<String, List<MessageReaction>> groupedReactions = reactions.stream()
                    .collect(Collectors.groupingBy(MessageReaction::getEmoji));
            
            for (Map.Entry<String, List<MessageReaction>> entry : groupedReactions.entrySet()) {
                String emoji = entry.getKey();
                List<MessageReaction> emojiReactions = entry.getValue();
                
                Map<String, Object> reactionData = new HashMap<>();
                reactionData.put("emoji", emoji);
                reactionData.put("count", emojiReactions.size());
                reactionData.put("users", emojiReactions.stream()
                        .map(r -> r.getUser().getName())
                        .collect(Collectors.toList()));
                
                messageReactions.add(reactionData);
            }
            
            result.put(messageId, messageReactions);
        }
        
        return result;
    }
}
