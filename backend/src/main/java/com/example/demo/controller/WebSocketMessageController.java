package com.example.demo.controller;

import com.example.demo.dto.MessageCreateRequest;
import com.example.demo.dto.MessageResponse;
import com.example.demo.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.Map;

/**
 * WebSocket STOMP controller for real-time messaging.
 * Clients send to /app/chat.* and receive broadcasts on /topic/messages/* or /user/queue/*
 */
@Controller
public class WebSocketMessageController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private MessageService messageService;

    /**
     * Handle a new chat message sent via WebSocket.
     * Client sends to: /app/chat.send
     * Broadcasts to:   /topic/messages/{senderId}-{recipientId} AND /topic/messages/{recipientId}-{senderId}
     *                  /topic/unread/{recipientId}
     */
    @MessageMapping("/chat.send")
    public void sendMessage(@Payload Map<String, Object> payload,
                            SimpMessageHeaderAccessor headerAccessor) {
        try {
            Long senderId = payload.get("senderId") != null
                    ? Long.valueOf(payload.get("senderId").toString()) : null;
            Long recipientId = payload.get("recipientId") != null
                    ? Long.valueOf(payload.get("recipientId").toString()) : null;
            String content = (String) payload.get("content");
            Long replyToMessageId = payload.get("replyToMessageId") != null
                    ? Long.valueOf(payload.get("replyToMessageId").toString()) : null;

            if (senderId == null || recipientId == null || content == null) {
                return;
            }

            MessageCreateRequest request = new MessageCreateRequest();
            request.setRecipientId(recipientId);
            request.setContent(content);
            request.setReplyToMessageId(replyToMessageId);

            MessageResponse message = messageService.sendMessage(request, senderId);

            // Broadcast the new message to both sides of the conversation
            String topicSent = "/topic/messages/" + senderId + "-" + recipientId;
            String topicReceived = "/topic/messages/" + recipientId + "-" + senderId;

            messagingTemplate.convertAndSend(topicSent, message);
            messagingTemplate.convertAndSend(topicReceived, message);

            // Notify recipient that they have a new unread message
            long unreadCount = messageService.getUnreadCount(recipientId);
            messagingTemplate.convertAndSend("/topic/unread/" + recipientId, unreadCount);

        } catch (Exception e) {
            System.err.println("WebSocket sendMessage error: " + e.getMessage());
        }
    }

    /**
     * Handle a reaction via WebSocket.
     * Client sends to: /app/chat.react
     * Broadcasts to:   /topic/reactions/{senderId}-{recipientId} (both directions)
     */
    @MessageMapping("/chat.react")
    public void handleReaction(@Payload Map<String, Object> payload) {
        try {
            Long messageId = payload.get("messageId") != null
                    ? Long.valueOf(payload.get("messageId").toString()) : null;
            Long userId = payload.get("userId") != null
                    ? Long.valueOf(payload.get("userId").toString()) : null;
            Long otherUserId = payload.get("otherUserId") != null
                    ? Long.valueOf(payload.get("otherUserId").toString()) : null;
            String emoji = (String) payload.get("emoji");
            Boolean remove = payload.get("remove") != null && Boolean.parseBoolean(payload.get("remove").toString());

            if (messageId == null || userId == null || emoji == null) {
                return;
            }

            Map<String, Object> reactions;
            if (Boolean.TRUE.equals(remove)) {
                reactions = messageService.removeReaction(messageId, userId, emoji);
            } else {
                reactions = messageService.addReaction(messageId, userId, emoji);
            }

            // Create a reaction update payload
            Map<String, Object> reactionUpdate = Map.of(
                "messageId", messageId,
                "reactions", reactions
            );

            // Broadcast to both conversation participants
            if (otherUserId != null) {
                String topic1 = "/topic/reactions/" + userId + "-" + otherUserId;
                String topic2 = "/topic/reactions/" + otherUserId + "-" + userId;
                messagingTemplate.convertAndSend(topic1, reactionUpdate);
                messagingTemplate.convertAndSend(topic2, reactionUpdate);
            }

        } catch (Exception e) {
            System.err.println("WebSocket handleReaction error: " + e.getMessage());
        }
    }
}
