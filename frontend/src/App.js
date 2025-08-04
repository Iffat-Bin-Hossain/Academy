import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import ModernAdminDashboard from './components/ModernAdminDashboard';
import ModernTeacherDashboard from './components/ModernTeacherDashboard';
import ModernStudentDashboard from './components/ModernStudentDashboard';
import Login from './components/Login';
import Signup from './components/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import AboutPage from './components/AboutPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes with header */}
        <Route
          path="/"
          element={
            <>
              <Header />
              <LandingPage />
            </>
          }
        />
        <Route
          path="/about"
          element={
            <>
              <Header />
              <AboutPage />
            </>
          }
        />
        <Route
          path="/login"
          element={
            <>
              <Header />
              <Login />
            </>
          }
        />
        <Route
          path="/signup"
          element={
            <>
              <Header />
              <Signup />
            </>
          }
        />

        {/* Protected dashboard routes - no header (navbar included in Layout) */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute roleRequired="ADMIN">
              <ModernAdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute roleRequired="TEACHER">
              <ModernTeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/*"
          element={
            <ProtectedRoute roleRequired="STUDENT">
              <ModernStudentDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
