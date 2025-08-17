package com.example.demo.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

import java.util.concurrent.CompletableFuture;

@Service
public class GeminiAIService {

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper;
    
    @Value("${gemini.api.key:}")
    private String apiKey;
    
    private static final String GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

    public GeminiAIService() {
        this.restTemplate = new RestTemplate();
        this.objectMapper = new ObjectMapper();
    }

    public CompletableFuture<String> generateResponse(String userMessage, String courseContext) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return CompletableFuture.completedFuture(generateFallbackResponse(userMessage));
        }

        return CompletableFuture.supplyAsync(() -> {
            try {
                System.out.println("=== GEMINI AI DEBUG ===");
                System.out.println("API Key configured: " + (apiKey != null && !apiKey.trim().isEmpty()));
                System.out.println("User message: " + userMessage);
                System.out.println("Course context: " + courseContext);
                
                // Create the request payload for Gemini API
                ObjectNode requestBody = objectMapper.createObjectNode();
                ArrayNode contents = objectMapper.createArrayNode();
                ObjectNode content = objectMapper.createObjectNode();
                ArrayNode parts = objectMapper.createArrayNode();
                ObjectNode part = objectMapper.createObjectNode();
                
                // Enhanced prompt with course context
                String enhancedPrompt = createEnhancedPrompt(userMessage, courseContext);
                System.out.println("Enhanced prompt: " + enhancedPrompt);
                
                part.put("text", enhancedPrompt);
                parts.add(part);
                content.set("parts", parts);
                contents.add(content);
                requestBody.set("contents", contents);

                // Add generation config for better responses
                ObjectNode generationConfig = objectMapper.createObjectNode();
                generationConfig.put("temperature", 0.7);
                generationConfig.put("topK", 40);
                generationConfig.put("topP", 0.95);
                generationConfig.put("maxOutputTokens", 1024);
                requestBody.set("generationConfig", generationConfig);

                // Set up headers with correct API key header format
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                headers.set("X-goog-api-key", apiKey);
                
                HttpEntity<ObjectNode> requestEntity = new HttpEntity<>(requestBody, headers);
                
                // Make the API call (no query parameter needed, API key is in header)
                String url = GEMINI_API_URL;
                System.out.println("Making API call to: " + GEMINI_API_URL);
                
                ResponseEntity<String> response = restTemplate.exchange(
                    url, 
                    HttpMethod.POST, 
                    requestEntity, 
                    String.class
                );
                
                System.out.println("API Response status: " + response.getStatusCode());
                System.out.println("API Response body: " + response.getBody());
                
                String result = extractResponseText(response.getBody());
                System.out.println("Extracted response: " + result);
                System.out.println("=== END GEMINI AI DEBUG ===");
                
                return result;

            } catch (Exception e) {
                System.err.println("=== GEMINI AI ERROR ===");
                System.err.println("Error type: " + e.getClass().getSimpleName());
                System.err.println("Error message: " + e.getMessage());
                e.printStackTrace();
                System.err.println("=== END GEMINI AI ERROR ===");
                
                return generateFallbackResponse(userMessage);
            }
        });
    }

    private String createEnhancedPrompt(String userMessage, String courseContext) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("You are an AI study assistant helping students with their coursework. ");
        
        if (courseContext != null && !courseContext.trim().isEmpty()) {
            prompt.append("The student is currently studying: ").append(courseContext).append(". ");
        }
        
        prompt.append("Please provide helpful, accurate, and educational responses. ");
        prompt.append("If the question is about programming, provide code examples when appropriate. ");
        prompt.append("If it's about theory, explain concepts clearly with examples. ");
        prompt.append("Keep responses concise but comprehensive.\n\n");
        prompt.append("Student Question: ").append(userMessage);
        
        return prompt.toString();
    }

    private String extractResponseText(String apiResponse) {
        try {
            JsonNode jsonResponse = objectMapper.readTree(apiResponse);
            JsonNode candidates = jsonResponse.get("candidates");
            
            if (candidates != null && candidates.isArray() && candidates.size() > 0) {
                JsonNode firstCandidate = candidates.get(0);
                JsonNode content = firstCandidate.get("content");
                
                if (content != null) {
                    JsonNode parts = content.get("parts");
                    if (parts != null && parts.isArray() && parts.size() > 0) {
                        JsonNode firstPart = parts.get(0);
                        JsonNode text = firstPart.get("text");
                        if (text != null) {
                            return text.asText();
                        }
                    }
                }
            }
            
            return "I apologize, but I couldn't generate a proper response. Please try rephrasing your question.";
            
        } catch (Exception e) {
            return "I encountered an error while processing your request. Please try again.";
        }
    }

    private String generateFallbackResponse(String userMessage) {
        String lowerMessage = userMessage.toLowerCase();
        
        if (lowerMessage.contains("hello") || lowerMessage.contains("hi")) {
            return "Hello! I'm your AI study assistant. How can I help you with your coursework today?";
        } else if (lowerMessage.contains("help")) {
            return "I'm here to help! You can ask me about:\n" +
                   "• Programming concepts and code examples\n" +
                   "• Course topics and explanations\n" +
                   "• Study strategies and tips\n" +
                   "• Assignment guidance\n" +
                   "What would you like to know?";
        } else if (lowerMessage.contains("java") || lowerMessage.contains("programming")) {
            return "I can help you with Java programming! Feel free to ask about:\n" +
                   "• Basic syntax and concepts\n" +
                   "• Object-oriented programming\n" +
                   "• Data structures and algorithms\n" +
                   "• Best practices and debugging\n" +
                   "What specific topic would you like to explore?";
        } else if (lowerMessage.contains("assignment") || lowerMessage.contains("homework")) {
            return "I can help guide you through assignments! Please share:\n" +
                   "• What subject or topic is the assignment about?\n" +
                   "• What specific part are you struggling with?\n" +
                   "• Any error messages or issues you're encountering?\n" +
                   "I'll provide guidance while helping you learn!";
        } else {
            return "Thank you for your question! I'm designed to help with academic topics. " +
                   "Could you please provide more context about what you'd like to learn or discuss? " +
                   "I can assist with programming, course concepts, study strategies, and more!";
        }
    }

    public String generateResponseSync(String userMessage, String courseContext) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return generateFallbackResponse(userMessage);
        }

        try {
            System.out.println("=== GEMINI AI SYNC DEBUG ===");
            System.out.println("API Key configured: " + (apiKey != null && !apiKey.trim().isEmpty()));
            System.out.println("User message: " + userMessage);
            System.out.println("Course context: " + courseContext);
            
            // Create the request payload for Gemini API
            ObjectNode requestBody = objectMapper.createObjectNode();
            ArrayNode contents = objectMapper.createArrayNode();
            ObjectNode content = objectMapper.createObjectNode();
            ArrayNode parts = objectMapper.createArrayNode();
            ObjectNode part = objectMapper.createObjectNode();

            String enhancedPrompt = createEnhancedPrompt(userMessage, courseContext);
            System.out.println("Enhanced prompt: " + enhancedPrompt);
            
            part.put("text", enhancedPrompt);
            parts.add(part);
            content.set("parts", parts);
            contents.add(content);
            requestBody.set("contents", contents);

            // Add generation config for better responses
            ObjectNode generationConfig = objectMapper.createObjectNode();
            generationConfig.put("temperature", 0.7);
            generationConfig.put("topK", 40);
            generationConfig.put("topP", 0.95);
            generationConfig.put("maxOutputTokens", 1024);
            requestBody.set("generationConfig", generationConfig);

            // Set up headers with correct API key header format
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-goog-api-key", apiKey);
            
            HttpEntity<ObjectNode> requestEntity = new HttpEntity<>(requestBody, headers);
            
            // Make the API call
            String url = GEMINI_API_URL;
            System.out.println("Making API call to: " + GEMINI_API_URL);
            
            ResponseEntity<String> response = restTemplate.exchange(
                url, 
                HttpMethod.POST, 
                requestEntity, 
                String.class
            );

            System.out.println("API Response Status: " + response.getStatusCode());
            System.out.println("API Response Body: " + response.getBody());

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                JsonNode responseJson = objectMapper.readTree(response.getBody());
                
                if (responseJson.has("candidates") && responseJson.get("candidates").isArray()) {
                    ArrayNode candidates = (ArrayNode) responseJson.get("candidates");
                    if (candidates.size() > 0) {
                        JsonNode candidate = candidates.get(0);
                        if (candidate.has("content") && candidate.get("content").has("parts")) {
                            ArrayNode responseParts = (ArrayNode) candidate.get("content").get("parts");
                            if (responseParts.size() > 0 && responseParts.get(0).has("text")) {
                                String aiResponse = responseParts.get(0).get("text").asText();
                                System.out.println("AI Response extracted: " + aiResponse);
                                return aiResponse;
                            }
                        }
                    }
                }
            }
            
            System.out.println("No valid response found, using fallback");
            return generateFallbackResponse(userMessage);
            
        } catch (Exception e) {
            System.err.println("Error in generateResponseSync: " + e.getMessage());
            e.printStackTrace();
            return generateFallbackResponse(userMessage);
        }
    }

    public boolean isConfigured() {
        return apiKey != null && !apiKey.trim().isEmpty();
    }
}
