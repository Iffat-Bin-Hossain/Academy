package com.example.demo.service;

import com.example.demo.dto.UserProfileResponse;
import com.example.demo.dto.UserProfileUpdateRequest;
import com.example.demo.model.Role;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Service
@Slf4j
public class UserProfileService {

    @Autowired
    private UserRepository userRepository;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    @Value("${app.profile.photos.dir:./uploads/profiles}")
    private String profilePhotoDir;

    public UserProfileResponse getUserProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        return convertToProfileResponse(user);
    }

    public UserProfileResponse updateUserProfile(Long userId, Long currentUserId, UserProfileUpdateRequest request) {
        log.info("Updating profile for userId: {} by currentUserId: {} with data: {}", userId, currentUserId, request);
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        // Check permissions
        if (!canEditProfile(user, currentUser)) {
            throw new RuntimeException("Not authorized to edit this profile");
        }

        log.info("User role: {}, Current user role: {}", user.getRole(), currentUser.getRole());

        // Update common fields (all users can edit these on their own profile)
        if (userId.equals(currentUserId) || currentUser.getRole() == Role.ADMIN) {
            updateCommonFields(user, request);
        }

        // Update role-specific fields
        if (user.getRole() == Role.TEACHER && (userId.equals(currentUserId) || currentUser.getRole() == Role.ADMIN)) {
            log.info("Updating teacher fields for user: {}", userId);
            updateTeacherFields(user, request);
        }

        if (user.getRole() == Role.STUDENT && (userId.equals(currentUserId) || currentUser.getRole() == Role.ADMIN)) {
            log.info("Updating student fields for user: {}", userId);
            updateStudentFields(user, request, currentUser.getRole() == Role.ADMIN);
        }

        if (user.getRole() == Role.ADMIN && (userId.equals(currentUserId) || currentUser.getRole() == Role.ADMIN)) {
            updateAdminFields(user, request);
        }

        User savedUser = userRepository.save(user);
        log.info("Profile updated successfully for userId: {}", userId);
        return convertToProfileResponse(savedUser);
    }

    public String uploadProfilePhoto(Long userId, Long currentUserId, MultipartFile file) throws IOException {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        if (!canEditProfile(user, currentUser)) {
            throw new RuntimeException("Not authorized to update this profile photo");
        }

        // Validate file type
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new RuntimeException("Invalid file type. Please upload an image file.");
        }

        // Validate file size (5MB limit for profile photos)
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new RuntimeException("File size too large. Maximum 5MB allowed for profile photos.");
        }

        // Create profile photos directory if it doesn't exist
        Path profilePhotoPath = Paths.get(profilePhotoDir);
        if (!Files.exists(profilePhotoPath)) {
            Files.createDirectories(profilePhotoPath);
        }

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String fileExtension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String uniqueFilename = "profile_" + userId + "_" + UUID.randomUUID().toString() + fileExtension;

        // Delete old profile photo if exists
        if (user.getProfilePhotoUrl() != null) {
            deleteOldProfilePhoto(user.getProfilePhotoUrl());
        }

        // Save new file
        Path filePath = profilePhotoPath.resolve(uniqueFilename);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        // Update user profile photo URL
        String photoUrl = "/api/files/download/profiles/" + uniqueFilename;
        user.setProfilePhotoUrl(photoUrl);
        userRepository.save(user);

        return photoUrl;
    }

    public void deleteProfilePhoto(Long userId, Long currentUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        if (!canEditProfile(user, currentUser)) {
            throw new RuntimeException("Not authorized to delete this profile photo");
        }

        if (user.getProfilePhotoUrl() != null) {
            deleteOldProfilePhoto(user.getProfilePhotoUrl());
            user.setProfilePhotoUrl(null);
            userRepository.save(user);
        }
    }

    private boolean canEditProfile(User targetUser, User currentUser) {
        // Admin can edit any profile
        if (currentUser.getRole() == Role.ADMIN) {
            return true;
        }
        // Users can edit their own profile
        return targetUser.getId().equals(currentUser.getId());
    }

    private void updateCommonFields(User user, UserProfileUpdateRequest request) {
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getAltEmail() != null) user.setAltEmail(request.getAltEmail());
        if (request.getTimezone() != null) user.setTimezone(request.getTimezone());
        if (request.getBio() != null) user.setBio(request.getBio());
        if (request.getProfilePhotoUrl() != null) user.setProfilePhotoUrl(request.getProfilePhotoUrl());
    }

    private void updateTeacherFields(User user, UserProfileUpdateRequest request) {
        if (request.getOfficeRoom() != null) user.setOfficeRoom(request.getOfficeRoom());
        if (request.getResearchInterests() != null) user.setResearchInterests(request.getResearchInterests());
        if (request.getPersonalWebsite() != null) user.setPersonalWebsite(request.getPersonalWebsite());
        if (request.getScholarProfileUrl() != null) user.setScholarProfileUrl(request.getScholarProfileUrl());
    }

    private void updateStudentFields(User user, UserProfileUpdateRequest request, boolean isAdmin) {
        // Students can always edit clubs/activities
        if (request.getClubsActivities() != null) user.setClubsActivities(request.getClubsActivities());
        
        // Only admin can edit academic information
        if (isAdmin) {
            if (request.getProgram() != null) user.setProgram(request.getProgram());
            if (request.getMajor() != null) user.setMajor(request.getMajor());
            if (request.getYearSemester() != null) user.setYearSemester(request.getYearSemester());
            if (request.getAdvisor() != null) user.setAdvisor(request.getAdvisor());
            if (request.getGpa() != null) user.setGpa(request.getGpa());
            if (request.getRetakeCount() != null) user.setRetakeCount(request.getRetakeCount());
        }
    }

    private void updateAdminFields(User user, UserProfileUpdateRequest request) {
        if (request.getDepartment() != null) user.setDepartment(request.getDepartment());
        if (request.getAccessLevel() != null) user.setAccessLevel(request.getAccessLevel());
        if (request.getAdminNotes() != null) user.setAdminNotes(request.getAdminNotes());
    }

    private UserProfileResponse convertToProfileResponse(User user) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        
        return UserProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .username(user.getUsername() != null ? user.getUsername() : user.getName()) // Use name as fallback
                .email(user.getEmail())
                .role(user.getRole().name())
                .status(user.getStatus().name())
                .phone(user.getPhone())
                .altEmail(user.getAltEmail())
                .timezone(user.getTimezone())
                .bio(user.getBio())
                .profilePhotoUrl(user.getProfilePhotoUrl())
                .officeRoom(user.getOfficeRoom())
                .researchInterests(user.getResearchInterests())
                .personalWebsite(user.getPersonalWebsite())
                .scholarProfileUrl(user.getScholarProfileUrl())
                .program(user.getProgram())
                .major(user.getMajor())
                .yearSemester(user.getYearSemester())
                .advisor(user.getAdvisor())
                .clubsActivities(user.getClubsActivities())
                .gpa(user.getGpa())
                .retakeCount(user.getRetakeCount())
                .department(user.getDepartment())
                .accessLevel(user.getAccessLevel())
                .adminNotes(user.getAdminNotes())
                .createdAt(user.getCreatedAt() != null ? user.getCreatedAt().format(formatter) : null)
                .updatedAt(user.getUpdatedAt() != null ? user.getUpdatedAt().format(formatter) : null)
                .build();
    }

    private void deleteOldProfilePhoto(String photoUrl) {
        try {
            // Extract filename from URL
            String filename = photoUrl.substring(photoUrl.lastIndexOf("/") + 1);
            Path oldPhotoPath = Paths.get(profilePhotoDir, filename);
            Files.deleteIfExists(oldPhotoPath);
        } catch (Exception e) {
            log.warn("Failed to delete old profile photo: {}", photoUrl, e);
        }
    }
}
