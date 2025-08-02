// ✅ FILE: src/App.js
// Application router setup
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './components/LandingPage';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login'; // assume created elsewhere
import Signup from './components/Signup'; // assume created elsewhere
import ProtectedRoute from './components/ProtectedRoute';
import Header from './components/Header'; // Import the Header
import HomePage from './components/HomePage';
import AboutPage from './components/AboutPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Routes with the new Header */}
        <Route
          path="/*"
          element={
            <>
              <Header />
              <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/home" element={<HomePage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute roleRequired="ADMIN">
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
