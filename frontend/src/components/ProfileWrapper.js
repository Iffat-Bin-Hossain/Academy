import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';
import Layout from './Layout';
import SmartProfile from './SmartProfile';

const ProfileWrapper = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await axios.get('/user/me');
      setUser({
        id: response.data.id,
        name: response.data.name,
        role: response.data.role,
        email: response.data.email
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      // If token is invalid, redirect to login
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <Layout user={user} onLogout={handleLogout}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '60vh',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading profile...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout}
      pageTitle="Profile"
      pageSubtitle="Manage your account settings and preferences"
    >
      <SmartProfile />
    </Layout>
  );
};

export default ProfileWrapper;
