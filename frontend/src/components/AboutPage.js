import React from 'react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold text-gray-900 text-center">About ACADEMY</h1>
        <p className="mt-4 text-lg text-gray-600 text-center">
          Connecting campuses, building networks.
        </p>

        <div className="mt-12 prose prose-lg text-gray-700 mx-auto">
          <p>
            ACADEMY is a revolutionary platform designed to bridge the gap between students, faculty, and the local community. Our mission is to create a vibrant, interconnected campus ecosystem where information flows freely and opportunities are accessible to everyone.
          </p>
          <p>
            Whether you're a student looking to connect with peers for a study group, a faculty member wanting to share research opportunities, or a local business aiming to engage with the campus community, ACADEMY provides the tools you need to succeed.
          </p>
          <h2>Our Vision</h2>
          <p>
            We envision a world where every student has the resources and connections they need to thrive academically and professionally. By fostering a strong sense of community and collaboration, we believe we can unlock the full potential of every campus.
          </p>
          <h2>Key Features</h2>
          <ul>
            <li><strong>Student & Faculty Profiles:</strong> Create detailed profiles to showcase your skills, interests, and academic achievements.</li>
            <li><strong>Community Hub:</strong> A central place for campus news, events, and announcements.</li>
            <li><strong>Project Collaboration:</strong> Find partners for academic projects, research, or startup ideas.</li>
            <li><strong>Local Opportunities:</strong> Discover internships, part-time jobs, and volunteer opportunities from local businesses and organizations.</li>
            <li><strong>Direct Messaging:</strong> Secure and easy-to-use messaging to connect with others on the platform.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
