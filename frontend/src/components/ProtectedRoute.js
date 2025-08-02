// ✅ FILE: src/components/ProtectedRoute.js
// A wrapper for route protection using decoded JWT
import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function ProtectedRoute({ roleRequired, children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  try {
    const decoded = jwtDecode(token); // decode token to get role
    if (decoded.role !== roleRequired) {
      return <Navigate to="/login" replace />;
    }
    return children; // allow access
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
}

export default ProtectedRoute;