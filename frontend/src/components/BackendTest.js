import React, { useEffect, useState } from 'react';
import axios from 'axios';

function BackendTest() {
  const [message, setMessage] = useState('Loading...');
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get('/api/test')
      .then(response => {
        setMessage(response.data);
        setError(null);
      })
      .catch(error => {
        console.error('Error details:', error);
        setError(`Error: ${error.response?.status} - ${error.response?.statusText || error.message}`);
        setMessage('Failed to connect to backend');
      });
  }, []);

  return (
    <div>
      <h1>{message}</h1>
      {error && <p style={{color: 'red'}}>{error}</p>}
    </div>
  );
}

export default BackendTest;
