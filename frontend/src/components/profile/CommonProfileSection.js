import React, { useState, useEffect } from 'react';

const CommonProfileSection = ({ profile, editing, canEdit, onSave }) => {
    const [formData, setFormData] = useState({
        phone: '',
        altEmail: '',
        timezone: '',
        bio: ''
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                phone: profile.phone || '',
                altEmail: profile.altEmail || '',
                timezone: profile.timezone || 'UTC',
                bio: profile.bio || ''
            });
        }
    }, [profile]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave(formData);
    };

    const timezones = [
        'UTC', 'US/Eastern', 'US/Central', 'US/Mountain', 'US/Pacific',
        'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo',
        'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney'
    ];

    return (
        <div className="profile-section">
            <div className="section-header">
                <h2 className="section-title">Personal Information</h2>
                <p className="section-description">Basic information that appears on your profile</p>
            </div>

            <div className="section-content">
                {/* Read-only username and email */}
                <div className="profile-row">
                    <div className="profile-field">
                        <label className="field-label">Username</label>
                        <div className="field-value readonly">
                            {profile.username || profile.name}
                        </div>
                        <span className="field-note">Display name for identification</span>
                    </div>
                    <div className="profile-field">
                        <label className="field-label">Primary Email</label>
                        <div className="field-value readonly">
                            {profile.email}
                        </div>
                        <span className="field-note">Managed by Admin</span>
                    </div>
                </div>

                {/* Role badge (read-only) */}
                <div className="profile-row">
                    <div className="profile-field">
                        <label className="field-label">Role</label>
                        <div className="field-value readonly">
                            <span className={`role-badge ${profile.role?.toLowerCase()}`}>
                                {profile.role}
                            </span>
                        </div>
                        <span className="field-note">Managed by Admin</span>
                    </div>
                </div>

                {/* Editable fields */}
                <div className="profile-row">
                    <div className="profile-field">
                        <label className="field-label">Phone Number</label>
                        {editing && canEdit ? (
                            <input
                                type="tel"
                                className="field-input"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                placeholder="Enter your phone number"
                            />
                        ) : (
                            <div className="field-value">
                                {profile.phone || 'Not provided'}
                            </div>
                        )}
                    </div>

                    <div className="profile-field">
                        <label className="field-label">Alternative Email</label>
                        {editing && canEdit ? (
                            <input
                                type="email"
                                className="field-input"
                                value={formData.altEmail}
                                onChange={(e) => handleInputChange('altEmail', e.target.value)}
                                placeholder="Enter alternative email"
                            />
                        ) : (
                            <div className="field-value">
                                {profile.altEmail || 'Not provided'}
                            </div>
                        )}
                    </div>
                </div>

                <div className="profile-row">
                    <div className="profile-field">
                        <label className="field-label">Timezone</label>
                        {editing && canEdit ? (
                            <select
                                className="field-select"
                                value={formData.timezone}
                                onChange={(e) => handleInputChange('timezone', e.target.value)}
                            >
                                {timezones.map(tz => (
                                    <option key={tz} value={tz}>{tz}</option>
                                ))}
                            </select>
                        ) : (
                            <div className="field-value">
                                {profile.timezone || 'UTC'}
                            </div>
                        )}
                    </div>
                </div>

                <div className="profile-row">
                    <div className="profile-field full-width">
                        <label className="field-label">Bio</label>
                        {editing && canEdit ? (
                            <textarea
                                className="field-textarea"
                                value={formData.bio}
                                onChange={(e) => handleInputChange('bio', e.target.value)}
                                placeholder="Tell us about yourself..."
                                rows="4"
                                maxLength="500"
                            />
                        ) : (
                            <div className="field-value">
                                {profile.bio ? (
                                    <p className="bio-text">{profile.bio}</p>
                                ) : (
                                    'No bio provided'
                                )}
                            </div>
                        )}
                        {editing && canEdit && (
                            <div className="field-counter">
                                {formData.bio.length}/500 characters
                            </div>
                        )}
                    </div>
                </div>

                {editing && canEdit && (
                    <div className="section-actions">
                        <button className="btn btn-primary" onClick={handleSave}>
                            Save Changes
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommonProfileSection;
