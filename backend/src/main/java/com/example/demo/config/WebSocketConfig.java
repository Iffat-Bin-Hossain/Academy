package com.example.demo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

/**
 * WebSocket configuration enabling STOMP messaging via SockJS.
 * Clients connect to /ws and subscribe to /topic/* or /queue/* destinations.
 */
@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple in-memory message broker for /topic and /queue
        config.enableSimpleBroker("/topic", "/queue");
        // Application messages are sent to /app prefix
        config.setApplicationDestinationPrefixes("/app");
        // User-specific destinations use /user prefix
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // WebSocket endpoint at /ws, with SockJS fallback for browsers that don't support WS
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(
                    "http://localhost:3000",
                    "http://localhost:3001",
                    "http://localhost:8081"
                )
                .withSockJS();
    }
}
