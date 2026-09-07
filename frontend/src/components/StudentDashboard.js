import React, { useState, useEffect } from 'react';
import Dashboard from './Dashboard';
import axios from '../api/axiosInstance';
import { FiBookOpen, FiClock, FiAward, FiSearch, FiCheck, FiUser, FiSend, FiBarChart2 } from 'react-icons/fi';

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

      const enrolled = enrolledRes.data || [];
      const allCourses = allCoursesRes.data || [];
      
      setEnrolledCourses(enrolled);
      setAvailableCourses(allCourses);
      
      const approved = enrolled.filter(e => e.status === 'APPROVED').length;
      const pending = enrolled.filter(e => e.status === 'PENDING').length;
      
      setStats({
        enrolledCourses: approved,
        pendingRequests: pending,
        completedCourses: 0,
        availableCourses: allCourses.length
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching student data:', error);
      setLoading(false);
    }
  };

  const handleEnrollRequest = async (courseId) => {
    try {
      await axios.post('/courses/enroll', null, {
        params: {
          studentId: user.id,
          courseId: courseId
        }
      });
      alert('Enrollment request submitted successfully!');
      fetchStudentData();
    } catch (error) {
      console.error('Error requesting enrollment:', error);
      alert(error.response?.data?.error || 'Failed to submit enrollment request');
    }
  };

  const isEnrolledInCourse = (courseId) => {
    return enrolledCourses.some(e => e.course.id === courseId);
  };

  if (loading) {
    return (
      <Dashboard user={user} onLogout={onLogout}>
        <div className="loading">Loading student dashboard...</div>
      </Dashboard>
    );
  }

  return (
    <Dashboard user={user} onLogout={onLogout}>
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-icon"><FiBookOpen /></div>
            <h3 className="card-title">Enrolled</h3>
          </div>
          <div className="card-content">
            <span className="stat-number">{stats.enrolledCourses}</span>
            <span className="stat-label">Active Courses</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-icon"><FiClock /></div>
            <h3 className="card-title">Pending</h3>
          </div>
          <div className="card-content">
            <span className="stat-number">{stats.pendingRequests}</span>
            <span className="stat-label">Enrollment Requests</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-icon"><FiAward /></div>
            <h3 className="card-title">Completed</h3>
          </div>
          <div className="card-content">
            <span className="stat-number">{stats.completedCourses}</span>
            <span className="stat-label">Finished Courses</span>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-icon"><FiSearch /></div>
            <h3 className="card-title">Available</h3>
          </div>
          <div className="card-content">
            <span className="stat-number">{stats.availableCourses}</span>
            <span className="stat-label">Total Courses</span>
          </div>
        </div>
      </div>

      <div className="student-sections">
        <div className="student-section">
          <h2 className="section-title"><FiBookOpen style={{ marginRight: '0.5rem' }} /> My Courses</h2>
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
                          <FiUser style={{ marginRight: '0.35rem' }} /> {enrollment.course.assignedTeacher?.name || 'No teacher assigned'}
                        </span>
                        <div className="enrollment-status approved"><FiCheck style={{ marginRight: '0.25rem' }} /> Enrolled</div>
                      </div>
                      <div className="course-actions">
                        <button className="action-btn primary"><FiBookOpen style={{ marginRight: '0.35rem' }} /> Enter Course</button>
                        <button className="action-btn"><FiBarChart2 style={{ marginRight: '0.35rem' }} /> View Progress</button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {stats.pendingRequests > 0 && (
          <div className="student-section">
            <h2 className="section-title"><FiClock style={{ marginRight: '0.5rem' }} /> Pending Enrollment Requests</h2>
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
                          <FiUser style={{ marginRight: '0.35rem' }} /> {enrollment.course.assignedTeacher?.name || 'No teacher assigned'}
                        </span>
                        <div className="enrollment-status pending"><FiClock style={{ marginRight: '0.25rem' }} /> Awaiting Approval</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        <div className="student-section">
          <h2 className="section-title"><FiSearch style={{ marginRight: '0.5rem' }} /> Browse Available Courses</h2>
          <div className="section-content">
            <div className="course-grid">
              {availableCourses
                .sort((a, b) => {
                  const levelA = parseInt(a.level) || 0;
                  const levelB = parseInt(b.level) || 0;
                  if (levelA !== levelB) return levelA - levelB;
                  const termA = parseInt(a.term) || 0;
                  const termB = parseInt(b.term) || 0;
                  if (termA !== termB) return termA - termB;
                  const codeA = a.courseCode || '';
                  const codeB = b.courseCode || '';
                  return codeA.localeCompare(codeB);
                })
                .map(course => {
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
                        <FiUser style={{ marginRight: '0.35rem' }} /> {course.assignedTeacher?.name || 'No teacher assigned'}
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
                          <FiSend style={{ marginRight: '0.35rem' }} /> Request Enrollment
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
