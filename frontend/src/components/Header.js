import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

function Header() {
  return (
    <header className="app-header">
      <div className="logo">
        <svg viewBox="0 0 24 24" fill="currentColor" className="logo-icon">
          <path d="M12 3L1 9L12 15L21 9V16H23V9L12 3Z" />
          <path d="M5 13.18V17.18C5 17.97 5.53 18.65 6.4 19.2C7.27 19.75 8.55 20 10 20H14C15.45 20 16.73 19.75 17.6 19.2C18.47 18.65 19 17.97 19 17.18V13.18L12 17L5 13.18Z" />
        </svg>
        <Link to="/" className="logo-text-link">
          ACADEMY
        </Link>
      </div>
      <nav className="header-nav">
        <Link to="/signup" className="btn btn-signup">
          Sign Up
        </Link>
        <Link to="/login" className="btn btn-signin">
          Sign In
        </Link>
      </nav>
    </header>
  );
}

export default Header;
