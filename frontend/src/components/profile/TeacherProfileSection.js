import React, { useState, useEffect } from 'react';

const TeacherProfileSection = ({ profile, editing, canEdit, onSave }) => {
    const [formData, setFormData] = useState({
        officeRoom: '',
        personalWebsite: '',
        scholarProfileUrl: ''
    });

    useEffect(() => {
        if (profile) {
            console.log('TeacherProfileSection - Profile data:', profile);
            
            setFormData({
                officeRoom: profile.officeRoom || '',
                personalWebsite: profile.personalWebsite || '',
                scholarProfileUrl: profile.scholarProfileUrl || ''
            });
        }
    }, [profile]);

    // Reset form when editing mode changes
    useEffect(() => {
        if (!editing && profile) {
            // Reset form data to match current profile
            setFormData({
                officeRoom: profile.officeRoom || '',
                personalWebsite: profile.personalWebsite || '',
                scholarProfileUrl: profile.scholarProfileUrl || ''
            });
        }
    }, [editing, profile]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        console.log('TeacherProfileSection - handleSave called with:', formData);
        onSave(formData);
    };

    const validateUrl = (url) => {
        if (!url) return true;
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    return (
        <div className="profile-section teacher-section">
            <div className="section-header">
                <h2 className="section-title">Teaching Profile</h2>
                <p className="section-description">Professional information for faculty members</p>
            </div>

            <div className="section-content">
                <div className="profile-row">
                    <div className="profile-field">
                        <label className="field-label">Office/Room</label>
                        {editing && canEdit ? (
                            <input
                                type="text"
                                className="field-input"
                                value={formData.officeRoom}
                                onChange={(e) => handleInputChange('officeRoom', e.target.value)}
                                placeholder="e.g., Building A, Room 205"
                            />
                        ) : (
                            <div className="field-value">
                                {profile.officeRoom || 'Not provided'}
                            </div>
                        )}
                    </div>
                </div>

                <div className="profile-row">
                    <div className="profile-field">
                        <label className="field-label">Personal Website</label>
                        {editing && canEdit ? (
                            <div>
                                <input
                                    type="url"
                                    className={`field-input ${formData.personalWebsite && !validateUrl(formData.personalWebsite) ? 'invalid' : ''}`}
                                    value={formData.personalWebsite}
                                    onChange={(e) => handleInputChange('personalWebsite', e.target.value)}
                                    placeholder="https://your-website.com"
                                />
                                {formData.personalWebsite && !validateUrl(formData.personalWebsite) && (
                                    <span className="field-error">Please enter a valid URL</span>
                                )}
                            </div>
                        ) : (
                            <div className="field-value">
                                {profile.personalWebsite ? (
                                    <a 
                                        href={profile.personalWebsite} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="link-external"
                                    >
                                        {profile.personalWebsite} 🔗
                                    </a>
                                ) : (
                                    'Not provided'
                                )}
                            </div>
                        )}
                    </div>

                    <div className="profile-field">
                        <label className="field-label">Scholar Profile</label>
                        {editing && canEdit ? (
                            <div>
                                <input
                                    type="url"
                                    className={`field-input ${formData.scholarProfileUrl && !validateUrl(formData.scholarProfileUrl) ? 'invalid' : ''}`}
                                    value={formData.scholarProfileUrl}
                                    onChange={(e) => handleInputChange('scholarProfileUrl', e.target.value)}
                                    placeholder="https://scholar.google.com/citations?user=..."
                                />
                                {formData.scholarProfileUrl && !validateUrl(formData.scholarProfileUrl) && (
                                    <span className="field-error">Please enter a valid URL</span>
                                )}
                            </div>
                        ) : (
                            <div className="field-value">
                                {profile.scholarProfileUrl ? (
                                    <a 
                                        href={profile.scholarProfileUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="link-external"
                                    >
                                        Google Scholar Profile 🎓
                                    </a>
                                ) : (
                                    'Not provided'
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {editing && canEdit && (
                    <div className="section-actions">
                        <button 
                            className="btn btn-primary" 
                            onClick={handleSave}
                            disabled={
                                (formData.personalWebsite && !validateUrl(formData.personalWebsite)) ||
                                (formData.scholarProfileUrl && !validateUrl(formData.scholarProfileUrl))
                            }
                        >
                            Save Teaching Profile
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeacherProfileSection;
