# Academy LMS

A modern full-stack Learning Management System with comprehensive user management, course enrollment, assignment handling, real-time messaging, and notification system. **Fully Dockerized** for instant deployment.

## 🚀 Tech Stack

**Backend**: Spring Boot (Java 17) + PostgreSQL + JWT Security  
**Frontend**: React 19 + Modern CSS + Responsive Design  
**Infrastructure**: Docker Compose + Nginx + Persistent Volumes

## ⚡ Quick Start

### Prerequisites
- Docker and Docker Compose (Latest versions)
- Git for version control

### 🐳 Docker Deployment (Recommended)

```bash
# Clone the repository
git clone <repository-url>
cd Academy

# Start all services
./run-docker.sh start

# Or manually with docker-compose
docker-compose up --build -d
```

**Service URLs**:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Database**: localhost:5433 (PostgreSQL)

### Docker Management Commands
```bash
./run-docker.sh start     # Start all services (default)
./run-docker.sh stop      # Stop all services  
./run-docker.sh restart   # Restart with rebuild
./run-docker.sh logs      # View real-time logs
./run-docker.sh clean     # ⚠️ DANGEROUS: Deletes all data
./run-docker.sh help      # Show usage
```

## 🎯 Key Features

### 🔐 Authentication & User Management
- **JWT-based Authentication**: Secure token-based login system
- **Role-based Access Control**: Admin, Teacher, and Student roles with different permissions
- **Admin Approval System**: New users require admin approval before access
- **Advanced User Search**: Real-time search across names, emails, roles, and status
- **User Status Management**: PENDING, ACTIVE, DISABLED status tracking

### 👨‍💼 Admin Dashboard
- **Complete User Management**: View, approve, reject user registrations
- **Course Management**: Create, assign teachers, manage course catalog
- **Advanced Search & Filtering**: Multi-field search with status filters
- **System Analytics**: Real-time metrics and user statistics
- **Batch Operations**: Mass approval/rejection of users

### 👨‍🏫 Teacher Dashboard
- **Unified Course & Student Management**: Single interface for all teaching activities
- **Assignment Management**: Create assignments with file attachments (PDF, DOC, ZIP, Images - Max 50MB)
- **Student Submission System**: View, download, and evaluate student submissions
- **Submission Status Tracking**: Color-coded On-Time (green), Late (red), Overdue indicators
- **Enrollment Management**: Approve/reject student enrollment and retake requests
- **Advanced Search**: Search courses and students with real-time filtering

### 👨‍🎓 Student Dashboard
- **3-Tab Unified Interface**: Overview, My Courses, Profile sections
- **Course Enrollment System**: Browse, search, and request course enrollment
- **Assignment Submission**: Upload ZIP files with deadline validation
- **Submission History**: Track all submissions with status indicators
- **Retake System**: Request course retakes with teacher approval
- **Course Progress Tracking**: Visual status indicators for enrollment progress

### 💬 Real-time Messaging System ⭐
- **Dropdown Interface**: Clean messaging beside notification bell
- **Role-based Permissions**: Secure messaging based on course relationships
  - Admins ↔ All active users
  - Teachers ↔ Students (enrolled courses only)
  - Students ↔ Teachers (enrolled courses only)
- **File Attachments**: Share images, documents, PDFs with preview
- **Unread Message Badges**: Visual indicators for unread conversations
- **Search Functionality**: Find conversations and users instantly
- **Privacy Protection**: Inactive users shown as "disabled user"

### 📚 Resource Management System
- **Multi-Format Support**: PDF, DOC, PPT, images, videos, code files (Max 50MB)
- **Organization Tools**: Topic/week categorization, tag system
- **Visibility Scheduling**: Set show/hide dates for timed availability
- **Analytics Tracking**: Download counts and view statistics
- **Advanced Search**: Filter by topic, week, type with real-time results

### 🔔 Notification System
**Admin Notifications**:
- New signup requests
- System-level events

**Teacher Notifications**:
- Profile updates by admin
- Course assignments/removals
- Student submissions
- Discussion replies and reactions

**Student Notifications**:
- Academy approval status
- Discussion replies and reactions (enrolled students only)

### 📊 Database & File Management
- **Live Database Exports**: 204+ records across 13 tables in CSV format
- **Persistent File Storage**: Docker volume-based storage with backup
- **File Security**: Access control and validation for all uploads
- **Real-time Analytics**: Live counts and statistics across all dashboards

## 🏗️ Project Architecture

```
Academy/
├── docker-compose.yml          # Multi-container orchestration
├── run-docker.sh              # Docker management script
├── backend/                   # Spring Boot REST API
│   ├── src/main/java/com/example/demo/
│   │   ├── controller/        # REST endpoints
│   │   ├── model/            # JPA entities & DTOs
│   │   ├── repository/       # Data access layer
│   │   ├── service/          # Business logic
│   │   └── config/           # Security & configuration
├── frontend/                  # React SPA
│   ├── src/components/       # React components
│   ├── src/api/             # HTTP client with JWT
│   └── public/              # Static assets
├── database/                 # Live CSV exports (204+ records)
└── data/                    # Sample data files
```

## 🔑 Default Credentials

```
Admin Account:
Email: admin@academy.com
Password: admin123
Role: ADMIN (Full system access)
```

**Sample Data**:
- 27 CSE Courses (Programming to Robotics)
- 109 User Accounts (Students & Teachers)
- 8 Assignments with submissions
- Complete database with relationships

## 🎓 Pre-loaded Course Catalog

```
CSE 100-Level: Programming Fundamentals, Discrete Math, Data Structures I
CSE 200-Level: Digital Logic, Data Structures II, Computer Architecture  
CSE 300-Level: Software Engineering, AI, Machine Learning, Networks
CSE 400-Level: High Performance Computing, Robotics, Pattern Recognition
```

## 💾 Database Management

### Access Database
```bash
# Connect inside Docker container
docker exec -it academy_db psql -U academyuser -d academydb

# Or from host
psql -h localhost -p 5433 -U academyuser -d academydb
```

### Export Data to CSV
```bash
# Export all tables (example for users)
docker exec -it academy_db psql -U academyuser -d academydb -c "\COPY users TO STDOUT WITH CSV HEADER" > database/users_table.csv
```

## 🆕 Recent Updates (August 2025)

### ✅ Messaging System Enhancements
- Fixed unread count calculation per conversation
- Added mark-all-seen endpoint for proper message status
- Improved conversation-specific unread tracking
- Enhanced role-based messaging permissions

### ✅ UI/UX Improvements
- Organized README documentation
- Streamlined feature descriptions
- Updated project architecture overview
- Consolidated repetitive sections

### ✅ Database Optimizations
- Live CSV exports from production database
- Enhanced query performance for message counts
- Better handling of user status transitions
- Improved file attachment management

## 🛠️ Development Setup (Alternative)

### Backend
```bash
cd backend
./gradlew bootRun
```

### Frontend  
```bash
cd frontend
npm install
npm start
```

## 📈 Statistics

- **Total Users**: 109 (Students, Teachers, Admins)
- **Courses Available**: 27 CSE courses
- **Active Assignments**: 8 with file attachments
- **Student Submissions**: 5 with status tracking
- **Database Records**: 204+ across 13 tables
- **File Storage**: Persistent Docker volumes

## 🔒 Security Features

- JWT-based authentication with role validation
- File access control and validation
- Course relationship verification for messaging
- Admin approval workflows
- Secure file upload/download system
- Password hashing and session management

---

**Academy LMS** - A complete learning management solution with modern architecture, comprehensive features, and enterprise-grade security.
