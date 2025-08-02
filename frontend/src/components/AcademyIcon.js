import React from 'react';

const AcademyIcon = ({ size = 32, className = "" }) => {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-lg"
      >
        <defs>
          <linearGradient id="bookGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="50%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
          <linearGradient id="spineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#1e3a8a" />
            <stop offset="100%" stopColor="#1e40af" />
          </linearGradient>
          <linearGradient id="pageGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#f8fafc" />
          </linearGradient>
          <linearGradient id="capGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#9333ea" />
          </linearGradient>
        </defs>
        
        {/* Book Shadow */}
        <rect x="10" y="14" width="48" height="40" rx="4" fill="rgba(0,0,0,0.1)" opacity="0.3"/>
        
        {/* Book Base */}
        <rect x="8" y="12" width="48" height="40" rx="4" fill="url(#bookGradient)" stroke="#1e40af" strokeWidth="1"/>
        
        {/* Book Spine */}
        <rect x="8" y="12" width="6" height="40" rx="3" fill="url(#spineGradient)"/>
        
        {/* Spine Details */}
        <line x1="10" y1="18" x2="12" y2="18" stroke="#93c5fd" strokeWidth="0.5"/>
        <line x1="10" y1="22" x2="12" y2="22" stroke="#93c5fd" strokeWidth="0.5"/>
        <line x1="10" y1="42" x2="12" y2="42" stroke="#93c5fd" strokeWidth="0.5"/>
        <line x1="10" y1="46" x2="12" y2="46" stroke="#93c5fd" strokeWidth="0.5"/>
        
        {/* Main Pages */}
        <rect x="16" y="18" width="34" height="28" rx="2" fill="url(#pageGradient)" stroke="#e5e7eb" strokeWidth="1"/>
        
        {/* Page Lines */}
        <line x1="20" y1="24" x2="46" y2="24" stroke="#d1d5db" strokeWidth="1"/>
        <line x1="20" y1="28" x2="44" y2="28" stroke="#d1d5db" strokeWidth="1"/>
        <line x1="20" y1="32" x2="46" y2="32" stroke="#d1d5db" strokeWidth="1"/>
        <line x1="20" y1="36" x2="42" y2="36" stroke="#d1d5db" strokeWidth="1"/>
        <line x1="20" y1="40" x2="45" y2="40" stroke="#d1d5db" strokeWidth="1"/>
        
        {/* Academic Cap */}
        <g transform="translate(42, 8)">
          <polygon points="2,4 10,4 10,6 8,7 4,7 2,6" fill="url(#capGradient)" stroke="#7c2d12" strokeWidth="0.5"/>
          <rect x="3" y="6" width="6" height="1" fill="#7c3aed" opacity="0.8"/>
          <circle cx="9" cy="5.5" r="0.5" fill="#fbbf24"/>
        </g>
        
        {/* Knowledge Symbols */}
        <circle cx="24" cy="26" r="1" fill="#3b82f6" opacity="0.6"/>
        <circle cx="26" cy="30" r="0.5" fill="#8b5cf6" opacity="0.6"/>
        <circle cx="42" cy="34" r="0.8" fill="#10b981" opacity="0.6"/>
        
        {/* Page Corner */}
        <polygon points="46,18 50,18 50,22 46,22" fill="#f3f4f6" stroke="#e5e7eb" strokeWidth="0.5"/>
        <line x1="46" y1="18" x2="50" y2="22" stroke="#e5e7eb" strokeWidth="0.5"/>
        
        {/* Bookmark */}
        <rect x="48" y="12" width="3" height="16" fill="#ef4444" rx="0.5"/>
        <polygon points="48,24 51,24 49.5,27" fill="#dc2626"/>
      </svg>
    </div>
  );
};

export default AcademyIcon;
