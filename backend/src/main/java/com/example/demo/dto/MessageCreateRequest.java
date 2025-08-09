package com.example.demo.dto;

public class MessageCreateRequest {
    private Long recipientId;
    private String content;
    
    // Constructors
    public MessageCreateRequest() {}
    
    public MessageCreateRequest(Long recipientId, String content) {
        this.recipientId = recipientId;
        this.content = content;
    }
    
    // Getters and setters
    public Long getRecipientId() {
        return recipientId;
    }
    
    public void setRecipientId(Long recipientId) {
        this.recipientId = recipientId;
    }
    
    public String getContent() {
        return content;
    }
    
    public void setContent(String content) {
        this.content = content;
    }
}
