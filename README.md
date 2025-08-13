# Academy - Educational Management System

## 🎯 Overview

A comprehensive educational platform with advanced course management, real-time communication, intelligent plagiarism detection, attendance monitoring, and collaborative learning tools. Built with modern tech stack and Docker containerization for scalable deployment.

## 🛠️ Technology Stack

- **Backend**: Java 21, Spring Boot 3.2+, Spring Security (JWT), PostgreSQL 15
- **Frontend**: React 18, React Router, Axios, CSS3
- **Infrastructure**: Docker Compose, persistent volumes, health checks
- **AI Integration**: Google Gemini API for advanced plagiarism detection

## 🌟 Core Features

### 📚 **Academic Management**
- **Course System**: Create, manage, assign teachers, student enrollment workflows with bulk operations
- **Assignment Hub**: Rich assignments with file/URL attachments, due dates, late submissions, grading system
- **🔍 Smart Plagiarism Checker**: AI-powered similarity detection with configurable thresholds, code diff visualization, and comprehensive reporting
- **Attendance Tracking**: Session management, bulk operations, lock/unlock, statistics with visual progress indicators
- **Resource Library**: File uploads, links, notes with categorization, search, and download tracking
- **Discussion Forums**: Threaded conversations, post reactions, user tagging, and notification integration

### 👥 **User Management & Communication**
- **Role-Based Access**: Admin, Teacher, Student with granular permissions and status management
- **Profile Management**: Photo uploads, role-specific editing, persistent storage with validation
- **Real-Time Messaging**: Direct messages, file attachments, read receipts, unread counts, and conversation history
- **Notification System**: In-app notifications, email alerts, approval/rejection notices with real-time updates
- **User Approval**: Admin bulk approve/reject/disable, status tracking, and audit trail

### 📊 **Analytics & Monitoring**
- **Assignment Analytics**: Submission stats, overdue tracking, upcoming deadlines with visual dashboards
- **Attendance Reports**: Student summaries, session statistics, visual progress indicators, and grade calculations
- **Plagiarism Reports**: Similarity analysis, code comparison, exportable CSV reports, and detection history
- **Resource Metrics**: Download counts, view tracking, usage analytics with categorization
- **Resource Metrics**: Download counts, view tracking, usage analytics
- **System Dashboard**: User statistics, course enrollment data, activity monitoring

- **System Dashboard**: User statistics, course enrollment data, activity monitoring, and cross-tab synchronization

### 📱 **File & Content Management**
- **Multi-Format Support**: Documents, images, videos, code files (cpp, java, py, js, etc.), archives with intelligent processing
- **Secure Downloads**: Public/private access, direct file serving with authentication checks
- **Plagiarism Analysis**: Binary file hashing, code normalization, archive extraction, and content comparison
- **Version Control**: File updates, replacement, deletion tracking with audit logs  
- **Bulk Operations**: Multiple file uploads, batch processing, and ZIP archive handling
- **Storage Integration**: Docker volumes, configurable paths, backup support with persistent data

### 🔧 **Advanced Features**
- **Multi-Tab Synchronization**: Real-time data sync across browser tabs with event broadcasting
- **Cross-Role Navigation**: Smart routing based on user roles with permission-aware UI components
- **Bulk Operations**: User management, enrollment decisions, file operations with progress tracking
- **Search & Filtering**: Global search, advanced filters, sorting across all major entities
- **Responsive Design**: Mobile-friendly interface with touch-optimized controls and adaptive layouts
- **Error Handling**: Comprehensive error boundaries, graceful degradation, and user-friendly error messages

## 🏗️ Architecture

### **Backend Architecture**
```
┌─────────────────────────────────────────────────────────────┐
│                    Spring Boot Application                   │
├─────────────────────────────────────────────────────────────┤
│  Controllers (REST API)                                    │
│  ├─── UserController, CourseController, AssignmentController │
│  ├─── NotificationController, MessageController             │
│  ├─── PlagiarismController, AttendanceController           │
│  └─── DiscussionController, ResourceController             │
├─────────────────────────────────────────────────────────────┤
│  Services (Business Logic)                                 │
│  ├─── UserService, CourseService, AssignmentService        │
│  ├─── NotificationService, EmailService                    │
│  ├─── PlagiarismService, AttendanceService                 │
│  └─── DiscussionService, FileService                       │
├─────────────────────────────────────────────────────────────┤
│  Repositories (Data Access)                                │
│  ├─── JPA Repositories with custom queries                 │
│  ├─── Transaction management                               │
│  └─── Database optimization                                │
├─────────────────────────────────────────────────────────────┤
│  Security Layer                                            │
│  ├─── JWT Authentication                                   │
│  ├─── Role-based authorization                             │
│  └─── CORS configuration                                   │
└─────────────────────────────────────────────────────────────┘
```

### **Frontend Architecture**  
```
┌─────────────────────────────────────────────────────────────┐
│                    React Application                        │
├─────────────────────────────────────────────────────────────┤
│  Pages & Routing                                           │
│  ├─── Role-based dashboards (Admin/Teacher/Student)        │
│  ├─── Course management pages                              │
│  ├─── Assignment & plagiarism checking                     │
│  └─── Communication & notification centers                 │
├─────────────────────────────────────────────────────────────┤
│  Components                                                 │
│  ├─── Reusable UI components                              │
│  ├─── Form handling & validation                          │
│  ├─── Data visualization & charts                         │
│  └─── Real-time messaging components                      │
├─────────────────────────────────────────────────────────────┤
│  State Management                                          │
│  ├─── Local state with hooks                              │
│  ├─── Context for global state                            │
│  └─── Cross-tab synchronization                           │
├─────────────────────────────────────────────────────────────┤
│  API Layer                                                 │
│  ├─── Axios interceptors                                  │
│  ├─── Authentication handling                             │
│  └─── Error management                                    │
└─────────────────────────────────────────────────────────────┘
```

## � Quick Start

### **Prerequisites**
- Docker 24.0+ and Docker Compose 2.20+
- Git for version control
- 8GB+ RAM recommended

### **One-Click Setup**
```bash
# Clone and start the entire platform
git clone https://github.com/Iffat-Bin-Hossain/Academy.git
cd Academy
./run-docker.sh start
```

### **Access Points**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080  
- **Database**: localhost:5433 (PostgreSQL)

### **Default Admin Credentials**
- **Email**: admin@academy.com
- **Password**: admin123

### **Available Commands**
```bash
./run-docker.sh start      # Start all services
./run-docker.sh stop       # Stop all services  
./run-docker.sh restart    # Restart with latest changes
./run-docker.sh logs       # View real-time logs
./run-docker.sh clean      # Clean rebuild (⚠️ removes data)
./run-docker.sh help       # Show all commands
```

## 📋 Feature Breakdown

### **🔍 Smart Plagiarism Detection System**
- **Multi-Algorithm Analysis**: Shingles-based similarity, Jaccard coefficient, line-by-line comparison
- **AI-Powered Detection**: Google Gemini integration for detecting variable renaming and light obfuscation  
- **File Format Support**: Source code (.cpp, .java, .py, .js, etc.), documents, archives (.zip, .rar)
- **Visual Code Comparison**: Side-by-side diff with syntax highlighting and similarity indicators
- **Configurable Settings**: Similarity thresholds (30-95%), file type filters, AI toggle
- **Comprehensive Reports**: CSV export, detection methods, confidence scores, analysis metadata
- **Real-time Progress**: Live analysis updates with stage tracking and progress visualization

### **📊 Assignment Management System**
- **Rich Content Editor**: WYSIWYG editor with formatting, links, and embedded media
- **Multi-File Attachments**: Documents, images, code files with size validation and type checking
- **Flexible Deadlines**: Primary deadlines, late submission windows, automatic status updates
- **Submission Tracking**: Real-time status updates, submission history, resubmission handling
- **Grading Integration**: Marks assignment, feedback system, grade distribution analytics
- **Bulk Operations**: Mass assignment creation, deadline extensions, status updates

### **🏫 Attendance Management System**
- **Session Creation**: Flexible scheduling with custom titles, descriptions, and time slots
- **Multiple Marking Methods**: Manual entry, QR codes, time-based auto-marking
- **Status Categories**: Present, Absent, Late, Excused with color-coded indicators
- **Bulk Operations**: Mass status updates, session cloning, enrollment synchronization
- **Analytics Dashboard**: Attendance percentages, grade calculations, trend analysis
- **Session Locking**: Prevent modifications after completion with audit trail
- **Student Portal**: Personal attendance view, progress tracking, improvement suggestions

### **💬 Discussion & Communication Hub**  
- **Threaded Discussions**: Nested conversations with topic categorization and pinning
- **User Tagging**: @mention system with real-time notifications and smart suggestions
- **Post Reactions**: Like, dislike, emoji reactions with reaction summaries  
- **File Attachments**: Images, documents, code snippets with inline previews
- **Real-time Updates**: Live message delivery, typing indicators, online status
- **Message History**: Conversation search, message editing, deletion with moderation tools
- **Cross-Role Messaging**: Teacher-student, peer-to-peer, admin broadcasts

### **📚 Resource Management System**
- **Content Organization**: Topic-based categorization, week-based sorting, type filtering
- **Multi-Format Support**: PDFs, videos, presentations, code samples, external links
- **Access Control**: Role-based permissions, private/public resources, download restrictions  
- **Search & Discovery**: Full-text search, tag-based filtering, recently added highlights
- **Usage Analytics**: Download counters, view tracking, popular resource identification
- **Version Management**: Resource updates, change tracking, backup retention

### **👥 User Management & Administration**
- **Role Hierarchy**: Admin, Teacher, Student with granular permission matrices
- **Account Lifecycle**: Registration, approval workflow, status management (Active/Pending/Disabled/Rejected)
- **Bulk Operations**: Mass approve/reject/disable, CSV export, batch notifications
- **Profile Management**: Photo uploads, contact information, academic details with validation
- **Security Features**: Password policies, session management, audit logging
- **Cross-Tab Sync**: Real-time data synchronization across browser sessions

### **🔔 Notification & Email System**
- **Real-time Notifications**: In-app alerts, badge counters, dropdown notifications
- **Email Integration**: SMTP configuration, HTML templates, fallback logging
- **Event Triggers**: User registrations, course enrollments, assignment submissions, discussion activity
- **Notification Types**: System alerts, academic updates, administrative notices, personal messages  
- **User Preferences**: Notification settings, email subscriptions, frequency controls
- **Delivery Status**: Read receipts, delivery confirmation, retry mechanisms

## 🔧 Development Setup

### **Manual Development (Without Docker)**

#### **Backend Setup**
```bash
cd backend
# Configure database in application.properties
./gradlew bootRun
# API available at http://localhost:8080
```

#### **Frontend Setup** 
```bash
cd frontend
npm install
npm start  
# UI available at http://localhost:3000
```

### **Database Configuration**
```properties
# application.properties
spring.datasource.url=jdbc:postgresql://localhost:5432/academy
spring.datasource.username=postgres
spring.datasource.password=your_password
spring.jpa.hibernate.ddl-auto=update
```

### **Environment Variables**
```bash
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# AI Integration
GOOGLE_GEMINI_API_KEY=your-gemini-api-key

# File Storage
FILE_UPLOAD_PATH=/app/uploads
MAX_FILE_SIZE=10MB
```

## 📊 Recent Updates (August 2025)

### **Major Features Added**
- **🔍 Smart Plagiarism Checker**: AI-powered similarity detection with Google Gemini integration
- **📊 Enhanced Analytics**: Assignment statistics, attendance reports, usage metrics with visual dashboards
- **🔄 Cross-Tab Synchronization**: Real-time data sync across browser tabs and sessions
- **📱 Mobile Optimization**: Responsive design improvements, touch-friendly interfaces
- **🔐 Advanced Security**: Enhanced JWT handling, role-based routing, CORS optimization
- **📧 Email System**: SMTP integration, HTML templates, notification delivery tracking

### **Technical Improvements**
- **🗃️ Persistent Storage**: Docker volumes, automated backups, data integrity checks
- **⚡ Performance**: File caching, bulk operations, optimized database queries
- **🛡️ Security Updates**: Public file access controls, JWT refinements, input validation
- **🎨 UI/UX**: Loading states, error boundaries, accessibility improvements, modern design patterns
- **🔧 Code Quality**: Comprehensive error handling, logging improvements, test coverage

### **Bug Fixes & Optimizations**
- **🐛 File Upload**: Fixed large file handling, improved progress tracking
- **📝 Assignment Submission**: Enhanced deadline management, late submission handling  
- **🔔 Notifications**: Real-time delivery improvements, duplicate prevention
- **👥 User Management**: Bulk operation optimizations, status transition handling
- **📊 Dashboard Performance**: Lazy loading, data caching, reduced API calls

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

### **Development Guidelines**
1. **Fork the repository** → Create feature branch → Test thoroughly → Submit PR
2. **Code Standards**: Follow Java/React conventions, maintain consistent formatting
3. **Testing**: Include unit tests for new features, ensure existing tests pass
4. **Documentation**: Update README and code comments for new functionality
5. **Security**: Follow security best practices, validate all inputs

### **Commit Message Format**
```bash
feat: add plagiarism detection with AI integration
fix: resolve file upload timeout issues  
docs: update API documentation
style: improve responsive design on mobile
refactor: optimize database queries
test: add unit tests for notification system
```

### **Pull Request Process**
- Ensure branch is up-to-date with main
- Include screenshots for UI changes
- Add relevant tests and documentation
- Request review from maintainers
- Address feedback promptly

## � License

**MIT License** - See [LICENSE](LICENSE) file for details.

```
Copyright (c) 2024 Academy Platform

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## �📞 Support & Community

### **Getting Help**
- 📧 **Email Support**: support@academy-platform.com
- 💬 **Discord Community**: [Join our Discord](https://discord.gg/academy-platform)
- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/Iffat-Bin-Hossain/Academy/issues)
- 📖 **Documentation**: [Wiki Pages](https://github.com/Iffat-Bin-Hossain/Academy/wiki)

### **Roadmap & Future Features**
- 🎥 **Video Conferencing**: Integrated live classes with recording
- 📱 **Mobile App**: Native iOS/Android applications  
- 🤖 **AI Teaching Assistant**: Automated grading and feedback
- 📈 **Advanced Analytics**: Machine learning insights and predictions
- 🌐 **Multi-Language**: Internationalization and localization support
- ☁️ **Cloud Integration**: AWS/Azure deployment options

### **Community Stats**
- ⭐ **GitHub Stars**: Growing open-source community
- 👥 **Active Users**: Educational institutions worldwide
- 🔧 **Contributors**: Developers from 15+ countries  
- 📦 **Releases**: Regular updates with new features

---

<div align="center">

**🚀 Built with ❤️ for Education**

*Empowering institutions with modern learning management*

**[⭐ Star us on GitHub](https://github.com/Iffat-Bin-Hossain/Academy) | [📖 View Documentation](https://github.com/Iffat-Bin-Hossain/Academy/wiki) | [🤝 Contribute](CONTRIBUTING.md)**

</div>
