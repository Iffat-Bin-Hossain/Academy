import React from 'react';
import Navbar from './Navbar';
import './Layout.css';

const Layout = ({ user, onLogout, children, pageTitle, pageSubtitle }) => {
  return (
    <div className="layout-container">
      {/* Grid Overlay - matching landing page */}
      <div className="layout-grid-overlay"></div>
      
      {/* Navigation */}
      <Navbar user={user} onLogout={onLogout} />
      
      {/* Main Content */}
      <main className="layout-main">
        <div className="layout-content">
          {pageTitle && (
            <div className="page-header">
              <h1 className="page-title">{pageTitle}</h1>
              {pageSubtitle && (
                <p className="page-subtitle">{pageSubtitle}</p>
              )}
            </div>
          )}
          
          <div className="page-content">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
