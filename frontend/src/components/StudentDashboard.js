import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import axios from '../api/axiosInstance';

const StudentDashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    pendingRequests: 0,
    completedCourses: 0,
    availableCourses: 0
  });
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, []);

  const fetchStudentData = async () => {
    try {
      const [enrolledRes, allCoursesRes] = await Promise.all([
        axios.get(`/courses/student/${user.id}`),
        axios.get('/courses')
      ]);
      
      setEnrolledCourses(enrolledRes.data);
      setAvailableCourses(allCoursesRes.data);
      
      const approvedEnrollments = enrolledRes.data.filter(e => e.status === 'APPROVED');
      const pendingEnrollments = enrolledRes.data.filter(e => e.status === 'PENDING');
      
      setStats({
        enrolledCourses: approvedEnrollments.length,
        pendingRequests: pendingEnrollments.length,
        completedCourses: 0, // TODO: Add completed courses logic
        availableCourses: allCoursesRes.data.length
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching student data:', error);
      setLoading(false);
    }
  };

  const handleEnrollRequest = async (courseId) => {
    try {
      await axios.post(`/courses/enroll?courseId=${courseId}&studentId=${user.id}`);
      fetchStudentData(); // Refresh data
    } catch (error) {
      console.error('Error requesting enrollment:', error);
    }
  };

  const isEnrolledInCourse = (courseId) => {
    return enrolledCourses.some(enrollment => enrollment.course.id === courseId);
  };

  if (loading) {
    return (
      <Dashboard user={user} onLogout={onLogout}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading student dashboard...</p>
        </div>
      </Dashboard>
    );
  }

  return (
    <Dashboard user={user} onLogout={onLogout}>
      {/* Stats Cards */}
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-icon">📚</div>
            <h3 className="card-title">Enrolled</h3>
          </div>
          <div className="card-content">
            <span className="stat-number">{stats.enrolledCourses}</span>
            <span className="stat-label">Active Courses</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-icon">⏳</div>
            <h3 className="card-title">Pending</h3>
          </div>
          <div className="card-content">
            <span className="stat-number">{stats.pendingRequests}</span>
            <span className="stat-label">Enrollment Requests</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-icon">🎓</div>
            <h3 className="card-title">Completed</h3>
          </div>
          <div className="card-content">
            <span className="stat-number">{stats.completedCourses}</span>
            <span className="stat-label">Finished Courses</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-icon">🔍</div>
            <h3 className="card-title">Available</h3>
          </div>
          <div className="card-content">
            <span className="stat-number">{stats.availableCourses}</span>
            <span className="stat-label">Total Courses</span>
          </div>
        </div>
      </div>

      {/* Student Sections */}
      <div className="student-sections">
        {/* My Courses */}
        <div className="student-section">
          <h2 className="section-title">📖 My Courses</h2>
          <div className="section-content">
            {stats.enrolledCourses === 0 ? (
              <div className="empty-state">
                <p>You haven't enrolled in any courses yet. Browse available courses below!</p>
              </div>
            ) : (
              <div className="course-grid">
                {enrolledCourses
                  .filter(enrollment => enrollment.status === 'APPROVED')
                  .map(enrollment => (
                    <div key={enrollment.id} className="course-card enrolled">
                      <div className="course-header">
                        <h4>{enrollment.course.title}</h4>
                        <span className="course-code">{enrollment.course.courseCode}</span>
                      </div>
                      <p className="course-description">{enrollment.course.description}</p>
                      <div className="course-footer">
                        <span className="teacher-info">
                          👨‍🏫 {enrollment.course.assignedTeacher?.name || 'No teacher assigned'}
                        </span>
                        <div className="enrollment-status approved">✅ Enrolled</div>
                      </div>
                      <div className="course-actions">
                        <button className="action-btn primary">📖 Enter Course</button>
                        <button className="action-btn">📊 View Progress</button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Requests */}
        {stats.pendingRequests > 0 && (
          <div className="student-section">
            <h2 className="section-title">⏳ Pending Enrollment Requests</h2>
            <div className="section-content">
              <div className="course-grid">
                {enrolledCourses
                  .filter(enrollment => enrollment.status === 'PENDING')
                  .map(enrollment => (
                    <div key={enrollment.id} className="course-card pending">
                      <div className="course-header">
                        <h4>{enrollment.course.title}</h4>
                        <span className="course-code">{enrollment.course.courseCode}</span>
                      </div>
                      <p className="course-description">{enrollment.course.description}</p>
                      <div className="course-footer">
                        <span className="teacher-info">
                          👨‍🏫 {enrollment.course.assignedTeacher?.name || 'No teacher assigned'}
                        </span>
                        <div className="enrollment-status pending">⏳ Awaiting Approval</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Browse Courses */}
        <div className="student-section">
          <h2 className="section-title">🔍 Browse Available Courses</h2>
          <div className="section-content">
            <div className="course-grid">
              {availableCourses.map(course => {
                const isEnrolled = isEnrolledInCourse(course.id);
                return (
                  <div key={course.id} className={`course-card ${isEnrolled ? 'enrolled' : 'available'}`}>
                    <div className="course-header">
                      <h4>{course.title}</h4>
                      <span className="course-code">{course.courseCode}</span>
                    </div>
                    <p className="course-description">{course.description}</p>
                    <div className="course-footer">
                      <span className="teacher-info">
                        👨‍🏫 {course.assignedTeacher?.name || 'No teacher assigned'}
                      </span>
                    </div>
                    <div className="course-actions">
                      {isEnrolled ? (
                        <button className="action-btn disabled" disabled>
                          Already Enrolled
                        </button>
                      ) : (
                        <button 
                          className="action-btn primary"
                          onClick={() => handleEnrollRequest(course.id)}
                        >
                          📝 Request Enrollment
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </Dashboard>
  );
};

export default StudentDashboard;
