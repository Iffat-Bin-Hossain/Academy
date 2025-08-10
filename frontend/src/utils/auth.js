import { jwtDecode } from 'jwt-decode';

export const auth = {
  getCurrentUser: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return null;
    }

    try {
      const decoded = jwtDecode(token);
      console.log('Decoded token:', decoded); // Debug log
      
      return {
        id: decoded.userId || decoded.id || decoded.sub,
        name: decoded.name || decoded.sub,
        email: decoded.email || decoded.sub,
        role: decoded.role || 'USER'
      };
    } catch (error) {
      console.error('Error decoding token:', error);
      // Try manual decode as fallback
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('Manual decoded payload:', payload); // Debug log
        
        return {
          id: payload.userId || payload.id || payload.sub,
          name: payload.name || payload.sub,
          email: payload.email || payload.sub,
          role: payload.role || 'USER'
        };
      } catch (manualError) {
        console.error('Manual decode also failed:', manualError);
        localStorage.removeItem('token'); // Remove invalid token
        return null;
      }
    }
  },

  isAuthenticated: () => {
    const token = localStorage.getItem('token');
    if (!token) {
      return false;
    }

    try {
      const decoded = jwtDecode(token);
      // Check if token is expired
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch (error) {
      localStorage.removeItem('token'); // Remove invalid token
      return false;
    }
  },

  getToken: () => {
    return localStorage.getItem('token');
  },

  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
};
