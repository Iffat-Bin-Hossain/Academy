import React from 'react';
import { Link } from 'react-router-dom';

const AboutPage = () => {
  return (
    <div style={{ 
      minHeight: '100vh',
      fontFamily: 'Poppins, sans-serif'
    }}>
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
        color: 'white',
        padding: '4rem 2rem',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Grid Overlay */}
        <div style={{
          position: 'absolute',
          inset: '0',
          opacity: '0.15',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`
        }}></div>
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: '10' }}>
          <div style={{
            marginBottom: '2.5rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg viewBox="0 0 24 24" fill="currentColor" style={{
              width: '80px',
              height: '80px',
              color: 'white',
              marginBottom: '1.5rem',
              filter: 'drop-shadow(0 6px 10px rgba(0,0,0,0.2))'
            }}>
              <path d="M12 3L1 9L12 15L21 9V16H23V9L12 3Z" />
              <path d="M5 13.18V17.18C5 17.97 5.53 18.65 6.4 19.2C7.27 19.75 8.55 20 10 20H14C15.45 20 16.73 19.75 17.6 19.2C18.47 18.65 19 17.97 19 17.18V13.18L12 17L5 13.18Z" />
            </svg>
            <p style={{
              color: 'white',
              fontSize: '0.875rem',
              fontWeight: '500',
              letterSpacing: '0.4em',
              marginBottom: '3rem',
              textTransform: 'uppercase',
              margin: '0 0 2rem 0'
            }}>
              EDUCATION REDEFINED
            </p>
          </div>
          <h1 style={{ 
            fontSize: '3rem', 
            fontWeight: '800',
            lineHeight: '1.1',
            marginBottom: '2rem',
            textShadow: '0 4px 8px rgba(0,0,0,0.1)',
            margin: '0 0 2rem 0'
          }}>
            About Academy
          </h1>
          <p style={{ 
            maxWidth: '600px',
            margin: '0 auto 3rem',
            fontSize: '1rem',
            lineHeight: '1.6',
            opacity: '0.9'
          }}>
            Connecting campuses, building networks. ACADEMY is your comprehensive platform for 
            connecting with fellow students, faculty, and academic opportunities while managing 
            your educational journey with intelligent performance analytics.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section style={{ 
        padding: '4rem 2rem', 
        backgroundColor: '#f8fafc' 
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          alignItems: 'center'
        }}>
          <div>
            <h2 style={{ 
              fontSize: '2rem', 
              marginBottom: '1.5rem', 
              color: '#1e40af',
              fontWeight: '700',
              margin: '0 0 1.5rem 0'
            }}>
              Our Mission
            </h2>
            <p style={{ 
              fontSize: '1.1rem', 
              lineHeight: '1.8', 
              color: '#64748b', 
              marginBottom: '1.5rem' 
            }}>
              Academy is designed to revolutionize the educational experience by providing a comprehensive 
              learning management system that bridges the gap between students, teachers, and administrators.
            </p>
            <p style={{ 
              fontSize: '1.1rem', 
              lineHeight: '1.8', 
              color: '#64748b',
              margin: '0'
            }}>
              We believe in making education more accessible, engaging, and data-driven to help every 
              learner reach their full potential through personalized insights and streamlined academic workflows.
            </p>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <div style={{
              width: '200px',
              height: '200px',
              background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '3rem',
              boxShadow: '0 10px 30px rgba(30, 64, 175, 0.3)'
            }}>
              🎓
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ 
            textAlign: 'center', 
            fontSize: '2rem', 
            marginBottom: '3rem', 
            color: '#1e40af',
            fontWeight: '700',
            margin: '0 0 3rem 0'
          }}>
            What Makes Academy Special
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '2rem'
          }}>
            <div style={{
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              backgroundColor: '#f8fafc',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>📊</div>
              <h4 style={{ color: '#1e40af', marginBottom: '1rem', margin: '0 0 1rem 0', fontWeight: '600' }}>Performance Analytics</h4>
              <p style={{ color: '#64748b', lineHeight: '1.6', margin: '0' }}>
                Advanced analytics and insights help students track their progress and identify areas for improvement 
                with real-time GPA calculations and grade distribution analysis.
              </p>
            </div>
            
            <div style={{
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              backgroundColor: '#f8fafc',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎯</div>
              <h4 style={{ color: '#1e40af', marginBottom: '1rem', margin: '0 0 1rem 0', fontWeight: '600' }}>Smart Assignment Management</h4>
              <p style={{ color: '#64748b', lineHeight: '1.6', margin: '0' }}>
                Streamlined assignment creation, submission, and grading with automated plagiarism detection 
                and comprehensive feedback systems.
              </p>
            </div>
            
            <div style={{
              padding: '2rem',
              borderRadius: '12px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              backgroundColor: '#f8fafc',
              textAlign: 'center',
              border: '1px solid #e2e8f0',
              transition: 'all 0.3s ease'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>👥</div>
              <h4 style={{ color: '#1e40af', marginBottom: '1rem', margin: '0 0 1rem 0', fontWeight: '600' }}>Collaborative Learning</h4>
              <p style={{ color: '#64748b', lineHeight: '1.6', margin: '0' }}>
                Interactive discussion forums, real-time notifications, and seamless communication 
                between students and teachers enhance the learning experience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section style={{
        padding: '4rem 2rem',
        background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
        color: 'white',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Grid Overlay */}
        <div style={{
          position: 'absolute',
          inset: '0',
          opacity: '0.15',
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3Cpattern id='grid' width='60' height='60' patternUnits='userSpaceOnUse'%3E%3Cpath d='M 60 0 L 0 0 0 60' fill='none' stroke='%23ffffff' stroke-width='0.5'/%3E%3C/pattern%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grid)'/%3E%3C/svg%3E")`
        }}></div>
        <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: '10' }}>
          <h2 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '800',
            lineHeight: '1.1',
            marginBottom: '1rem',
            textShadow: '0 4px 8px rgba(0,0,0,0.1)',
            margin: '0 0 1rem 0'
          }}>
            Ready to Transform Your Learning Experience?
          </h2>
          <p style={{ 
            fontSize: '1rem', 
            maxWidth: '600px',
            margin: '0 auto 3rem',
            opacity: '0.9',
            lineHeight: '1.6'
          }}>
            Join thousands of students, teachers, and institutions already using Academy to enhance their educational journey.
          </p>
          <div style={{ 
            display: 'flex', 
            gap: '1rem', 
            justifyContent: 'center', 
            flexWrap: 'wrap' 
          }}>
            <Link 
              to="/signup" 
              style={{
                padding: '1rem 2.5rem',
                backgroundColor: 'white',
                color: '#3b82f6',
                textDecoration: 'none',
                borderRadius: '9999px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                transition: 'all 0.3s ease',
                border: '2px solid transparent',
                display: 'inline-block',
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'white';
                e.target.style.borderColor = 'white';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.color = '#3b82f6';
                e.target.style.borderColor = 'transparent';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 14px rgba(0,0,0,0.1)';
              }}
            >
              Get Started Today
            </Link>
            <Link 
              to="/login" 
              style={{
                padding: '1rem 2.5rem',
                backgroundColor: 'transparent',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '9999px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                transition: 'all 0.3s ease',
                border: '2px solid white',
                display: 'inline-block'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = 'white';
                e.target.style.color = '#3b82f6';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = 'white';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        padding: '2rem', 
        backgroundColor: '#1e40af', 
        color: 'white', 
        textAlign: 'center' 
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ margin: '0', opacity: '0.8', fontWeight: '500' }}>
            © 2025 Academy Learning Management System. Connecting campuses, building networks.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default AboutPage;
