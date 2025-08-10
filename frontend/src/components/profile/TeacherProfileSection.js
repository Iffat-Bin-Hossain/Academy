import React, { useState, useEffect } from 'react';

const TeacherProfileSection = ({ profile, editing, canEdit, onSave }) => {
    const [formData, setFormData] = useState({
        officeRoom: '',
        researchInterests: '',
        personalWebsite: '',
        scholarProfileUrl: ''
    });

    const [tags, setTags] = useState([]);
    const [newTag, setNewTag] = useState('');

    useEffect(() => {
        if (profile) {
            setFormData({
                officeRoom: profile.officeRoom || '',
                researchInterests: profile.researchInterests || '',
                personalWebsite: profile.personalWebsite || '',
                scholarProfileUrl: profile.scholarProfileUrl || ''
            });

            // Parse research interests into tags
            if (profile.researchInterests) {
                const interestTags = profile.researchInterests
                    .split(',')
                    .map(tag => tag.trim())
                    .filter(tag => tag.length > 0);
                setTags(interestTags);
            }
        }
    }, [profile]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAddTag = (e) => {
        if (e.key === 'Enter' && newTag.trim()) {
            e.preventDefault();
            if (!tags.includes(newTag.trim()) && tags.length < 10) {
                const updatedTags = [...tags, newTag.trim()];
                setTags(updatedTags);
                setFormData(prev => ({ 
                    ...prev, 
                    researchInterests: updatedTags.join(', ') 
                }));
                setNewTag('');
            }
        }
    };

    const handleRemoveTag = (tagToRemove) => {
        const updatedTags = tags.filter(tag => tag !== tagToRemove);
        setTags(updatedTags);
        setFormData(prev => ({ 
            ...prev, 
            researchInterests: updatedTags.join(', ') 
        }));
    };

    const handleSave = () => {
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
                    <div className="profile-field full-width">
                        <label className="field-label">Research Interests</label>
                        {editing && canEdit ? (
                            <div className="tags-container">
                                <div className="tags-display">
                                    {tags.map((tag, index) => (
                                        <span key={index} className="research-tag">
                                            {tag}
                                            <button
                                                type="button"
                                                className="tag-remove"
                                                onClick={() => handleRemoveTag(tag)}
                                            >
                                                ✕
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    className="field-input tag-input"
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    onKeyDown={handleAddTag}
                                    placeholder="Add research interest and press Enter"
                                    disabled={tags.length >= 10}
                                />
                                <div className="field-note">
                                    Press Enter to add tags. Maximum 10 tags allowed.
                                </div>
                            </div>
                        ) : (
                            <div className="field-value">
                                {tags.length > 0 ? (
                                    <div className="tags-display">
                                        {tags.map((tag, index) => (
                                            <span key={index} className="research-tag readonly">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    'Not provided'
                                )}
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
