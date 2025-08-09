package com.example.demo.dto;

public class MessageCreateRequest {
    private Long recipientId;
    private String content;
    
    // Attachment fields
    private String attachmentUrl;
    private String attachmentFilename;
    private Long attachmentSize;
    private String attachmentContentType;
    
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

    // Attachment getters and setters
    public String getAttachmentUrl() {
        return attachmentUrl;
    }

    public void setAttachmentUrl(String attachmentUrl) {
        this.attachmentUrl = attachmentUrl;
    }

    public String getAttachmentFilename() {
        return attachmentFilename;
    }

    public void setAttachmentFilename(String attachmentFilename) {
        this.attachmentFilename = attachmentFilename;
    }

    public Long getAttachmentSize() {
        return attachmentSize;
    }

    public void setAttachmentSize(Long attachmentSize) {
        this.attachmentSize = attachmentSize;
    }

    public String getAttachmentContentType() {
        return attachmentContentType;
    }

    public void setAttachmentContentType(String attachmentContentType) {
        this.attachmentContentType = attachmentContentType;
    }
}
