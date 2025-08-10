import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import ModernAdminDashboard from './components/ModernAdminDashboard';
import ModernTeacherDashboard from './components/ModernTeacherDashboard';
import CourseDetailsPage from './components/CourseDetailsPage';
import ModernStudentDashboard from './components/ModernStudentDashboard';
import StudentCourseDetailsPage from './components/StudentCourseDetailsPage';
import Login from './components/Login';
import Signup from './components/Signup';
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header';
import AboutPage from './components/AboutPage';
import SmartProfile from './components/SmartProfile';
import Layout from './components/Layout';
import ProfileWrapper from './components/ProfileWrapper';

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
          path="/teacher"
          element={
            <ProtectedRoute roleRequired="TEACHER">
              <ModernTeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/:courseCode"
          element={
            <ProtectedRoute roleRequired="TEACHER">
              <CourseDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student"
          element={
            <ProtectedRoute roleRequired="STUDENT">
              <ModernStudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/:courseCode"
          element={
            <ProtectedRoute roleRequired="STUDENT">
              <StudentCourseDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* Profile routes - accessible by all authenticated users */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfileWrapper />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <ProfileWrapper />
            </ProtectedRoute>
          }
        />
        {/* Role-specific profile routes */}
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute roleRequired="ADMIN">
              <ProfileWrapper />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/profile"
          element={
            <ProtectedRoute roleRequired="TEACHER">
              <ProfileWrapper />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/profile"
          element={
            <ProtectedRoute roleRequired="STUDENT">
              <ProfileWrapper />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
