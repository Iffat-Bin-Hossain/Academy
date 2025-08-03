import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import axios from '../api/axiosInstance';

const TeacherDashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState({
    assignedCourses: 0,
    totalStudents: 0,
    pendingEnrollments: 0,
    approvedEnrollments: 0
  });
  const [courses, setCourses] = useState([]);
  const [pendingEnrollments, setPendingEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTeacherData();
  }, []);

  const fetchTeacherData = async () => {
    try {
      const coursesRes = await axios.get(`/courses/teacher/${user.id}`);
      setCourses(coursesRes.data);
      
      // Fetch pending enrollments for each course
      let allPendingEnrollments = [];
      for (let course of coursesRes.data) {
        try {
          const pendingRes = await axios.get(`/courses/${course.id}/pending`);
          allPendingEnrollments = [...allPendingEnrollments, ...pendingRes.data];
        } catch (error) {
          console.error(`Error fetching pending enrollments for course ${course.id}:`, error);
        }
      }
      
      setPendingEnrollments(allPendingEnrollments);
      
      setStats({
        assignedCourses: coursesRes.data.length,
        totalStudents: 0, // TODO: Calculate total students
        pendingEnrollments: allPendingEnrollments.length,
        approvedEnrollments: 0 // TODO: Calculate approved enrollments
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching teacher data:', error);
      setLoading(false);
    }
  };

  const handleEnrollmentDecision = async (enrollmentId, approve) => {
    try {
      await axios.post(`/courses/decide?enrollmentId=${enrollmentId}&approve=${approve}&teacherId=${user.id}`);
      fetchTeacherData(); // Refresh data
    } catch (error) {
      console.error('Error processing enrollment decision:', error);
    }
  };

  if (loading) {
    return (
      <Dashboard user={user} onLogout={onLogout}>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading teacher dashboard...</p>
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
            <div className="card-icon">📖</div>
            <h3 className="card-title">My Courses</h3>
          </div>
          <div className="card-content">
            <span className="stat-number">{stats.assignedCourses}</span>
            <span className="stat-label">Assigned Courses</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-icon">👨‍🎓</div>
            <h3 className="card-title">Students</h3>
          </div>
          <div className="card-content">
            <span className="stat-number">{stats.totalStudents}</span>
            <span className="stat-label">Total Students</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-icon">⏳</div>
            <h3 className="card-title">Pending</h3>
          </div>
          <div className="card-content">
            <span className="stat-number">{stats.pendingEnrollments}</span>
            <span className="stat-label">Enrollment Requests</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-icon">✅</div>
            <h3 className="card-title">Approved</h3>
          </div>
          <div className="card-content">
            <span className="stat-number">{stats.approvedEnrollments}</span>
            <span className="stat-label">Active Enrollments</span>
          </div>
        </div>
      </div>

      {/* Teacher Sections */}
      <div className="teacher-sections">
        {/* My Courses */}
        <div className="teacher-section">
          <h2 className="section-title">📚 My Courses</h2>
          <div className="section-content">
            {courses.length === 0 ? (
              <div className="empty-state">
                <p>No courses assigned yet. Contact your administrator to get courses assigned.</p>
              </div>
            ) : (
              <div className="course-grid">
                {courses.map(course => (
                  <div key={course.id} className="course-card">
                    <div className="course-header">
                      <h4>{course.title}</h4>
                      <span className="course-code">{course.courseCode}</span>
                    </div>
                    <p className="course-description">{course.description}</p>
                    <div className="course-actions">
                      <button className="action-btn">👁️ View Details</button>
                      <button className="action-btn">📊 View Students</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pending Enrollments */}
        {stats.pendingEnrollments > 0 && (
          <div className="teacher-section">
            <h2 className="section-title">📝 Enrollment Requests</h2>
            <div className="section-content">
              <div className="enrollment-list">
                {pendingEnrollments.map(enrollment => (
                  <div key={enrollment.id} className="enrollment-card">
                    <div className="enrollment-info">
                      <div className="student-info">
                        <div className="student-avatar">
                          {enrollment.student.name.charAt(0)}
                        </div>
                        <div>
                          <div className="student-name">{enrollment.student.name}</div>
                          <div className="student-email">{enrollment.student.email}</div>
                        </div>
                      </div>
                      <div className="course-info">
                        <div className="course-name">{enrollment.course.title}</div>
                        <div className="course-code">{enrollment.course.courseCode}</div>
                      </div>
                    </div>
                    <div className="enrollment-actions">
                      <button 
                        className="approve-btn"
                        onClick={() => handleEnrollmentDecision(enrollment.id, true)}
                      >
                        ✅ Approve
                      </button>
                      <button 
                        className="reject-btn"
                        onClick={() => handleEnrollmentDecision(enrollment.id, false)}
                      >
                        ❌ Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Dashboard>
  );
};

export default TeacherDashboard;
