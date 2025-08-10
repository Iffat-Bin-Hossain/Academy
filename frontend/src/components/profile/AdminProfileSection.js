import React, { useState, useEffect } from 'react';

const AdminProfileSection = ({ profile, editing, canEdit, onSave }) => {
    const [formData, setFormData] = useState({
        // Common fields that admin can edit (all of them)
        phone: '',
        altEmail: '',
        timezone: '',
        bio: '',
        // Admin-specific fields
        department: '',
        accessLevel: '',
        adminNotes: ''
    });

    useEffect(() => {
        if (profile) {
            setFormData({
                phone: profile.phone || '',
                altEmail: profile.altEmail || '',
                timezone: profile.timezone || 'UTC',
                bio: profile.bio || '',
                department: profile.department || '',
                accessLevel: profile.accessLevel || 'FULL',
                adminNotes: profile.adminNotes || ''
            });
        }
    }, [profile]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSave(formData);
    };

    const accessLevels = [
        { value: 'FULL', label: 'Full Access', description: 'Complete system administration' },
        { value: 'USER_MANAGEMENT', label: 'User Management', description: 'Manage users and roles' },
        { value: 'COURSE_MANAGEMENT', label: 'Course Management', description: 'Manage courses and content' },
        { value: 'SYSTEM_MONITORING', label: 'System Monitoring', description: 'View system status and logs' }
    ];

    const departments = [
        'Information Technology',
        'Human Resources',
        'Academic Affairs',
        'Student Services',
        'Finance',
        'Operations',
        'Other'
    ];

    return (
        <div className="profile-section admin-section">
            <div className="section-header">
                <h2 className="section-title">Administrator Profile</h2>
                <p className="section-description">System administration and management information</p>
            </div>

            <div className="section-content">
                {/* Common editable fields for admin */}
                <div className="common-info">
                    <h3 className="subsection-title">Personal Information</h3>
                    
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
                                    {['UTC', 'US/Eastern', 'US/Central', 'US/Mountain', 'US/Pacific',
                                      'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Asia/Tokyo',
                                      'Asia/Shanghai', 'Asia/Kolkata', 'Australia/Sydney'].map(tz => (
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
                </div>

                {/* Admin-specific fields */}
                <div className="admin-info">
                    <h3 className="subsection-title">Administrative Details</h3>
                    
                    <div className="profile-row">
                        <div className="profile-field">
                            <label className="field-label">Department</label>
                            {editing && canEdit ? (
                                <select
                                    className="field-select"
                                    value={formData.department}
                                    onChange={(e) => handleInputChange('department', e.target.value)}
                                >
                                    <option value="">Select Department</option>
                                    {departments.map(dept => (
                                        <option key={dept} value={dept}>{dept}</option>
                                    ))}
                                </select>
                            ) : (
                                <div className="field-value">
                                    {profile.department || 'Not specified'}
                                </div>
                            )}
                        </div>

                        <div className="profile-field">
                            <label className="field-label">Access Level</label>
                            {editing && canEdit ? (
                                <select
                                    className="field-select"
                                    value={formData.accessLevel}
                                    onChange={(e) => handleInputChange('accessLevel', e.target.value)}
                                >
                                    {accessLevels.map(level => (
                                        <option key={level.value} value={level.value}>
                                            {level.label}
                                        </option>
                                    ))}
                                </select>
                            ) : (
                                <div className="field-value">
                                    <div className="access-level-display">
                                        <span className={`access-badge ${profile.accessLevel?.toLowerCase() || 'full'}`}>
                                            {accessLevels.find(l => l.value === profile.accessLevel)?.label || 'Full Access'}
                                        </span>
                                        <div className="access-description">
                                            {accessLevels.find(l => l.value === profile.accessLevel)?.description || 'Complete system administration'}
                                        </div>
                                    </div>
                                </div>
                            )}
                            {editing && canEdit && (
                                <div className="field-note">
                                    {accessLevels.find(l => l.value === formData.accessLevel)?.description}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="profile-row">
                        <div className="profile-field full-width">
                            <label className="field-label">Administrative Notes</label>
                            {editing && canEdit ? (
                                <textarea
                                    className="field-textarea"
                                    value={formData.adminNotes}
                                    onChange={(e) => handleInputChange('adminNotes', e.target.value)}
                                    placeholder="Internal notes about administrative role and responsibilities..."
                                    rows="3"
                                    maxLength="1000"
                                />
                            ) : (
                                <div className="field-value">
                                    {profile.adminNotes ? (
                                        <p className="admin-notes-text">{profile.adminNotes}</p>
                                    ) : (
                                        'No administrative notes'
                                    )}
                                </div>
                            )}
                            {editing && canEdit && (
                                <div className="field-counter">
                                    {formData.adminNotes.length}/1000 characters
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {editing && canEdit && (
                    <div className="section-actions">
                        <button className="btn btn-primary" onClick={handleSave}>
                            Save Administrator Profile
                        </button>
                        <div className="save-note">
                            * Changes to access level may require system administrator approval
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminProfileSection;
