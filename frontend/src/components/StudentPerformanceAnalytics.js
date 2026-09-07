import React, { useState, useEffect } from 'react';
import axios from '../api/axiosInstance';
import { 
  FiBarChart2, 
  FiTrendingUp, 
  FiRefreshCw, 
  FiAlertTriangle, 
  FiFileText, 
  FiBookOpen,
  FiTarget,
  FiStar,
  FiZap,
  FiThumbsUp,
  FiCheckCircle,
  FiActivity,
  FiXCircle
} from 'react-icons/fi';
import { FaGraduationCap, FaLightbulb } from 'react-icons/fa';

// Map grade icon names to actual react-icon components
const GRADE_ICONS = {
  FiTarget: <FiTarget />,
  FiStar: <FiStar />,
  FiZap: <FiZap />,
  FiThumbsUp: <FiThumbsUp />,
  FiCheckCircle: <FiCheckCircle />,
  FiBookOpen: <FiBookOpen />,
  FiActivity: <FiActivity />,
  FiAlertTriangle: <FiAlertTriangle />,
  FiXCircle: <FiXCircle />,
};

const StudentPerformanceAnalytics = ({ user, onShowMessage }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    console.log('StudentPerformanceAnalytics mounted, user:', user ? `User ID: ${user.id}` : 'No user');
    if (user && user.id) {
      fetchAnalytics();
    } else {
      setLoading(false);
    }
  }, [user]);

  // Auto-refresh analytics every 1 seconds to catch grade updates
  useEffect(() => {
    if (!user || !user.id) return;

    const interval = setInterval(() => {
      fetchAnalytics();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  // Additional refresh when the page becomes visible (teacher updates detection)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id) {
        setTimeout(() => fetchAnalytics(), 1000);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [user]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const timestamp = new Date().getTime();
      const response = await axios.get(`/grades/student/${user.id}/performance?_t=${timestamp}`);
      const data = response.data;

      if (data && typeof data === 'object') {
        const analyticsData = data.analytics || {};
        const fullAnalyticsData = {
          ...analyticsData,
          overallSummary: data.overallSummary || { overallGPA: 0, coursesEnrolled: 0, coursesWithGrades: 0 }
        };
        setAnalytics(fullAnalyticsData);
        setLastUpdated(new Date());
      } else {
        setError('Invalid data received from server');
      }
    } catch (error) {
      console.error('Error fetching performance analytics:', error);
      setError(error.response?.data?.error || 'Failed to load performance analytics');
      onShowMessage?.('Failed to load performance analytics', 'error');
    } finally {
      setLoading(false);
    }
  };  // Grade utility functions based on your grading system
  const getGradeInfo = (percentage) => {
    const numPercentage = typeof percentage === 'number' ? percentage : 0;
    let gradeResult;
    if (numPercentage >= 80) gradeResult = { letter: 'A+', gpa: 4.00, color: '#059669', iconName: 'FiTarget', description: 'Outstanding' };
    else if (numPercentage >= 75) gradeResult = { letter: 'A', gpa: 3.75, color: '#16a34a', iconName: 'FiStar', description: 'Excellent' };
    else if (numPercentage >= 70) gradeResult = { letter: 'A-', gpa: 3.50, color: '#22c55e', iconName: 'FiZap', description: 'Very Good' };
    else if (numPercentage >= 65) gradeResult = { letter: 'B+', gpa: 3.25, color: '#3b82f6', iconName: 'FiThumbsUp', description: 'Good' };
    else if (numPercentage >= 60) gradeResult = { letter: 'B', gpa: 3.00, color: '#6366f1', iconName: 'FiCheckCircle', description: 'Above Average' };
    else if (numPercentage >= 55) gradeResult = { letter: 'B-', gpa: 2.75, color: '#d97706', iconName: 'FiBookOpen', description: 'Average' };
    else if (numPercentage >= 50) gradeResult = { letter: 'C', gpa: 2.50, color: '#f59e0b', iconName: 'FiActivity', description: 'Below Average' };
    else if (numPercentage >= 45) gradeResult = { letter: 'D', gpa: 2.25, color: '#f97316', iconName: 'FiAlertTriangle', description: 'Poor' };
    else if (numPercentage >= 40) gradeResult = { letter: 'E', gpa: 2.00, color: '#f97316', iconName: 'FiAlertTriangle', description: 'Very Poor' };
    else gradeResult = { letter: 'F', gpa: 0.00, color: '#ef4444', iconName: 'FiXCircle', description: 'Fail' };
    return gradeResult;
  };

  // Function to convert GPA to letter grade directly
  const getGradeFromGPA = (gpa) => {
    const numGPA = typeof gpa === 'number' ? gpa : 0;
    let gradeResult;
    if (numGPA >= 4.00) gradeResult = { letter: 'A+', color: '#059669', description: 'Outstanding' };
    else if (numGPA >= 3.75) gradeResult = { letter: 'A', color: '#16a34a', description: 'Excellent' };
    else if (numGPA >= 3.50) gradeResult = { letter: 'A-', color: '#22c55e', description: 'Very Good' };
    else if (numGPA >= 3.25) gradeResult = { letter: 'B+', color: '#3b82f6', description: 'Good' };
    else if (numGPA >= 3.00) gradeResult = { letter: 'B', color: '#6366f1', description: 'Above Average' };
    else if (numGPA >= 2.75) gradeResult = { letter: 'B-', color: '#d97706', description: 'Average' };
    else if (numGPA >= 2.50) gradeResult = { letter: 'C', color: '#f59e0b', description: 'Below Average' };
    else if (numGPA >= 2.25) gradeResult = { letter: 'D', color: '#f97316', description: 'Poor' };
    else if (numGPA >= 2.00) gradeResult = { letter: 'E', color: '#ef4444', description: 'Very Poor' };
    else gradeResult = { letter: 'F', color: '#ef4444', description: 'Fail' };
    return gradeResult;
  };

  // Performance trend visualization component
  const renderProgressChart = (courses) => {
    if (!courses || courses.length === 0) return null;

    // Filter valid percentages (allow negative for copy penalties)
    const validCourses = courses.filter(c =>
      typeof c.percentage === 'number' &&
      !isNaN(c.percentage) &&
      c.percentage >= -100 &&
      c.percentage <= 100
    );

    if (validCourses.length === 0) return null;

    const maxPercentage = Math.max(...validCourses.map(c => c.percentage));
    const avgPercentage = validCourses.reduce((sum, c) => sum + c.percentage, 0) / validCourses.length;
    const roundedMaxPercentage = Math.round(maxPercentage * 100) / 100;
    const roundedAvgPercentage = Math.round(avgPercentage * 100) / 100;
    const avgGradeInfo = getGradeInfo(roundedAvgPercentage);

    return (
      <div style={{
        marginBottom: '2rem',
        padding: '1.5rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        border: '1px solid #e2e8f0'
      }}>
        <h5 style={{ margin: '0 0 1rem 0', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiTrendingUp style={{ color: '#3b82f6' }} /> Performance Trend Analysis</h5>

        {/* Summary Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669' }}>
              {roundedMaxPercentage.toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Highest Score</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {roundedAvgPercentage.toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Average Score</div>
          </div>
          <div style={{ textAlign: 'center', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1d4ed8' }}>
              {getGradeInfo(roundedAvgPercentage).letter}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Average Grade</div>
          </div>
        </div>

        {/* Visual Chart */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(validCourses.length, 8)}, 1fr)`,
          gap: '0.5rem',
          alignItems: 'end',
          height: '150px',
          padding: '1rem',
          background: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          {validCourses.slice(0, 8).map((course, index) => {
            const percentage = Math.round(course.percentage * 100) / 100; // Round for accuracy
            const height = Math.max((percentage / 100) * 120, 2); // Min height 2px, max 120px
            const gradeInfo = getGradeInfo(percentage);

            return (
              <div key={course.courseId || index} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                height: '140px',
                justifyContent: 'flex-end'
              }}>
                <div style={{
                  width: '20px',
                  height: `${height}px`,
                  backgroundColor: gradeInfo.color,
                  borderRadius: '4px 4px 0 0',
                  marginBottom: '0.25rem',
                  transition: 'height 0.8s ease',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '-20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '0.6rem',
                    fontWeight: 'bold',
                    color: gradeInfo.color,
                    whiteSpace: 'nowrap'
                  }}>
                    {percentage.toFixed(0)}%
                  </div>
                </div>
                <div style={{
                  fontSize: '0.6rem',
                  color: '#64748b',
                  textAlign: 'center',
                  transform: 'rotate(-45deg)',
                  transformOrigin: 'center',
                  marginTop: '0.5rem',
                  whiteSpace: 'nowrap',
                  maxWidth: '40px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>
                  {course.courseCode}
                </div>
              </div>
            );
          })}
        </div>

        {courses.length > 8 && (
          <div style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
            Showing first 8 of {courses.length} courses
          </div>
        )}
      </div>
    );
  };

  const renderPerformanceChart = (data, title) => {
    // Safety check for data array
    if (!Array.isArray(data) || data.length === 0) {
      return (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem', color: '#1e293b' }}>{title}</h4>
          <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
            <p>No data available for this chart</p>
          </div>
        </div>
      );
    }

    const maxValue = Math.max(...data.map(item => {
      const percentage = item?.percentage || item?.averagePercentage || 0;
      return typeof percentage === 'number' ? percentage : 0;
    }), 100);

    return (
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', color: '#1e293b' }}>{title}</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {data.map((item, index) => {
            // Safety checks for item properties
            const percentage = typeof (item?.percentage || item?.averagePercentage) === 'number'
              ? (item.percentage || item.averagePercentage)
              : 0;
            const gradeInfo = getGradeInfo(percentage);
            const courseCode = item?.courseCode || item?.assignmentType || `Item ${index + 1}`;
            const courseTitle = item?.courseTitle || item?.name || '';

            return (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '1rem',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0'
              }}>
                <div style={{
                  minWidth: '140px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#1e293b'
                }}>
                  <div>{String(courseCode || '')}</div>
                  {courseTitle && (
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#64748b',
                      fontWeight: '400',
                      marginTop: '0.25rem'
                    }}>
                      {String(courseTitle)}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, position: 'relative' }}>
                  <div style={{
                    width: '100%',
                    height: '40px',
                    background: '#f1f5f9',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    border: '2px solid #e2e8f0'
                  }}>
                    <div style={{
                      width: `${Number(percentage) / maxValue * 100}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${gradeInfo.color}, ${gradeInfo.color}dd)`,
                      borderRadius: '20px',
                      transition: 'width 0.8s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      paddingRight: '16px'
                    }}>
                      <span style={{
                        fontSize: '0.875rem',
                        fontWeight: '700',
                        color: 'white',
                        textShadow: '0 1px 3px rgba(0,0,0,0.7)'
                      }}>
                        {Number(percentage).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{
                  minWidth: '100px',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: gradeInfo.color,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}>
                  <span style={{
                    fontSize: '1.25rem',
                    fontWeight: '700',
                    marginBottom: '0.25rem'
                  }}>
                    {gradeInfo.letter}
                  </span>
                  <span style={{
                    fontSize: '0.75rem',
                    color: '#64748b'
                  }}>
                    GPA: {Number(gradeInfo.gpa).toFixed(2)}
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    color: '#64748b',
                    marginTop: '0.25rem'
                  }}>
                    {gradeInfo.description}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderGradeDistribution = (distribution) => {
    // Safety check for distribution object
    if (!distribution || typeof distribution !== 'object' || Object.keys(distribution).length === 0) {
      return (
        <div style={{ marginBottom: '2rem' }}>
          <h4 style={{ marginBottom: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiBarChart2 style={{ color: '#3b82f6' }} /> Grade Distribution</h4>
          <div style={{
            textAlign: 'center',
            padding: '3rem',
            color: '#64748b',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <FiBarChart2 style={{ fontSize: '3rem', display: 'block', margin: '0 auto 1rem', color: '#94a3b8' }} />
            <h5 style={{ color: '#374151', marginBottom: '0.5rem' }}>No Grade Distribution Available</h5>
            <p style={{ margin: 0, fontSize: '0.875rem' }}>
              Complete more assignments to see your grade distribution analysis.
              {loading && ' Checking for updates...'}
            </p>
            {loading && (
              <div style={{ marginTop: '1rem' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid #e2e8f0',
                  borderTop: '2px solid #3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto'
                }} />
              </div>
            )}
          </div>
        </div>
      );
    }

    const total = Object.values(distribution).reduce((sum, count) => {
      const numCount = typeof count === 'number' ? count : 0;
      return sum + numCount;
    }, 0);

    // Enhanced grade colors and info
    const gradeColors = {
      'A+': { color: '#059669', gpa: '4.00' },
      'A': { color: '#16a34a', gpa: '3.75' },
      'A-': { color: '#22c55e', gpa: '3.50' },
      'B+': { color: '#84cc16', gpa: '3.25' },
      'B': { color: '#a3a3a3', gpa: '3.00' },
      'B-': { color: '#d97706', gpa: '2.75' },
      'C': { color: '#f59e0b', gpa: '2.50' },
      'D': { color: '#f97316', gpa: '2.25' },
      'E': { color: '#ef4444', gpa: '2.00' },
      'F': { color: '#ef4444', gpa: '0.00' }
    };

    return (
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiBarChart2 style={{ color: '#3b82f6' }} /> Grade Distribution</h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: '1rem'
        }}>
          {Object.entries(distribution).map(([grade, count]) => {
            const numCount = typeof count === 'number' ? count : 0;
            const percentage = total > 0 ? (numCount / total * 100) : 0;
            const gradeInfo = gradeColors[grade] || { color: '#64748b', gpa: '0.00' };

            return (
              <div key={grade} style={{
                textAlign: 'center',
                padding: '1.5rem 1rem',
                background: '#ffffff',
                border: '2px solid #e2e8f0',
                borderRadius: '16px',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}>
                <div style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${percentage}%`,
                  background: gradeInfo.color,
                  opacity: 0.15,
                  transition: 'height 0.8s ease'
                }} />
                <div style={{
                  fontSize: '1.75rem',
                  fontWeight: '700',
                  color: gradeInfo.color,
                  marginBottom: '0.5rem',
                  position: 'relative'
                }}>
                  {grade}
                </div>
                <div style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#1e293b',
                  marginBottom: '0.25rem',
                  position: 'relative'
                }}>
                  {numCount}
                </div>
                <div style={{
                  fontSize: '0.75rem',
                  color: '#64748b',
                  marginBottom: '0.25rem',
                  position: 'relative'
                }}>
                  {percentage.toFixed(1)}%
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: '#64748b',
                  position: 'relative'
                }}>
                  GPA: {gradeInfo.gpa}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDetailedCoursePerformance = (performanceTrends) => {
    return (
      <div style={{ marginBottom: '2rem' }}>
        <h4 style={{ marginBottom: '1rem', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiBookOpen style={{ color: '#3b82f6' }} /> Detailed Course Performance</h4>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '1.5rem'
        }}>
          {performanceTrends.map((course, index) => {
            const percentage = course.percentage || course.averagePercentage || 0;
            const gradeInfo = getGradeInfo(percentage);

            return (
              <div key={index} style={{
                padding: '1.5rem',
                background: '#ffffff',
                borderRadius: '16px',
                border: '2px solid #e2e8f0',
                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Grade indicator bar */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: gradeInfo.color
                }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
                    <h5 style={{
                      margin: '0 0 0.5rem 0',
                      color: '#1e293b',
                      fontSize: '1.1rem',
                      fontWeight: '600'
                    }}>
                      {course.courseCode}
                    </h5>
                    <p style={{
                      margin: '0 0 1rem 0',
                      color: '#64748b',
                      fontSize: '0.875rem',
                      lineHeight: '1.4'
                    }}>
                      {course.courseTitle || course.name}
                    </p>
                  </div>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    marginLeft: '1rem'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: gradeInfo.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1.25rem',
                      fontWeight: '700',
                      marginBottom: '0.5rem'
                    }}>
                      {gradeInfo.letter}
                    </div>
                    <div style={{
                      fontSize: '0.75rem',
                      color: '#64748b'
                    }}>
                      GPA: {gradeInfo.gpa.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', color: '#64748b' }}>Performance</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: '700', color: gradeInfo.color }}>
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                  <div style={{
                    width: '100%',
                    height: '8px',
                    background: '#f1f5f9',
                    borderRadius: '4px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${percentage}%`,
                      height: '100%',
                      background: gradeInfo.color,
                      borderRadius: '4px',
                      transition: 'width 0.8s ease'
                    }} />
                  </div>
                </div>

                <div style={{
                  padding: '0.75rem',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  fontSize: '0.75rem',
                  color: '#64748b',
                  textAlign: 'center'
                }}>
                  {gradeInfo.description}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            border: '4px solid #f3f4f6',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Loading performance analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="card-body">
          <div style={{ textAlign: 'center', padding: '3rem', color: '#ef4444' }}>
            <FiAlertTriangle style={{ fontSize: '3rem', display: 'block', margin: '0 auto 1rem', color: '#ef4444' }} />
            <h4>Error Loading Analytics</h4>
            <p style={{ marginBottom: '2rem', color: '#64748b' }}>{error}</p>
            <button
              className="btn btn-primary"
              onClick={fetchAnalytics}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiRefreshCw /> Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="card">
        <div className="card-body">
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            <FiBarChart2 style={{ fontSize: '3rem', display: 'block', margin: '0 auto 1rem', color: '#94a3b8' }} />
            <h4>No Analytics Data</h4>
            <p>No performance data available yet.</p>
          </div>
        </div>
      </div>
    );
  }

  // Safely extract data with defaults
  const performanceTrends = Array.isArray(analytics?.performanceTrends) ? analytics.performanceTrends : [];
  const assignmentTypePerformance = Array.isArray(analytics?.assignmentTypePerformance) ? analytics.assignmentTypePerformance : [];
  const gradeDistribution = analytics?.gradeDistribution && typeof analytics.gradeDistribution === 'object' ? analytics.gradeDistribution : {};
  const overallSummary = analytics?.overallSummary && typeof analytics.overallSummary === 'object' ? analytics.overallSummary : { overallGPA: 0, coursesEnrolled: 0, coursesWithGrades: 0 };
  const insights = analytics?.insights && typeof analytics.insights === 'object' ? analytics.insights : { strengths: [], areasForImprovement: [] };


  return (
    <div style={{ padding: '1rem 0' }}>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      {/* Header */}
      <div style={{ marginBottom: '2rem', textAlign: 'center', position: 'relative' }}>
        <h2 style={{ margin: '0 0 0.5rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><FiBarChart2 style={{ color: '#3b82f6' }} /> Performance Analytics</h2>
        <p style={{ margin: 0, color: '#64748b' }}>
          Comprehensive overview of your academic performance across all courses
        </p>

        {/* Last updated indicator */}
        {lastUpdated && (
          <div style={{
            fontSize: '0.75rem',
            color: '#94a3b8',
            marginTop: '0.5rem',
            fontStyle: 'italic'
          }}>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}

        {/* Refresh Button */}
        <button
          onClick={() => {
            console.log('<FiRefreshCw /> Manual refresh triggered');
            fetchAnalytics();
          }}
          disabled={loading}
          style={{
            position: 'absolute',
            top: '0',
            right: '0',
            padding: '0.5rem 1rem',
            backgroundColor: loading ? '#94a3b8' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '0.875rem',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <span style={{
            display: 'inline-block',
            animation: loading ? 'spin 1s linear infinite' : 'none'
          }}>
            <FiRefreshCw />
          </span>
          {loading ? 'Updating...' : 'Refresh'}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="card">
        <div className="card-header" style={{ padding: 0, border: 'none' }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #e2e8f0' }}>
            {[
              { id: 'overview', label: 'Overall Performance', icon: <FiBarChart2 style={{ marginRight: '0.5rem' }} /> },
              { id: 'courses', label: 'Course Progress', icon: <FiTrendingUp style={{ marginRight: '0.5rem' }} /> },
              { id: 'insights', label: 'Insights & Analysis', icon: <FaLightbulb style={{ marginRight: '0.5rem' }} /> }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '1rem 1.5rem',
                  border: 'none',
                  background: activeTab === tab.id ? '#f8fafc' : 'transparent',
                  color: activeTab === tab.id ? '#3b82f6' : '#64748b',
                  fontWeight: activeTab === tab.id ? '600' : '400',
                  borderBottom: activeTab === tab.id ? '2px solid #3b82f6' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card-body">
          {activeTab === 'overview' && (
            <div>
              {/* Overall Summary */}
              <div style={{
                marginBottom: '2rem',
                padding: '2rem',
                background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
                borderRadius: '16px',
                color: 'white',
                textAlign: 'center'
              }}>
                <h3 style={{ margin: '0 0 1.5rem 0', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}><FaGraduationCap /> Academic Journey Overview</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                  gap: '1.5rem'
                }}>
                  <div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                      {overallSummary.overallGPA.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Current GPA</div>
                    <div style={{ fontSize: '0.75rem', opacity: 0.7, marginTop: '0.25rem' }}>
                      {getGradeFromGPA(overallSummary.overallGPA).letter}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                      {overallSummary.coursesEnrolled}
                    </div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Courses Enrolled</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                      {overallSummary.coursesWithGrades}
                    </div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Courses Graded</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                      {overallSummary.coursesEnrolled > 0
                        ? ((overallSummary.coursesWithGrades / overallSummary.coursesEnrolled) * 100).toFixed(0)
                        : '0'}%
                    </div>
                    <div style={{ fontSize: '0.875rem', opacity: 0.9 }}>Progress Rate</div>
                  </div>
                </div>
              </div>

              {/* Quick Course Performance Overview */}
              {performanceTrends.length > 0 && (
                <div style={{
                  marginBottom: '2rem',
                  padding: '1.5rem',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e2e8f0'
                }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiBarChart2 style={{ color: '#3b82f6' }} /> Course Performance Summary</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    {performanceTrends.slice(0, 6).map((course, index) => {
                      const percentage = typeof course?.percentage === 'number' ? course.percentage : 0;
                      const isCopyPenalty = percentage < 0;
                      const gradeInfo = getGradeInfo(isCopyPenalty ? 0 : percentage); // Use 0 for grade calculation when copy detected
                      const courseCode = String(course?.courseCode || `Course ${index + 1}`);
                      const attendancePercentage = typeof course?.attendancePercentage === 'number' ? course.attendancePercentage : 0;
                      const attendanceMarks = typeof course?.attendanceMarks === 'number' ? course.attendanceMarks : 0;

                      return (
                        <div key={index} style={{
                          padding: '1rem',
                          background: isCopyPenalty ? '#fee2e2' : `${gradeInfo.color}10`,
                          borderRadius: '8px',
                          border: isCopyPenalty ? '2px solid #ef4444' : `2px solid ${gradeInfo.color}30`
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <div>
                              <div style={{ fontWeight: 'bold', color: '#1e293b' }}>{courseCode}</div>
                              <div style={{ fontSize: '0.8rem', color: isCopyPenalty ? '#ef4444' : '#64748b' }}>
                                {isCopyPenalty ? 'Copy Detected' : gradeInfo.description}
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: isCopyPenalty ? '#ef4444' : gradeInfo.color }}>
                                {isCopyPenalty ? 'F' : gradeInfo.letter}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: isCopyPenalty ? '#ef4444' : '#64748b' }}>
                                {percentage.toFixed(1)}%
                              </div>
                            </div>
                          </div>

                          {/* Attendance Information */}
                          <div style={{
                            borderTop: '1px solid #e2e8f0',
                            paddingTop: '0.75rem',
                            fontSize: '0.8rem'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                              <span style={{ color: '#64748b' }}>Attendance:</span>
                              <span style={{
                                fontWeight: 'bold',
                                color: attendancePercentage >= 75 ? '#059669' :
                                  attendancePercentage >= 50 ? '#f59e0b' : '#ef4444'
                              }}>
                                {attendancePercentage.toFixed(1)}%
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: '#64748b' }}>Attendance Marks:</span>
                              <span style={{ fontWeight: 'bold', color: '#374151' }}>
                                {attendanceMarks.toFixed(0)}/30
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {performanceTrends.length > 6 && (
                    <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                      <button
                        onClick={() => setActiveTab('courses')}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#3b82f6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        View All {performanceTrends.length} Courses →
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Quick Insights Summary */}
              {(insights.strengths.length > 0 || insights.areasForImprovement.length > 0) && (
                <div style={{
                  padding: '1.5rem',
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                  border: '1px solid #e2e8f0'
                }}>
                  <h4 style={{ margin: '0 0 1rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaLightbulb style={{ color: '#f59e0b' }} /> Quick Insights</h4>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                    gap: '1rem'
                  }}>
                    {insights.strengths.length > 0 && (
                      <div style={{
                        padding: '1rem',
                        background: '#f0fdf4',
                        borderRadius: '8px',
                        border: '1px solid #22c55e'
                      }}>
                        <h6 style={{ margin: '0 0 0.5rem 0', color: '#15803d' }}>Top Strengths ({insights.strengths.length})</h6>
                        <div style={{ fontSize: '0.875rem', color: '#166534' }}>
                          {insights.strengths.slice(0, 2).map((strength, index) => (
                            <div key={index}>• {String(strength)}</div>
                          ))}
                          {insights.strengths.length > 2 && (
                            <div style={{ fontStyle: 'italic', marginTop: '0.25rem' }}>
                              +{insights.strengths.length - 2} more...
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {insights.areasForImprovement.length > 0 && (
                      <div style={{
                        padding: '1rem',
                        background: '#fef2f2',
                        borderRadius: '8px',
                        border: '1px solid #f59e0b'
                      }}>
                        <h6 style={{ margin: '0 0 0.5rem 0', color: '#d97706' }}>Focus Areas ({insights.areasForImprovement.length})</h6>
                        <div style={{ fontSize: '0.875rem', color: '#b45309' }}>
                          {insights.areasForImprovement.slice(0, 2).map((area, index) => (
                            <div key={index}>• {String(area)}</div>
                          ))}
                          {insights.areasForImprovement.length > 2 && (
                            <div style={{ fontStyle: 'italic', marginTop: '0.25rem' }}>
                              +{insights.areasForImprovement.length - 2} more...
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '1rem' }}>
                    <button
                      onClick={() => setActiveTab('insights')}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#1d4ed8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      View Detailed Analysis →
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'courses' && (
            <div>
              <h4 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiTrendingUp style={{ color: '#3b82f6' }} /> Course Performance Analysis</h4>

              {performanceTrends.length > 0 ? (
                <div>
                  {/* Progress Chart */}
                  {renderProgressChart(performanceTrends)}

                  {/* Course Performance Details */}
                  <div style={{
                    marginBottom: '2rem',
                    padding: '1.5rem',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #e2e8f0'
                  }}>
                    <h5 style={{ margin: '0 0 1rem 0', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiBarChart2 style={{ color: '#3b82f6' }} /> Detailed Course Performance</h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {performanceTrends.map((course, index) => {
                        const percentage = typeof course?.percentage === 'number' ? course.percentage : 0;
                        const isCopyPenalty = percentage < 0;
                        const gradeInfo = getGradeInfo(isCopyPenalty ? 0 : percentage); // Use 0 for grade calculation when copy detected
                        const courseCode = String(course?.courseCode || `Course ${index + 1}`);
                        const courseTitle = String(course?.courseTitle || '');
                        const attendancePercentage = typeof course?.attendancePercentage === 'number' ? course.attendancePercentage : 0;
                        const attendanceMarks = typeof course?.attendanceMarks === 'number' ? course.attendanceMarks : 0;

                        return (
                          <div key={index} style={{
                            padding: '1.5rem',
                            background: isCopyPenalty ? '#fee2e2' : '#f8fafc',
                            borderRadius: '12px',
                            border: isCopyPenalty ? '2px solid #ef4444' : '1px solid #e2e8f0'
                          }}>
                            {/* Course Header */}
                            {isCopyPenalty && (
                              <div style={{
                                padding: '0.5rem 1rem',
                                marginBottom: '1rem',
                                background: '#ef4444',
                                color: 'white',
                                borderRadius: '8px',
                                fontSize: '0.875rem',
                                fontWeight: 'bold',
                                textAlign: 'center'
                              }}>
                                PLAGIARISM DETECTED - FULL PENALTY APPLIED
                              </div>
                            )}
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '1rem',
                              marginBottom: '1rem'
                            }}>
                              <div style={{
                                minWidth: '140px',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: '#1e293b'
                              }}>
                                <div>{courseCode}</div>
                                {courseTitle && (
                                  <div style={{
                                    fontSize: '0.75rem',
                                    color: '#64748b',
                                    fontWeight: '400',
                                    marginTop: '0.25rem'
                                  }}>
                                    {courseTitle}
                                  </div>
                                )}
                              </div>
                              <div style={{ flex: 1, position: 'relative' }}>
                                <div style={{
                                  width: '100%',
                                  height: '40px',
                                  background: '#f1f5f9',
                                  borderRadius: '20px',
                                  overflow: 'hidden',
                                  border: '2px solid #e2e8f0'
                                }}>
                                  <div style={{
                                    width: `${Math.min(Math.max(percentage, 0), 100)}%`,
                                    height: '100%',
                                    background: `linear-gradient(90deg, ${gradeInfo.color}, ${gradeInfo.color}dd)`,
                                    borderRadius: '20px',
                                    transition: 'width 0.8s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    paddingRight: '16px'
                                  }}>
                                    <span style={{
                                      fontSize: '0.75rem',
                                      fontWeight: '700',
                                      color: 'white',
                                      textShadow: '0 1px 3px rgba(0,0,0,0.7)'
                                    }}>
                                      {percentage.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div style={{
                                minWidth: '100px',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                color: gradeInfo.color,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                textAlign: 'center'
                              }}>
                                <span style={{
                                  fontSize: '1.25rem',
                                  fontWeight: '700',
                                  marginBottom: '0.25rem'
                                }}>
                                  {gradeInfo.letter}
                                </span>
                                <span style={{
                                  fontSize: '0.75rem',
                                  color: '#64748b'
                                }}>
                                  GPA: {Number(gradeInfo.gpa).toFixed(2)}
                                </span>
                              </div>
                            </div>

                            {/* Attendance Breakdown */}
                            <div style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                              gap: '1rem',
                              marginTop: '1rem',
                              padding: '1rem',
                              background: 'white',
                              borderRadius: '8px',
                              border: '1px solid #e2e8f0'
                            }}>
                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                                  Attendance Rate
                                </div>
                                <div style={{
                                  fontSize: '1.25rem',
                                  fontWeight: 'bold',
                                  color: attendancePercentage >= 75 ? '#059669' :
                                    attendancePercentage >= 50 ? '#f59e0b' : '#ef4444'
                                }}>
                                  {attendancePercentage.toFixed(1)}%
                                </div>
                              </div>

                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                                  Attendance Marks
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#374151' }}>
                                  {attendanceMarks.toFixed(0)}/30
                                </div>
                              </div>

                              <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                                  Total Score
                                </div>
                                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: gradeInfo.color }}>
                                  {percentage.toFixed(1)}%
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Assignment Type Performance */}
                  {assignmentTypePerformance.length > 0 && (
                    <div style={{
                      padding: '1.5rem',
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                      border: '1px solid #e2e8f0'
                    }}>
                      <h5 style={{ margin: '0 0 1rem 0', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FiFileText style={{ color: '#3b82f6' }} /> Performance by Assignment Type</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        {assignmentTypePerformance.map((type, index) => {
                          // Enhanced validation and precision for assignment type performance
                          const rawAvgPercentage = type?.averagePercentage;
                          const avgPercentage = typeof rawAvgPercentage === 'number' &&
                            !isNaN(rawAvgPercentage) &&
                            rawAvgPercentage >= 0 &&
                            rawAvgPercentage <= 100
                            ? Math.round(rawAvgPercentage * 100) / 100
                            : 0;
                          const gradeInfo = getGradeInfo(avgPercentage);
                          const assignmentType = String(type?.assignmentType || `Type ${index + 1}`);
                          const count = typeof type?.count === 'number' && type.count >= 0 ? type.count : 0;

                          return (
                            <div key={`${assignmentType}-${index}`} style={{
                              padding: '1rem',
                              background: `${gradeInfo.color}10`,
                              borderRadius: '8px',
                              border: `2px solid ${gradeInfo.color}30`,
                              textAlign: 'center'
                            }}>
                              <div style={{ fontSize: '1rem', fontWeight: 'bold', color: '#1e293b', marginBottom: '0.5rem' }}>
                                {assignmentType}
                              </div>
                              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: gradeInfo.color, marginBottom: '0.25rem' }}>
                                {avgPercentage.toFixed(1)}%
                              </div>
                              <div style={{ fontSize: '0.875rem', color: gradeInfo.color, fontWeight: '600' }}>
                                {gradeInfo.letter} Grade
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                                {count} assignment{count !== 1 ? 's' : ''}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <FiBookOpen style={{ fontSize: '3rem', display: 'block', margin: '0 auto 1rem', color: '#94a3b8' }} />
                  <h4>No Course Performance Data</h4>
                  <p>Complete some assignments to see your course performance trends and analysis.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'insights' && (
            <div>
              <h4 style={{ margin: '0 0 1.5rem 0', color: '#1e293b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}><FaLightbulb style={{ color: '#f59e0b' }} /> Performance Insights & Recommendations</h4>

              {/* Detailed Insights */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {insights.strengths.length > 0 && (
                  <div style={{
                    padding: '1.5rem',
                    background: '#f0fdf4',
                    borderRadius: '12px',
                    border: '2px solid #22c55e'
                  }}>
                    <h5 style={{ margin: '0 0 1rem 0', color: '#15803d', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      Your Strengths
                    </h5>
                    <ul style={{ margin: 0, paddingLeft: '1rem', color: '#166534' }}>
                      {insights.strengths.map((strength, index) => (
                        <li key={index} style={{ marginBottom: '0.5rem' }}>{String(strength)}</li>
                      ))}
                    </ul>
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#dcfce7', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.875rem', color: '#15803d', fontWeight: '600' }}>Recommendation:</div>
                      <div style={{ fontSize: '0.8rem', color: '#166534', marginTop: '0.25rem' }}>
                        Keep up the excellent work! These are your strongest areas. Consider helping classmates in these subjects.
                      </div>
                    </div>
                  </div>
                )}

                {insights.areasForImprovement.length > 0 && (
                  <div style={{
                    padding: '1.5rem',
                    background: '#fef2f2',
                    borderRadius: '12px',
                    border: '2px solid #f59e0b'
                  }}>
                    <h5 style={{ margin: '0 0 1rem 0', color: '#d97706', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      Areas for Growth
                    </h5>
                    <ul style={{ margin: 0, paddingLeft: '1rem', color: '#b45309' }}>
                      {insights.areasForImprovement.map((area, index) => (
                        <li key={index} style={{ marginBottom: '0.5rem' }}>{String(area)}</li>
                      ))}
                    </ul>
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#fef3c7', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.875rem', color: '#d97706', fontWeight: '600' }}>Recommendation:</div>
                      <div style={{ fontSize: '0.8rem', color: '#b45309', marginTop: '0.25rem' }}>
                        Focus extra study time on these areas. Consider seeking help from teachers or study groups.
                      </div>
                    </div>
                  </div>
                )}

                {/* Overall Progress Analysis */}
                <div style={{
                  padding: '1.5rem',
                  background: '#f0f9ff',
                  borderRadius: '12px',
                  border: '2px solid #3b82f6'
                }}>
                  <h5 style={{ margin: '0 0 1rem 0', color: '#1d4ed8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    Academic Progress
                  </h5>
                  <div style={{ color: '#1e40af' }}>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <strong>Overall GPA:</strong> {overallSummary.overallGPA.toFixed(2)} / 4.00
                    </div>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <strong>Completion Rate:</strong> {overallSummary.coursesWithGrades}/{overallSummary.coursesEnrolled} courses graded
                    </div>
                    <div style={{ marginBottom: '0.75rem' }}>
                      <strong>Grade Status:</strong> {getGradeFromGPA(overallSummary.overallGPA).letter}
                    </div>
                  </div>
                  <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#dbeafe', borderRadius: '6px' }}>
                    <div style={{ fontSize: '0.875rem', color: '#1d4ed8', fontWeight: '600' }}>Next Steps:</div>
                    <div style={{ fontSize: '0.8rem', color: '#1e40af', marginTop: '0.25rem' }}>
                      {(() => {
                        const gpa = overallSummary.overallGPA;
                        if (gpa >= 3.5) {
                          return "Excellent work! Maintain this high performance and consider challenging yourself with advanced topics.";
                        } else if (gpa >= 3.0) {
                          return "Good progress! Focus on areas for improvement to reach academic excellence.";
                        } else {
                          return "There's room for improvement. Consider creating a study schedule and seeking additional help in challenging subjects.";
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentPerformanceAnalytics;
