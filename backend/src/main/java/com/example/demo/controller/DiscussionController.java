package com.example.demo.controller;

import com.example.demo.model.*;
import com.example.demo.service.DiscussionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/discussions")
@RequiredArgsConstructor
@Slf4j
public class DiscussionController {

    private final DiscussionService discussionService;

    /**
     * Create a new discussion thread (Teachers only)
     * POST /api/discussions/threads
     */
    @PostMapping("/threads")
    public ResponseEntity<?> createThread(
            @RequestBody DiscussionThreadCreateRequest request,
            @RequestParam Long teacherId) {
        try {
            log.info("Creating discussion thread request: {}", request.getTitle());
            DiscussionThreadResponse thread = discussionService.createThread(request, teacherId);
            return ResponseEntity.ok(thread);
        } catch (RuntimeException e) {
            log.error("Error creating discussion thread: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get all discussion threads for a course
     * GET /api/discussions/course/{courseId}/threads
     */
    @GetMapping("/course/{courseId}/threads")
    public ResponseEntity<?> getThreadsForCourse(
            @PathVariable Long courseId,
            @RequestParam Long userId) {
        try {
            List<DiscussionThreadResponse> threads = discussionService.getThreadsForCourse(courseId, userId);
            return ResponseEntity.ok(threads);
        } catch (RuntimeException e) {
            log.error("Error fetching discussion threads for course: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get a specific discussion thread with all posts
     * GET /api/discussions/threads/{threadId}
     */
    @GetMapping("/threads/{threadId}")
    public ResponseEntity<?> getThreadDetails(
            @PathVariable Long threadId,
            @RequestParam Long userId) {
        try {
            DiscussionThreadResponse thread = discussionService.getThreadDetails(threadId, userId);
            return ResponseEntity.ok(thread);
        } catch (RuntimeException e) {
            log.error("Error fetching discussion thread details: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Create a new post in a discussion thread
     * POST /api/discussions/posts
     */
    @PostMapping("/posts")
    public ResponseEntity<?> createPost(
            @RequestBody DiscussionPostCreateRequest request,
            @RequestParam Long authorId) {
        try {
            log.info("Creating discussion post request in thread: {}", request.getThreadId());
            DiscussionPostResponse post = discussionService.createPost(request, authorId);
            return ResponseEntity.ok(post);
        } catch (RuntimeException e) {
            log.error("Error creating discussion post: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * React to a post (like/unlike/helpful/confused)
     * POST /api/discussions/posts/{postId}/react
     */
    @PostMapping("/posts/{postId}/react")
    public ResponseEntity<?> toggleReaction(
            @PathVariable Long postId,
            @RequestParam String reactionType,
            @RequestParam Long userId) {
        try {
            PostReaction.ReactionType type = PostReaction.ReactionType.valueOf(reactionType.toUpperCase());
            Map<String, Object> response = discussionService.toggleReaction(postId, type, userId);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid reaction type"));
        } catch (RuntimeException e) {
            log.error("Error toggling reaction: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Search discussion threads in a course
     * GET /api/discussions/course/{courseId}/search
     */
    @GetMapping("/course/{courseId}/search")
    public ResponseEntity<?> searchThreads(
            @PathVariable Long courseId,
            @RequestParam String q,
            @RequestParam Long userId) {
        try {
            List<DiscussionThreadResponse> threads = discussionService.searchThreads(courseId, q, userId);
            return ResponseEntity.ok(threads);
        } catch (RuntimeException e) {
            log.error("Error searching discussion threads: {}", e.getMessage());
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
