package com.example.demo.model;

import lombok.Data;
import lombok.Builder;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConversationResponse {
    private Long partnerId;
    private String partnerName;
    private String partnerRole;
    private String lastMessageContent;
    private LocalDateTime lastMessageTime;
    private Long unreadCount;
    private Boolean isLastMessageFromMe;
}
