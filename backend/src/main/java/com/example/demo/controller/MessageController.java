package com.example.demo.controller;

import com.example.demo.dto.MessageCreateRequest;
import com.example.demo.dto.MessageResponse;
import com.example.demo.dto.ConversationResponse;
import com.example.demo.model.User;
import com.example.demo.service.MessageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "http://localhost:3000")
public class MessageController {

    @Autowired
    private MessageService messageService;

    @PostMapping("/send")
    public ResponseEntity<MessageResponse> sendMessage(@RequestBody MessageCreateRequest request,
                                                     @RequestParam Long senderId) {
        try {
            MessageResponse message = messageService.sendMessage(request, senderId);
            return ResponseEntity.ok(message);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/conversations")
    public ResponseEntity<List<ConversationResponse>> getConversations(@RequestParam Long userId) {
        try {
            List<ConversationResponse> conversations = messageService.getConversations(userId);
            return ResponseEntity.ok(conversations);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/conversation/{otherUserId}")
    public ResponseEntity<List<MessageResponse>> getConversation(@PathVariable Long otherUserId,
                                                               @RequestParam Long userId,
                                                               @RequestParam(defaultValue = "0") int page,
                                                               @RequestParam(defaultValue = "20") int size) {
        try {
            List<MessageResponse> messages = messageService.getConversation(userId, otherUserId, page, size);
            return ResponseEntity.ok(messages);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }

    @PostMapping("/mark-read/{messageId}")
    public ResponseEntity<Void> markAsRead(@PathVariable Long messageId,
                                         @RequestParam Long userId) {
        try {
            messageService.markAsRead(messageId, userId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/mark-read")
    public ResponseEntity<Void> markMessagesAsRead(@RequestParam Long userId,
                                                 @RequestParam Long senderId) {
        try {
            messageService.markConversationAsRead(userId, senderId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(@RequestParam Long userId) {
        try {
            Long count = messageService.getUnreadCount(userId);
            return ResponseEntity.ok(count);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(0L);
        }
    }

    @GetMapping("/users/available")
    public ResponseEntity<List<User>> getAvailableUsers(@RequestParam Long userId) {
        try {
            List<User> users = messageService.getAvailableUsers(userId);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(null);
        }
    }
}
