import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
  return (
    <div className="landing-page">
      <div className="grid-overlay"></div>

      <main className="main-content">
        <div className="content-wrapper">
          <div className="logo-container">
            <svg viewBox="0 0 24 24" fill="currentColor" className="graduation-cap-icon">
              <path d="M12 3L1 9L12 15L21 9V16H23V9L12 3Z" />
              <path d="M5 13.18V17.18C5 17.97 5.53 18.65 6.4 19.2C7.27 19.75 8.55 20 10 20H14C15.45 20 16.73 19.75 17.6 19.2C18.47 18.65 19 17.97 19 17.18V13.18L12 17L5 13.18Z" />
            </svg>
            
            <p className="tagline">
              STAY LINKED, STAY LOCAL
            </p>
          </div>
          
          <h1 className="main-heading">
            Connecting campuses,<br />
            building networks.
          </h1>
          
          <p className="main-description">
            ACADEMY is your go-to platform for connecting with fellow students, faculty, and local opportunities. Stay linked to your campus community , fostering relationships and broadening your academic and network.
          </p>
        </div>
      </main>
      
      <div className="learn-more-container">
        <Link to="/about" className="btn btn-learn-more">
          Learn More
        </Link>
      </div>
    </div>
  );
}

export default LandingPage;
