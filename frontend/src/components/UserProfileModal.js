import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';
import { auth } from '../utils/auth';
import CommonProfileSection from './profile/CommonProfileSection';
import TeacherProfileSection from './profile/TeacherProfileSection';
import StudentProfileSection from './profile/StudentProfileSection';
import AdminProfileSection from './profile/AdminProfileSection';
import './UserProfileModal.css';

const UserProfileModal = ({ userId, isOpen, onClose }) => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [imageError, setImageError] = useState(false);

    const currentUser = auth.getCurrentUser();
    const isAdmin = currentUser?.role === 'ADMIN';
    const isOwnProfile = currentUser?.id === userId;
    
    // Permission logic:
    // - Users can only edit their own personal info (never teaching/administrative)
    // - Admins can edit administrative/teaching info of other users, but not personal info
    // - Admins can edit everything on their own profile
    const canEditPersonal = isOwnProfile; // Only own profile for personal info
    const canEditAdministrative = isAdmin; // Only admins can edit teaching/administrative info

    useEffect(() => {
        if (isOpen && userId) {
            fetchProfile();
        } else {
            resetModal();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, userId]);

    const resetModal = () => {
        setProfile(null);
        setLoading(true);
        setEditing(false);
        setMessage('');
        setMessageType('');
        setSelectedFile(null);
        setFilePreview(null);
        setImageError(false);
    };

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`/profile/${userId}`);
            setProfile(response.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
            showMessage('Failed to load profile', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (text, type = 'info') => {
        setMessage(text);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 4000);
    };

    const handleSaveProfile = async (updatedData) => {
        try {
            console.log('UserProfileModal - handleSaveProfile called with:', updatedData);
            const response = await axios.put(`/profile/${userId}?currentUserId=${currentUser.id}`, updatedData);
            console.log('UserProfileModal - Profile update response:', response.data);
            console.log('UserProfileModal - Updated profile retakeCount:', response.data.retakeCount);
            setProfile(response.data);
            setEditing(false);
            showMessage('Profile updated successfully!', 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            const errorMsg = error.response?.data?.message || 'Failed to update profile';
            showMessage(errorMsg, 'error');
        }
    };

    const handlePhotoUpload = async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await axios.post(`/profile/${userId}/photo?currentUserId=${currentUser.id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            console.log('Photo upload response:', response.data);
            setProfile(prev => ({ ...prev, profilePhotoUrl: response.data }));
            setSelectedFile(null);
            setFilePreview(null);
            showMessage('Profile photo updated successfully!', 'success');
        } catch (error) {
            console.error('Error uploading photo:', error);
            showMessage('Failed to upload photo', 'error');
        }
    };

    const handlePhotoDelete = async () => {
        try {
            await axios.delete(`/profile/${userId}/photo?currentUserId=${currentUser.id}`);
            setProfile(prev => ({ ...prev, profilePhotoUrl: null }));
            showMessage('Profile photo deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting photo:', error);
            showMessage('Failed to delete photo', 'error');
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                showMessage('File size must be less than 5MB', 'error');
                return;
            }
            
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onload = (e) => setFilePreview(e.target.result);
            reader.readAsDataURL(file);
        }
    };

    const getProfilePhotoUrl = () => {
        if (filePreview) return filePreview;
        if (profile?.profilePhotoUrl) {
            console.log('Original profile photo URL:', profile.profilePhotoUrl);
            
            // Handle full URLs (starting with http/https)
            if (profile.profilePhotoUrl.startsWith('http')) {
                const finalUrl = `${profile.profilePhotoUrl}?t=${Date.now()}`;
                console.log('Full URL constructed:', finalUrl);
                return finalUrl;
            }
            // Handle relative URLs starting with /api/
            if (profile.profilePhotoUrl.startsWith('/api/')) {
                const baseURL = 'http://localhost:8081';
                const finalUrl = `${baseURL}${profile.profilePhotoUrl}?t=${Date.now()}`;
                console.log('API URL constructed:', finalUrl);
                return finalUrl;
            }
            // Handle other relative URLs (likely from file upload service)
            const baseURL = 'http://localhost:8081';
            const finalUrl = `${baseURL}${profile.profilePhotoUrl}?t=${Date.now()}`;
            console.log('Relative URL constructed:', finalUrl);
            return finalUrl;
        }
        console.log('No profile photo URL found');
        return null;
    };

    const handleClose = () => {
        setEditing(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay user-profile-modal-overlay">
            <div className="modal user-profile-modal">
                <div className="modal-header">
                    <h2>User Profile</h2>
                    <button className="modal-close" onClick={handleClose}>
                        ×
                    </button>
                </div>

                <div className="modal-body">
                    {loading ? (
                        <div className="profile-loading">
                            <div className="spinner"></div>
                            <p>Loading profile...</p>
                        </div>
                    ) : profile ? (
                        <>
                            {/* Profile Header */}
                            <div className="profile-header">
                                <div className="profile-photo-section">
                                    <div className="profile-photo-container">
                                        {getProfilePhotoUrl() && !imageError ? (
                                            <img 
                                                src={getProfilePhotoUrl()} 
                                                alt="Profile" 
                                                className="profile-photo"
                                                onError={() => setImageError(true)}
                                            />
                                        ) : (
                                            <div className="profile-photo-placeholder">
                                                <span className="photo-initials">
                                                    {profile.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </span>
                                            </div>
                                        )}
                                        
                                        {editing && canEditPersonal && (
                                            <div className="photo-upload-controls">
                                                <input
                                                    type="file"
                                                    id="photo-upload"
                                                    accept="image/*"
                                                    onChange={handleFileSelect}
                                                    style={{ display: 'none' }}
                                                />
                                                <label htmlFor="photo-upload" className="photo-btn upload">
                                                    📷 Change Photo
                                                </label>
                                                {selectedFile && (
                                                    <button onClick={handlePhotoUpload} className="photo-btn save">
                                                        💾 Save Photo
                                                    </button>
                                                )}
                                                {profile.profilePhotoUrl && (
                                                    <button onClick={handlePhotoDelete} className="photo-btn delete">
                                                        🗑️ Delete Photo
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="profile-basic-info">
                                    <h1 className="profile-name">{profile.name}</h1>
                                    <div className="profile-meta">
                                        <span className={`role-badge ${profile.role?.toLowerCase()}`}>
                                            {profile.role}
                                        </span>
                                        <span className="profile-email">{profile.email}</span>
                                        <span className={`status-badge ${profile.status?.toLowerCase()}`}>
                                            {profile.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="profile-actions">
                                    {(canEditPersonal || canEditAdministrative) && (
                                        <button
                                            className={`btn ${editing ? 'btn-cancel' : 'btn-primary'}`}
                                            onClick={() => setEditing(!editing)}
                                        >
                                            {editing ? 'Cancel' : 'Edit Profile'}
                                        </button>
                                    )}
                                </div>
                            </div>

                            {message && (
                                <div className={`profile-message ${messageType}`}>
                                    <span className="message-icon">
                                        {messageType === 'success' && '✓'}
                                        {messageType === 'error' && '⚠'}
                                        {messageType === 'info' && 'ℹ'}
                                    </span>
                                    <span className="message-text">{message}</span>
                                </div>
                            )}

                            {editing && !isAdmin && !isOwnProfile && (
                                <div className="profile-message info">
                                    <span className="message-icon">⚠</span>
                                    <span className="message-text">
                                        You can only view this profile. Only admins can edit other users' information.
                                    </span>
                                </div>
                            )}

                            <div className="profile-content">
                                {/* Common fields for all users */}
                                <CommonProfileSection
                                    profile={profile}
                                    editing={editing}
                                    canEdit={canEditPersonal}
                                    onSave={handleSaveProfile}
                                />

                                {/* Role-specific sections */}
                                {profile.role === 'TEACHER' && (
                                    <TeacherProfileSection
                                        profile={profile}
                                        editing={editing}
                                        canEdit={canEditAdministrative}
                                        onSave={handleSaveProfile}
                                    />
                                )}

                                {profile.role === 'STUDENT' && (
                                    <StudentProfileSection
                                        profile={profile}
                                        editing={editing}
                                        canEdit={canEditAdministrative}
                                        isAdmin={isAdmin}
                                        onSave={handleSaveProfile}
                                    />
                                )}

                                {profile.role === 'ADMIN' && (
                                    <AdminProfileSection
                                        profile={profile}
                                        editing={editing}
                                        canEdit={canEditAdministrative}
                                        onSave={handleSaveProfile}
                                    />
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="profile-error">
                            <p>Failed to load profile information.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserProfileModal;
