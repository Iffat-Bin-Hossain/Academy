package com.example.demo.controller;

import com.example.demo.dto.UserProfileResponse;
import com.example.demo.dto.UserProfileUpdateRequest;
import com.example.demo.service.UserProfileService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/profile")
@CrossOrigin(origins = "http://localhost:3000")
public class UserProfileController {

    @Autowired
    private UserProfileService userProfileService;

    @GetMapping("/{userId}")
    public ResponseEntity<UserProfileResponse> getUserProfile(@PathVariable Long userId) {
        try {
            UserProfileResponse profile = userProfileService.getUserProfile(userId);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getMyProfile(@RequestParam Long currentUserId) {
        try {
            UserProfileResponse profile = userProfileService.getUserProfile(currentUserId);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{userId}")
    public ResponseEntity<UserProfileResponse> updateUserProfile(
            @PathVariable Long userId,
            @RequestParam Long currentUserId,
            @RequestBody UserProfileUpdateRequest request) {
        try {
            UserProfileResponse profile = userProfileService.updateUserProfile(userId, currentUserId, request);
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/{userId}/photo")
    public ResponseEntity<String> uploadProfilePhoto(
            @PathVariable Long userId,
            @RequestParam Long currentUserId,
            @RequestParam("file") MultipartFile file) {
        try {
            String photoUrl = userProfileService.uploadProfilePhoto(userId, currentUserId, file);
            return ResponseEntity.ok(photoUrl);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Failed to upload photo");
        }
    }

    @DeleteMapping("/{userId}/photo")
    public ResponseEntity<Void> deleteProfilePhoto(
            @PathVariable Long userId,
            @RequestParam Long currentUserId) {
        try {
            userProfileService.deleteProfilePhoto(userId, currentUserId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
