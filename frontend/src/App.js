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
              <Routes>
                <Route path="/" element={<ModernTeacherDashboard />} />
                <Route path="/:courseCode" element={<CourseDetailsPage />} />
              </Routes>
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/*"
          element={
            <ProtectedRoute roleRequired="STUDENT">
              <Routes>
                <Route path="/" element={<ModernStudentDashboard />} />
                <Route path="/:courseCode" element={<StudentCourseDetailsPage />} />
              </Routes>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
