import React, { useState, useEffect } from 'react';
import StudentPerformanceAnalytics from './StudentPerformanceAnalytics';
import axios from '../api/axiosInstance';

const PerformanceAnalyticsPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const userResponse = await axios.get('/user/me');
      setUser({
        id: userResponse.data.id,
        name: userResponse.data.name,
        role: userResponse.data.role,
        email: userResponse.data.email
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      setMessage('Failed to load user data');
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (msg, type = 'info') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => {
      setMessage('');
      setMessageType('');
    }, 5000);
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '3rem' }}>
        <div className="spinner"></div>
        <p>Loading performance analytics...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem' }}>
      {message && (
        <div className={`alert alert-${messageType === 'error' ? 'danger' : 'info'} alert-dismissible fade show`} role="alert">
          {message}
          <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
        </div>
      )}
      
      <StudentPerformanceAnalytics 
        user={user}
        onShowMessage={showMessage}
      />
    </div>
  );
};

export default PerformanceAnalyticsPage;
