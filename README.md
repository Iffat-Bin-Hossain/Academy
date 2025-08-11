# Academy - Educational Management System

## 🎯 Overview

A comprehensive educational platform with course management, real-time communication, assignment tracking, attendance monitoring, and collaborative learning tools. Built with modern tech stack and Docker containerization.

## 🛠️ Technology Stack

- **Backend**: Java 21, Spring Boot 3.2+, Spring Security (JWT), PostgreSQL 15
- **Frontend**: React 18, React Router, Axios, CSS3
- **Infrastructure**: Docker Compose, persistent volumes, health checks

## 🌟 Core Features

### 📚 **Academic Management**
- **Course System**: Create, manage, assign teachers, student enrollment workflows
- **Assignment Hub**: Rich assignments with file/URL attachments, due dates, late submissions
- **Attendance Tracking**: Session management, bulk operations, lock/unlock, statistics
- **Resource Library**: File uploads, links, notes with categorization and search
- **Discussion Forums**: Threaded conversations, reactions, student tagging

### 👥 **User Management & Communication**
- **Role-Based Access**: Admin, Teacher, Student with specific permissions
- **Profile Management**: Photo uploads, role-specific editing, persistent storage
- **Real-Time Messaging**: Direct messages, attachments, read receipts, unread counts
- **Notification System**: In-app notifications, email alerts, approval/rejection notices
- **User Approval**: Admin bulk approve/reject, status management

### 📊 **Analytics & Monitoring**
- **Assignment Analytics**: Submission stats, overdue tracking, upcoming deadlines
- **Attendance Reports**: Student summaries, session statistics, visual indicators
- **Resource Metrics**: Download counts, view tracking, usage analytics
- **System Dashboard**: User statistics, course enrollment data, activity monitoring

### 📱 **File & Content Management**
- **Multi-Format Support**: Documents, images, videos with type validation
- **Secure Downloads**: Public/private access, direct file serving
- **Version Control**: File updates, replacement, deletion tracking
- **Bulk Operations**: Multiple file uploads, batch processing
- **Storage Integration**: Docker volumes, configurable paths, backup support

## 🐳 Quick Start

### Prerequisites
- Docker (24.0+), Docker Compose (2.20+), Git

### Setup
```bash
# Clone and start
git clone https://github.com/Iffat-Bin-Hossain/Academy.git
cd Academy
./manage-volumes.sh start  # OR: docker-compose up --build -d

# Access endpoints
# Frontend: http://localhost:3000
# Backend: http://localhost:8080
# Database: localhost:5433
```

### Data Management
```bash
./manage-volumes.sh backup   # Backup volumes
./manage-volumes.sh restore  # Restore data
./manage-volumes.sh info     # Volume status
```

## 🔐 Authentication & Roles

- **JWT Security**: Token-based auth, role authorization, public file access
- **Admin**: Full system control, user management, bulk operations, course oversight
- **Teacher**: Course management, assignments, grading, attendance, messaging
- **Student**: Course participation, submissions, profile management, discussions

## 📱 Key API Endpoints

### **Authentication**
```
POST /api/auth/signup, /api/auth/login
```

### **Academic Operations**
```
# Courses
GET/POST/PUT/DELETE /api/courses
POST /api/courses/enroll, /api/courses/assign

# Assignments
GET/POST/PUT/DELETE /api/assignments
POST /api/assignments/{id}/files
GET /api/assignments/overdue, /api/assignments/upcoming

# Submissions
POST /api/submissions
GET /api/submissions/assignment/{id}
GET /api/submissions/files/{id}/download
```

### **Attendance Management**
```
POST /api/attendance/sessions
PUT /api/attendance/records, /api/attendance/bulk
GET /api/attendance/course/{id}/teacher
```

### **Communication**
```
POST /api/messages/send
GET /api/messages/conversations
GET/POST /api/discussions/threads
POST /api/discussions/posts/{id}/react
```

### **Resources & Files**
```
POST /api/resources/file, /api/resources/link
GET /api/resources/course/{id}
GET /api/files/download/{filename}
POST/DELETE /api/profile/{id}/photo
```

### **Admin Operations**
```
GET /api/admin/pending, /api/admin/users
POST /api/admin/bulk-approve, /api/admin/bulk-reject
PUT /api/admin/users/{id}
```

## � Development

```bash
# Backend
cd backend && ./gradlew bootRun

# Frontend  
cd frontend && npm install && npm start

# Database only
docker-compose up database -d
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/academydb
```

## 📊 Recent Updates (August 2025)

### **Major Features Added**
- **Advanced Attendance**: Bulk operations, session locking, student/teacher views
- **Discussion System**: Threaded forums, post reactions, student tagging
- **Resource Management**: File categorization, search, download tracking
- **Assignment Enhancements**: Multiple file types, URL attachments, deadline management
- **Notification Hub**: Real-time alerts, email integration, system notifications
- **Admin Tools**: Bulk user operations, detailed analytics, system monitoring

### **Technical Improvements**
- **Persistent Storage**: Docker volumes, automated backups, data integrity
- **Security Updates**: Public file access, JWT refinements, CORS optimization
- **Performance**: File caching, bulk operations, optimized queries
- **UI/UX**: Responsive design, loading states, error handling

## 🤝 Contributing

1. Fork → Create feature branch → Test thoroughly → Submit PR
2. Follow Java/React conventions, include tests
3. Update documentation for new features

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Iffat-Bin-Hossain/Academy/issues)  
- **Documentation**: Inline code comments, API docs
- **Troubleshooting**: Check Docker volumes, verify file permissions, review security config

---

**🎓 Modern Educational Platform | Version 2.5.0 | August 2025**

### Security Features
- JWT token-based authentication with role authorization
- Public file access for profile images and downloads
- CORS configuration and secure endpoints

### User Roles
- **Admin**: Full system access, user management, course oversight
- **Teacher**: Course management, assignments, grading, messaging
- **Student**: Course enrollment, submissions, profile management, messaging

## � Core API Endpoints

### Authentication
```
POST /api/auth/signup - User registration
POST /api/auth/login - User login
```

### Courses
```
GET /api/courses - List courses
POST /api/courses - Create course (Admin)
POST /api/courses/enroll - Enroll (Student)
```

### Profile & Files
```
GET/PUT /api/profile/{userId} - Profile management
POST /api/profile/{userId}/photo - Upload photo
GET /api/files/download/profiles/{filename} - Download photo
```

### Messaging
```
POST /api/messages/send - Send message
GET /api/messages/conversations - List conversations
```

## 🔧 Development Setup

```bash
# Backend
cd backend && ./gradlew bootRun

# Frontend
cd frontend && npm install && npm start

# With Docker (database only)
docker-compose up database -d
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/academydb
```

## 📊 Recent Updates (August 2025)

### Latest Changes
- **Profile photo management**: Persistent storage with Docker volumes and configurable paths
- **Security enhancements**: Public file access configuration and JWT authentication refinements
- **File upload improvements**: Fixed hardcoded paths, enhanced error handling
- **Docker optimization**: Volume management scripts, backup/restore automation
- **UI/UX updates**: Profile component improvements, responsive design enhancements

### Technical Highlights
- Configurable file paths using environment variables
- Enhanced SecurityConfig for public endpoints
- Persistent volume implementation for data integrity
- Improved error handling and validation

## 🤝 Contributing

1. Fork repository → Create feature branch → Test changes → Submit PR
2. Follow Java/React conventions and include tests
3. Update documentation for significant changes

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Iffat-Bin-Hossain/Academy/issues)
- **Common fixes**: Check Docker volumes, verify file permissions, review security config

---

**🎓 Educational Management Platform | Version 2.1.0 | August 2025**
