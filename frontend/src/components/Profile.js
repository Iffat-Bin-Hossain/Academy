import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../api/axiosInstance';
import { auth } from '../utils/auth';
import CommonProfileSection from './profile/CommonProfileSection';
import TeacherProfileSection from './profile/TeacherProfileSection';
import StudentProfileSection from './profile/StudentProfileSection';
import AdminProfileSection from './profile/AdminProfileSection';
import './Profile.css';

const Profile = () => {
    const { userId: routeUserId } = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);

    const currentUser = auth.getCurrentUser();
    const userId = routeUserId || currentUser?.id;
    const isOwnProfile = !routeUserId || routeUserId === String(currentUser?.id);
    const canEdit = isOwnProfile || currentUser?.role === 'ADMIN';

    useEffect(() => {
        if (userId) {
            fetchProfile();
        }
    }, [userId]);

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
            console.log('Profile - handleSaveProfile called with:', updatedData);
            const response = await axios.put(`/profile/${userId}?currentUserId=${currentUser.id}`, updatedData);
            console.log('Profile - Profile update response:', response.data);
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
            
            setProfile(prev => ({ ...prev, profilePhotoUrl: response.data }));
            setSelectedFile(null);
            setFilePreview(null);
            showMessage('Profile photo updated successfully!', 'success');
        } catch (error) {
            console.error('Error uploading photo:', error);
            showMessage('Failed to upload profile photo', 'error');
        }
    };

    const handlePhotoDelete = async () => {
        try {
            await axios.delete(`/profile/${userId}/photo?currentUserId=${currentUser.id}`);
            setProfile(prev => ({ ...prev, profilePhotoUrl: null }));
            showMessage('Profile photo deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting photo:', error);
            showMessage('Failed to delete profile photo', 'error');
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            showMessage('Please select an image file', 'error');
            return;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            showMessage('File size too large. Maximum 5MB allowed', 'error');
            return;
        }

        setSelectedFile(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e) => setFilePreview(e.target.result);
        reader.readAsDataURL(file);
    };

    if (loading) {
        return (
            <div className="profile-container">
                <div className="profile-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="profile-container">
                <div className="profile-error">
                    <h2>Profile not found</h2>
                    <p>The requested profile could not be found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-header">
                <div className="profile-photo-section">
                    <div className="profile-photo-wrapper">
                        {filePreview ? (
                            <img src={filePreview} alt="Preview" className="profile-photo preview" />
                        ) : profile.profilePhotoUrl ? (
                            <img src={profile.profilePhotoUrl} alt="Profile" className="profile-photo" />
                        ) : (
                            <div className="profile-photo-placeholder">
                                {profile.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                        )}
                        
                        {canEdit && (
                            <div className="profile-photo-actions">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    id="photo-upload"
                                    hidden
                                />
                                <label htmlFor="photo-upload" className="photo-btn upload">
                                    📷 {profile.profilePhotoUrl ? 'Change' : 'Upload'}
                                </label>
                                {selectedFile && (
                                    <>
                                        <button onClick={handlePhotoUpload} className="photo-btn save">
                                            ✓ Save
                                        </button>
                                        <button 
                                            onClick={() => {
                                                setSelectedFile(null);
                                                setFilePreview(null);
                                            }} 
                                            className="photo-btn cancel"
                                        >
                                            ✗ Cancel
                                        </button>
                                    </>
                                )}
                                {profile.profilePhotoUrl && !selectedFile && (
                                    <button onClick={handlePhotoDelete} className="photo-btn delete">
                                        🗑️ Delete
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="profile-basic-info">
                    <h1 className="profile-name">{profile.name}</h1>
                    <div className="profile-meta">
                        <span className={`role-badge ${profile.role.toLowerCase()}`}>
                            {profile.role}
                        </span>
                        <span className="profile-email">{profile.email}</span>
                        <span className="profile-note">Managed by Admin</span>
                    </div>
                </div>

                <div className="profile-actions">
                    {canEdit && (
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
                    <button 
                        className="message-close" 
                        onClick={() => {setMessage(''); setMessageType('');}}
                    >
                        ✕
                    </button>
                </div>
            )}

            <div className="profile-content">
                {/* Common fields for all users */}
                <CommonProfileSection
                    profile={profile}
                    editing={editing}
                    canEdit={canEdit}
                    onSave={handleSaveProfile}
                />

                {/* Role-specific sections */}
                {profile.role === 'TEACHER' && (
                    <TeacherProfileSection
                        profile={profile}
                        editing={editing}
                        canEdit={canEdit}
                        onSave={handleSaveProfile}
                    />
                )}

                {profile.role === 'STUDENT' && (
                    <StudentProfileSection
                        profile={profile}
                        editing={editing}
                        canEdit={canEdit}
                        isAdmin={currentUser?.role === 'ADMIN'}
                        onSave={handleSaveProfile}
                    />
                )}

                {profile.role === 'ADMIN' && (
                    <AdminProfileSection
                        profile={profile}
                        editing={editing}
                        canEdit={canEdit}
                        onSave={handleSaveProfile}
                    />
                )}
            </div>
        </div>
    );
};

export default Profile;
