# Academy

[![Java](https://img.shields.io/badge/Java-17-orange?logo=openjdk)](https://openjdk.java.net/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2+-brightgreen?logo=springboot)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-18-blue?logo=react)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)](https://postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Containerized-blue?logo=docker)](https://docker.com/)

Modern Learning Management System with course management, assignment grading, plagiarism detection, performance analytics, and AI-powered study assistance.

## Quick Start

```bash
git clone https://github.com/Iffat-Bin-Hossain/Academy.git
cd Academy
chmod +x run-docker.sh
./run-docker.sh start
```

**Access:** Frontend: http://localhost:3000 | Backend: http://localhost:8081  
**Login:** admin@academy.com / admin123


## Features

### User Management
- **Role-based Access Control**: Admin, Teacher, Student roles with specific permissions
- **Registration Workflow**: Admin approval system for new user accounts
- **Profile Management**: User profiles with photo uploads and contact information
- **Authentication**: JWT-based secure login with session management
- **User Sorting**: Users sorted by role (Admin, Teacher, Student) then alphabetically by name

### Course Management
- **Course Creation**: Admin creates courses with codes, titles, and descriptions
- **Teacher Assignment**: Admins assign teachers to courses
- **Student Enrollment**: Students request enrollment, teachers approve
- **Course Dashboard**: Overview of enrolled courses and assignments

### Assignment System
- **Assignment Creation**: Teachers create assignments with deadlines and instructions
- **File Upload Support**: Multiple file types with size limits and validation
- **WYSIWYG Editor**: Rich text editor for assignment descriptions
- **Deadline Management**: Automatic late submission detection and penalties
- **Assignment Types**: Different categories (Quiz, Project, Exam, etc.)

### Grading System
- Real-time grading interface with auto-save
- Automatic grade calculation and GPA
- Copy penalty enforcement for plagiarism
- Bulk grading operations

### Performance Analytics
- GPA calculation with standard academic formula
- Course performance breakdowns
- Performance trends with visual charts
- Real-time data updates

### Attendance System
- Session management by teachers
- Bulk attendance operations
- Attendance reports and analytics

### Plagiarism Detection
- Multi-algorithm analysis (Shingles, Jaccard, AST)
- Support for 15+ file formats
- Similarity reports with confidence scores
- Automatic penalty application

### Communication System
- Direct messaging with file attachments
- Interactive messages with emoji reactions and replies
- Improved message forwarding and file sharing
- Discussion forums with @mention system
- Real-time notifications and cross-tab sync

### Notification System
- Real-time notifications for 20+ event types
- Centralized notification center
- Bulk notification management

### Faculty Feedback
- Anonymous instructor evaluations
- Multi-criteria rating system
- Analytics dashboard for instructors

### AI Integration
- AI study assistant chatbot
- Resource discovery and search
- Educational content curation


## Technology Stack

### Backend
- Spring Boot 3.2.1 with Java 17
- PostgreSQL 15 database
- Spring Security with JWT authentication
- Gradle 8.5 build system

### Frontend
- React 18 with modern UI
- Responsive CSS design
- Real-time messaging interface

### Infrastructure
- Docker containerization
- PostgreSQL with persistent volumes

## Development

### Prerequisites
- Docker 24.0+ and Docker Compose 2.20+

### Quick Start
```bash
./run-docker.sh start    # Start all services
./run-docker.sh stop     # Stop services
./run-docker.sh logs     # View logs
```