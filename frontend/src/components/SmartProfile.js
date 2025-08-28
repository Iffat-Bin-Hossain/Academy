import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../api/axiosInstance';
import { auth } from '../utils/auth';
import CommonProfileSection from './profile/CommonProfileSection';
import TeacherProfileSection from './profile/TeacherProfileSection';
import StudentProfileSection from './profile/StudentProfileSection';
import AdminProfileSection from './profile/AdminProfileSection';
import './SmartProfile.css';

const SmartProfile = () => {
    const { userId: routeUserId } = useParams();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [activeTab, setActiveTab] = useState('common');

    const currentUser = auth.getCurrentUser();
    console.log('Current user from auth:', currentUser); // Debug log
    
    const userId = routeUserId || currentUser?.id;
    const isOwnProfile = !routeUserId || routeUserId === String(currentUser?.id);
    const canEdit = isOwnProfile || currentUser?.role === 'ADMIN';
    
    console.log('Profile permissions:', { userId, routeUserId, isOwnProfile, canEdit, currentUserRole: currentUser?.role }); // Debug log

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
            console.log('SmartProfile - handleSaveProfile called with:', updatedData);
            const response = await axios.put(`/profile/${userId}?currentUserId=${currentUser.id}`, updatedData);
            console.log('SmartProfile - Profile update response:', response.data);
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
            
            console.log('Photo upload response:', response.data); // Debug log
            
            // Update profile with new photo URL
            setProfile(prev => ({ 
                ...prev, 
                profilePhotoUrl: response.data 
            }));
            setSelectedFile(null);
            setFilePreview(null);
            showMessage('Profile photo updated successfully!', 'success');
            
            // Notify navbar to refresh profile photo
            window.dispatchEvent(new CustomEvent('profilePhotoUpdated'));
            
            // Force refetch profile to ensure persistence
            setTimeout(() => {
                fetchProfile();
            }, 1000);
        } catch (error) {
            console.error('Error uploading photo:', error);
            const errorMsg = error.response?.data?.message || error.response?.data || 'Failed to upload profile photo';
            showMessage(errorMsg, 'error');
        }
    };

    const handlePhotoDelete = async () => {
        try {
            await axios.delete(`/profile/${userId}/photo?currentUserId=${currentUser.id}`);
            setProfile(prev => ({ ...prev, profilePhotoUrl: null }));
            showMessage('Profile photo deleted successfully!', 'success');
            
            // Notify navbar to refresh profile photo
            window.dispatchEvent(new CustomEvent('profilePhotoUpdated'));
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

    const getProfileTabs = () => {
        const tabs = [
            { id: 'common', label: 'Personal', icon: '👤' }
        ];

        if (profile?.role === 'TEACHER') {
            tabs.push({ id: 'teaching', label: 'Teaching', icon: '🎓' });
        } else if (profile?.role === 'STUDENT') {
            tabs.push({ id: 'academic', label: 'Academic', icon: '📚' });
        } else if (profile?.role === 'ADMIN') {
            tabs.push({ id: 'admin', label: 'Administration', icon: '⚙️' });
        }

        return tabs;
    };

    const renderTabContent = () => {
        switch (activeTab) {
            case 'common':
                return (
                    <CommonProfileSection
                        profile={profile}
                        editing={editing}
                        canEdit={canEdit}
                        onSave={handleSaveProfile}
                    />
                );
            case 'teaching':
                return (
                    <TeacherProfileSection
                        profile={profile}
                        editing={editing}
                        canEdit={canEdit}
                        onSave={handleSaveProfile}
                    />
                );
            case 'academic':
                return (
                    <StudentProfileSection
                        profile={profile}
                        editing={editing}
                        canEdit={canEdit}
                        isAdmin={currentUser?.role === 'ADMIN'}
                        onSave={handleSaveProfile}
                    />
                );
            case 'admin':
                return (
                    <AdminProfileSection
                        profile={profile}
                        editing={editing}
                        canEdit={canEdit}
                        onSave={handleSaveProfile}
                    />
                );
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="smart-profile-container">
                <div className="profile-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="smart-profile-container">
                <div className="profile-error">
                    <h2>Profile not found</h2>
                    <p>The requested profile could not be found.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="smart-profile-container">
            <div className="profile-header">
                <div className="profile-photo-section">
                    <div className="profile-photo-wrapper">
                        {filePreview ? (
                            <img 
                                src={filePreview} 
                                alt="Preview" 
                                className="profile-photo preview" 
                                onError={(e) => {
                                    console.error('Error loading preview image');
                                    e.target.style.display = 'none';
                                }}
                            />
                        ) : profile.profilePhotoUrl ? (
                            <img 
                                src={profile.profilePhotoUrl} 
                                alt="Profile" 
                                className="profile-photo" 
                                onLoad={() => console.log('Profile image loaded successfully:', profile.profilePhotoUrl)}
                                onError={(e) => {
                                    console.error('Error loading profile image:', profile.profilePhotoUrl);
                                    e.target.style.display = 'none';
                                    // Show placeholder instead
                                    const placeholder = e.target.parentElement.querySelector('.profile-photo-placeholder');
                                    if (placeholder) {
                                        placeholder.style.display = 'flex';
                                    }
                                }}
                            />
                        ) : null}
                        
                        <div 
                            className="profile-photo-placeholder" 
                            style={{display: profile.profilePhotoUrl && !filePreview ? 'none' : 'flex'}}
                        >
                            {profile.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        
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
                        <span className={`role-badge ${profile.role?.toLowerCase()}`}>
                            {profile.role}
                        </span>
                        <span className="profile-email">{profile.email}</span>
                        {!isOwnProfile && (
                            <span className="profile-note">Viewing {profile.name}'s profile</span>
                        )}
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

            {/* Smart Profile Navigation Tabs */}
            <div className="profile-tabs">
                {getProfileTabs().map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <span className="tab-icon">{tab.icon}</span>
                        <span className="tab-label">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Dynamic Tab Content */}
            <div className="profile-content">
                {renderTabContent()}
            </div>
        </div>
    );
};

export default SmartProfile;
