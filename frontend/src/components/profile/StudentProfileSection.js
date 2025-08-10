import React, { useState, useEffect } from 'react';

const StudentProfileSection = ({ profile, editing, canEdit, isAdmin, onSave }) => {
    const [formData, setFormData] = useState({
        // Academic fields (admin-only editable)
        program: '',
        major: '',
        yearSemester: '',
        advisor: '',
        gpa: '',
        retakeCount: 0
    });

    useEffect(() => {
        if (profile) {
            console.log('StudentProfileSection - Profile data:', profile);
            
            setFormData({
                program: profile.program || '',
                major: profile.major || '',
                yearSemester: profile.yearSemester || '',
                advisor: profile.advisor || '',
                gpa: profile.gpa || '',
                retakeCount: profile.retakeCount || 0
            });
        }
    }, [profile]);

    // Reset form when editing mode changes
    useEffect(() => {
        if (!editing && profile) {
            // Reset form data to match current profile
            setFormData({
                program: profile.program || '',
                major: profile.major || '',
                yearSemester: profile.yearSemester || '',
                advisor: profile.advisor || '',
                gpa: profile.gpa || '',
                retakeCount: profile.retakeCount || 0
            });
        }
    }, [editing, profile]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        // Only include fields that the current user can edit
        const dataToSave = {};
        
        if (isAdmin) {
            dataToSave.program = formData.program;
            dataToSave.major = formData.major;
            dataToSave.yearSemester = formData.yearSemester;
            dataToSave.advisor = formData.advisor;
            dataToSave.gpa = formData.gpa;
            dataToSave.retakeCount = formData.retakeCount;
        }

        onSave(dataToSave);
    };    const getGpaColor = (gpa) => {
        const numGpa = parseFloat(gpa);
        if (numGpa >= 3.5) return 'gpa-excellent';
        if (numGpa >= 3.0) return 'gpa-good';
        if (numGpa >= 2.5) return 'gpa-average';
        return 'gpa-warning';
    };

    const getRetakeStatus = (count) => {
        if (count === 0) return { text: 'No retakes', class: 'status-good' };
        if (count <= 2) return { text: `${count} retake${count > 1 ? 's' : ''}`, class: 'status-warning' };
        return { text: `${count} retakes`, class: 'status-critical' };
    };

    return (
        <div className="profile-section student-section">
            <div className="section-header">
                <h2 className="section-title">Student Profile</h2>
                <p className="section-description">Academic and extracurricular information</p>
            </div>

            <div className="section-content">
                {/* Academic Information (Read-only for students, editable for admin) */}
                <div className="academic-info">
                    <h3 className="subsection-title">Academic Information</h3>
                    
                    <div className="profile-row">
                        <div className="profile-field">
                            <label className="field-label">Program</label>
                            {editing && isAdmin ? (
                                <input
                                    type="text"
                                    className="field-input"
                                    value={formData.program}
                                    onChange={(e) => handleInputChange('program', e.target.value)}
                                    placeholder="e.g., Bachelor of Science"
                                />
                            ) : (
                                <div className="field-value readonly">
                                    {profile.program || 'Not assigned'}
                                </div>
                            )}
                            {!isAdmin && (
                                <span className="field-note">Managed by Admin</span>
                            )}
                        </div>

                        <div className="profile-field">
                            <label className="field-label">Major</label>
                            {editing && isAdmin ? (
                                <input
                                    type="text"
                                    className="field-input"
                                    value={formData.major}
                                    onChange={(e) => handleInputChange('major', e.target.value)}
                                    placeholder="e.g., Computer Science"
                                />
                            ) : (
                                <div className="field-value readonly">
                                    {profile.major || 'Not assigned'}
                                </div>
                            )}
                            {!isAdmin && (
                                <span className="field-note">Managed by Admin</span>
                            )}
                        </div>
                    </div>

                    <div className="profile-row">
                        <div className="profile-field">
                            <label className="field-label">Year/Semester</label>
                            {editing && isAdmin ? (
                                <input
                                    type="text"
                                    className="field-input"
                                    value={formData.yearSemester}
                                    onChange={(e) => handleInputChange('yearSemester', e.target.value)}
                                    placeholder="e.g., Year 2, Semester 1"
                                />
                            ) : (
                                <div className="field-value readonly">
                                    {profile.yearSemester || 'Not assigned'}
                                </div>
                            )}
                        </div>

                        <div className="profile-field">
                            <label className="field-label">Academic Advisor</label>
                            {editing && isAdmin ? (
                                <input
                                    type="text"
                                    className="field-input"
                                    value={formData.advisor}
                                    onChange={(e) => handleInputChange('advisor', e.target.value)}
                                    placeholder="Advisor name"
                                />
                            ) : (
                                <div className="field-value readonly">
                                    {profile.advisor || 'Not assigned'}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="profile-row">
                        <div className="profile-field">
                            <label className="field-label">GPA</label>
                            {editing && isAdmin ? (
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="4.0"
                                    className="field-input"
                                    value={formData.gpa}
                                    onChange={(e) => handleInputChange('gpa', e.target.value)}
                                    placeholder="0.00"
                                />
                            ) : (
                                <div className="field-value readonly">
                                    {profile.gpa ? (
                                        <span className={`gpa-display ${getGpaColor(profile.gpa)}`}>
                                            {parseFloat(profile.gpa).toFixed(2)} / 4.0
                                        </span>
                                    ) : (
                                        'Not recorded'
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="profile-field">
                            <label className="field-label">Retake Count</label>
                            {editing && isAdmin ? (
                                <input
                                    type="number"
                                    min="0"
                                    className="field-input"
                                    value={formData.retakeCount}
                                    onChange={(e) => handleInputChange('retakeCount', parseInt(e.target.value) || 0)}
                                />
                            ) : (
                                <div className="field-value readonly">
                                    <span className={`status-badge ${getRetakeStatus(profile.retakeCount || 0).class}`}>
                                        {getRetakeStatus(profile.retakeCount || 0).text}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {editing && canEdit && isAdmin && (
                    <div className="section-actions">
                        <button className="btn btn-primary" onClick={handleSave}>
                            Save Student Profile
                        </button>
                        <div className="save-note">
                            * Academic information can only be edited by administrators.
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentProfileSection;
