// ✅ FILE: src/components/ProtectedRoute.js
// A wrapper for route protection using decoded JWT with expiration validation
import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function ProtectedRoute({ roleRequired, children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  try {
    const decoded = jwtDecode(token);
    
    // Check JWT token expiration (exp is in seconds)
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem('token');
      return <Navigate to="/login" replace />;
    }

    // If no specific role is required, any authenticated user can access
    if (!roleRequired) {
      return children;
    }
    
    // If a specific role is required, check if user has that role
    if (decoded.role !== roleRequired) {
      return <Navigate to="/login" replace />;
    }
    
    return children; // allow access
  } catch (e) {
    // Malformed or corrupt token
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }
}

export default ProtectedRoute;