# Academy

A comprehensive full-stack web application for academy management with complete user authentication, role-based dashboards, course management, enrollment system, and assignment file upload/download functionality. **Fully Dockerized** for easy deployment and development.

## 🎨 Design Features

- **Modern Branding**: Blue gradient backgrounds with "academy" branding
- **Curved Logo Design**: "ACADEMY" text curved in an arc above a graduation cap icon
- **Grid Overlay**: Subtle grid pattern for visual sophistication  
- **Tagline**: "STAY LINKED, STAY LOCAL" in italic styling
- **Glass Morphism**: Semi-transparent cards with backdrop blur effects
- **Responsive Design**: Mobile-first approach with modern UI components
- **Dark Theme Support**: Elegant dark color schemes with proper contrast

## 🚀 Tech Stack

### Backend
- **Spring Boot** (Java 17) - REST API server
- **Spring Security** - JWT-based authentication and authorization
- **JPA/Hibernate** - Database ORM with entity relationships
- **PostgreSQL** - Production database with full ACID compliance
- **Lombok** - Code generation and boilerplate reduction
- **Jakarta Validation** - Input validation and constraints
- **File Upload System** - Persistent file storage with download functionality
- **Docker** - Containerized deployment
- **Port**: 8080

### Frontend  
- **React 19** (JavaScript) - Modern UI framework with hooks
- **Axios** - HTTP client with interceptors for API calls
- **React Router** - Client-side routing and navigation
- **JWT Decode** - Token parsing and role extraction
- **Custom CSS** - Modern styling with CSS Grid and Flexbox
- **React Icons** - Icon library for UI elements
- **Docker** - Containerized deployment with Nginx
- **Port**: 3000

### Infrastructure
- **Docker Compose** - Multi-container orchestration
- **PostgreSQL** - Persistent database storage
- **Docker Volumes** - Persistent file storage for uploads
- **Nginx** - Production-ready frontend serving

## 🛠️ Setup & Installation

### Prerequisites
- **Docker** and **Docker Compose** (Latest versions)
- **Git** for version control

### 🐳 Docker Setup (Recommended)

#### Quick Start
```bash
# Clone the repository
git clone <repository-url>
cd Academy

# Start all services
./run-docker.sh start

# Or manually with docker-compose
docker-compose up --build -d
```

#### Available Commands
```bash
./run-docker.sh start     # Start all services (default)
./run-docker.sh stop      # Stop all services  
./run-docker.sh restart   # Restart with rebuild
./run-docker.sh logs      # View real-time logs
./run-docker.sh clean     # ⚠️ DANGEROUS: Deletes all data
./run-docker.sh help      # Show usage
```

#### Service URLs
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Database**: localhost:5433 (PostgreSQL)

### 💾 Database Access
```bash
# Connect to database inside Docker container
docker exec -it academy_db psql -U academyuser -d academydb

# Or connect from host
psql -h localhost -p 5433 -U academyuser -d academydb
```

### 📁 File Storage
- **Upload Directory**: `/app/data/uploads` (inside backend container)
- **Persistent Storage**: Docker volume `academy_uploads`
- **Supported Files**: PDF, DOC, TXT, ZIP, Images, Code files (Max 50MB each)

### 🔧 Development Setup (Alternative)

#### Backend Setup
```bash
cd backend
./gradlew bootRun
```
*The backend will start on http://localhost:8080*

#### Frontend Setup
```bash
cd frontend
npm install
npm start
```
*The frontend will start on http://localhost:3000*

### Database
- Uses **PostgreSQL** in Docker container for production data storage
- **Container**: `academy_db` on port 5433
- Database name: `academydb`
- Username: `academyuser`, Password: `academy123`
- **Persistent Storage**: Docker volume `postgres_data`
- **Enrollment Status Management**: Proper enum handling for PENDING, APPROVED, REJECTED, RETAKING
- **Timestamp Tracking**: enrolledAt and decisionAt fields for audit trails

## 📱 Complete Feature Set

### 🔐 Authentication & Authorization
- **User Registration**: Email-based signup with role selection (STUDENT/TEACHER)
- **JWT Authentication**: Secure token-based authentication system
- **Role-based Access Control**: Different permissions for Admin, Teacher, and Student
- **Admin Approval System**: New users require admin approval before access
- **Auto-login**: Persistent sessions with token validation
- **Secure Logout**: Token cleanup and session termination

### 👨‍💼 Admin Dashboard Features
- **User Management**: View, approve, and reject pending user registrations
- **Course Management**: Create, view, update, and delete courses
- **System Statistics**: Real-time metrics and user analytics
- **Batch Operations**: Mass approval/rejection of users
- **Admin Controls**: Complete system oversight and configuration
- **Data Export**: User and course data management

### 👨‍🏫 Teacher Dashboard Features
- **Unified Course & Student Management**: Single interface combining course and student management
- **Assignment Management**: Create, edit, and delete assignments with file attachments
- **File Upload System**: Support for PDF, DOC, TXT, ZIP, Images, and Code files (Max 50MB each)
- **Assignment File Downloads**: Persistent file storage with download functionality
- **Student Submission Management**: View all student submissions for assignments with status tracking
- **Submission Status Monitoring**: Color-coded indicators for On-Time (green), Late (red), and Overdue submissions
- **Submission Download System**: Download student-submitted ZIP files for evaluation
- **Submission Statistics**: Real-time counts of total, on-time, and late submissions per assignment
- **Assignment Deadline Enforcement**: Automatic deadline validation preventing late submissions when not allowed
- **Smart Search System**: Search courses by name/code and students by name across all courses
- **Real-time Student Statistics**: Live counts of Active, Pending, and Retaking students per course
- **Inline Student Management**: Approve/reject enrollment requests directly from course cards
- **Retake Request Management**: Teachers can approve or deny student retake requests
- **Course Assignment View**: See all courses assigned by administrators
- **Student Status Tracking**: Visual indicators for PENDING (yellow), APPROVED (green), RETAKING (red), REJECTED (red)
- **Enrollment Decision Making**: Approve/reject initial enrollment and retake requests
- **Live Data Updates**: Real-time refresh of enrollment data after decisions

### 👨‍🎓 Student Dashboard Features
- **Unified Course & Enrollment Interface**: 3-tab consolidated dashboard (Overview, My Courses, Profile)
- **Smart Search & Filter System**: Search courses by title, code, or teacher name with real-time filtering
- **Course Enrollment Workflow**: Request enrollment with teacher approval system
- **My Courses Management**: View all courses with status-based organization
- **Assignment View**: Access and download assignment files from enrolled courses
- **Assignment File Downloads**: Download PDF, DOC, TXT, ZIP, Images, and Code files
- **Assignment Submission System**: Upload ZIP files for assignment submissions with deadline validation
- **Submission Status Tracking**: Visual indicators for On-Time (green), Late (red), and Overdue submissions
- **Deadline Management**: Automatic deadline checking with late submission prevention
- **ZIP-Only File Restriction**: Enforced ZIP file format for all assignment submissions (50MB max)
- **Submission History**: View all submitted assignments with status and timestamps
- **Retake Course System**: Custom modal-based retake request with teacher approval
- **Enrollment Status Tracking**: Visual status indicators (PENDING, APPROVED, REJECTED, RETAKING)
- **Course Progress View**: Track enrollment history and current status
- **Interactive Course Cards**: Detailed course information with enrollment actions
- **Real-time Updates**: Live status updates without page refresh
- **Professional UI**: Modern design with color-coded status system

### 📚 Course Management System
- **Admin Course Creation**: Create courses with title, code, description, and teacher assignment
- **Teacher Assignment System**: Admin assigns specific teachers to courses
- **Advanced Enrollment Workflow**: 
  - Student enrollment requests → Teacher approval → Course access
  - Retake system: Student retake request → Teacher approval/denial
- **Enrollment Status Management**: PENDING, APPROVED, REJECTED, RETAKING status tracking
- **Course-Student Relationship**: Complete enrollment tracking with timestamps
- **Search & Discovery**: Students can search and filter available courses
- **Real-time Enrollment Data**: Live updates of student counts and status changes
- **Database Constraint Management**: Proper handling of enrollment status transitions

### 🎯 Advanced Features
- **Real-time Search Systems**: Instant filtering across courses and students
- **Assignment Management System**: Complete file upload/download with persistent storage
- **Student Submission System**: ZIP-only file uploads with deadline validation and status tracking
- **Submission Status Management**: Automatic On-Time/Late/Overdue status calculation with color coding
- **Teacher Submission Review**: Complete submission viewing, downloading, and evaluation interface
- **File Upload Security**: Validation for file types, size limits (50MB), and proper storage
- **ZIP File Enforcement**: Students can only submit ZIP files for assignment submissions
- **Deadline Validation**: Automatic prevention of submissions after deadlines (unless late submissions allowed)
- **Persistent File Storage**: Docker volume-based storage that survives container restarts
- **Teacher-Specific Assignment Filtering**: Teachers see only their own assignments
- **Custom Modal Systems**: Professional retake confirmation dialogs replacing browser alerts
- **Status-based Visual Design**: Color-coded enrollment statuses with proper UI feedback
- **Unified Dashboard Design**: Consolidated interfaces reducing complexity
- **Dynamic Statistics**: Live-updating counts and metrics across all dashboards
- **Database Constraint Handling**: Proper PostgreSQL enum management for enrollment statuses
- **Responsive Layout Design**: Mobile-optimized interfaces with modern grid systems
- **Professional UI Components**: Glass morphism effects, gradient backgrounds, modern typography
- **Error Handling & Feedback**: Comprehensive user notifications and error management
- **Token-based Security**: JWT authentication with role-based access control
- **Docker Integration**: Fully containerized deployment with persistent volumes

### 🔑 Default Credentials (Auto-generated)
```
Admin Account:
Email: admin@academy.com
Password: admin123
Role: ADMIN (Full system access)

Test Accounts:
- Teachers and Students must register and await admin approval
- Admin can approve/reject registrations from the dashboard
- Sample student data available in student.txt file
```

## 🎯 Project Architecture

```
academy/
├── docker-compose.yml          # Multi-container orchestration
├── run-docker.sh              # Docker management script
├── backend/                   # Spring Boot REST API
│   ├── Dockerfile            # Backend container configuration
│   ├── src/main/java/
│   │   └── com/example/demo/
│   │       ├── config/         # Security, CORS, JWT configuration
│   │       ├── controller/     # REST API endpoints
│   │       │   ├── AuthController.java     # Authentication endpoints
│   │       │   ├── CourseController.java   # Course & enrollment management
│   │       │   ├── AdminController.java    # Admin-specific operations
│   │       │   ├── UserController.java     # User profile management
│   │       │   ├── AssignmentController.java # Assignment & file management
│   │       │   └── StudentSubmissionController.java # Student submission management
│   │       ├── model/          # JPA entities and DTOs
│   │       │   ├── User.java              # User entity with roles
│   │       │   ├── Course.java            # Course entity
│   │       │   ├── CourseEnrollment.java  # Enrollment with status tracking
│   │       │   ├── Assignment.java        # Assignment entity
│   │       │   ├── AssignmentFile.java    # File attachment entity
│   │       │   ├── StudentSubmission.java # Student submission entity
│   │       │   ├── SubmissionFile.java    # Submission file attachment entity
│   │       │   ├── StudentSubmissionRequest.java # Submission request DTO
│   │       │   ├── StudentSubmissionResponse.java # Submission response DTO
│   │       │   ├── SubmissionFileResponse.java # Submission file response DTO
│   │       │   └── EnrollmentStatus.java  # Enum: PENDING, APPROVED, REJECTED, RETAKING
│   │       ├── repository/     # Data access layer
│   │       │   ├── UserRepository.java
│   │       │   ├── CourseRepository.java
│   │       │   ├── CourseEnrollmentRepository.java
│   │       │   ├── AssignmentRepository.java
│   │       │   ├── AssignmentFileRepository.java
│   │       │   ├── StudentSubmissionRepository.java
│   │       │   └── SubmissionFileRepository.java
│   │       └── service/        # Business logic layer
│   │           ├── AuthService.java          # Authentication logic
│   │           ├── CourseService.java        # Course & enrollment business logic
│   │           ├── AdminService.java         # Admin operations
│   │           ├── AssignmentService.java    # Assignment management
│   │           ├── AssignmentFileService.java # File upload/download logic
│   │           └── StudentSubmissionService.java # Submission management with ZIP validation
│   ├── src/main/resources/
│   │   └── application.properties  # PostgreSQL and server config
│   └── build.gradle           # Dependencies and build config
├── frontend/                  # React SPA
│   ├── Dockerfile            # Frontend container configuration
│   ├── nginx.conf            # Nginx configuration for production
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Login.js       # Authentication component
│   │   │   ├── Signup.js      # User registration
│   │   │   ├── ModernAdminDashboard.js    # Admin interface
│   │   │   ├── ModernTeacherDashboard.js  # Unified teacher interface with search
│   │   │   ├── ModernStudentDashboard.js  # 3-tab student interface with submission system
│   │   │   ├── StudentCourseDetailsPage.js # Student course view with submission modal
│   │   │   ├── AssignmentManagement.js    # Teacher assignment management with submission viewing
│   │   │   ├── Layout.js      # Common layout wrapper
│   │   │   └── ProtectedRoute.js  # Route protection component
│   │   ├── api/
│   │   │   └── axiosInstance.js  # HTTP client with JWT interceptors
│   │   ├── utils/
│   │   │   └── auth.js        # Authentication utilities
│   │   └── App.js             # Main application with routing
│   ├── public/                # Static assets
│   └── package.json           # Dependencies and scripts
├── data/                      # Sample data files
│   ├── courses.txt           # Sample course data
│   ├── student.txt           # Sample student data
│   └── teacher.txt           # Sample teacher data
├── Miscellaneous/
│   └── DB Commands.txt       # Database management commands
├── README.md                  # Project documentation
└── .gitignore                # Version control exclusions
```

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration (STUDENT/TEACHER)
- `POST /api/auth/login` - User authentication
- `GET /api/test` - API health check

### Admin Endpoints
- `GET /api/admin/pending` - Get pending user approvals
- `POST /api/admin/approve/{id}` - Approve user registration
- `POST /api/admin/reject/{id}` - Reject user registration

### Course Management
- `GET /api/courses` - List all courses
- `POST /api/courses` - Create new course (ADMIN only)
- `PUT /api/courses/{id}` - Update course (ADMIN only)
- `DELETE /api/courses/{id}` - Delete course (ADMIN only)
- `POST /api/courses/assign` - Assign teacher to course (ADMIN only)

### Enrollment System
- `POST /api/courses/enroll` - Request course enrollment (STUDENT)
- `GET /api/courses/{id}/pending` - Get pending enrollments (TEACHER)
- `POST /api/courses/decide` - Approve/reject enrollment requests (TEACHER)
- `GET /api/courses/student/{id}` - Get student's enrolled courses with all statuses
- `GET /api/courses/teacher/{id}` - Get teacher's assigned courses
- `GET /api/courses/{id}/enrollments` - Get all enrollments for a specific course
- `POST /api/courses/retake` - Submit retake request (STUDENT)
- `GET /api/user/me` - Get current user information for dashboard personalization

### Assignment & File Management
- `POST /api/assignments` - Create new assignment with teacher ID (TEACHER)
- `GET /api/assignments/teacher/{id}` - Get all assignments for a specific teacher
- `GET /api/assignments/course/{courseId}/teacher/{teacherId}` - Get course assignments for teacher
- `GET /api/assignments/teacher/{id}/stats` - Get assignment statistics for teacher dashboard
- `PUT /api/assignments/{id}` - Update assignment (TEACHER)
- `DELETE /api/assignments/{id}` - Delete assignment (TEACHER)
- `POST /api/assignments/{id}/files` - Upload files to assignment (TEACHER)
- `GET /api/assignments/{id}/files` - Get all files for an assignment
- `GET /api/assignments/files/{fileId}/download` - Download assignment file
- `DELETE /api/assignments/files/{fileId}` - Delete assignment file (TEACHER)
- `POST /api/assignments/{id}/url` - Add URL attachment to assignment (TEACHER)
- `PUT /api/assignments/{id}/files` - Update assignment files during editing (TEACHER)

### Student Submission System
- `POST /api/submissions` - Submit assignment with ZIP file upload (STUDENT)
- `GET /api/submissions/assignment/{assignmentId}` - Get all submissions for assignment (TEACHER)
- `GET /api/submissions/student/{studentId}` - Get student's submission history (STUDENT)
- `GET /api/submissions/{submissionId}/status` - Check if student has submitted assignment
- `GET /api/submissions/files/{fileId}/download` - Download student submission file (TEACHER)
- `GET /api/submissions/assignment/{assignmentId}/stats` - Get submission statistics (TEACHER)

## 🛡️ Security Implementation

### JWT Authentication
- **Token Generation**: Secure JWT tokens with user claims
- **Token Validation**: Automatic token verification on protected routes
- **Role-based Access**: Different permissions for ADMIN, TEACHER, STUDENT
- **Token Expiration**: 24-hour token validity with refresh mechanism
- **Secure Headers**: CORS configuration for cross-origin requests

### Database Security
- **SQL Injection Prevention**: JPA parameterized queries
- **Foreign Key Constraints**: Proper relationship management
- **Data Validation**: Input sanitization and validation
- **Password Encryption**: BCrypt hashing for secure password storage

## 🚧 Development Features

### Backend Development
- **Hot Reload**: Spring Boot DevTools for development
- **Database Console**: H2 web interface for data inspection
- **API Testing**: Comprehensive endpoint testing
- **Error Handling**: Global exception handling with proper HTTP codes
- **Logging**: Structured logging for debugging and monitoring

### Frontend Development
- **Component Architecture**: Modular React components
- **State Management**: React hooks for state management  
- **HTTP Interceptors**: Automatic token attachment and error handling
- **Loading States**: User-friendly loading indicators
- **Form Validation**: Real-time input validation with feedback

## 💻 Testing & Quality Assurance

### Backend Testing
- **Unit Tests**: Service layer testing with JUnit 5
- **Integration Tests**: Full API endpoint testing
- **Database Tests**: Repository layer validation
- **Security Tests**: Authentication and authorization testing

### Frontend Testing
- **Component Tests**: React component unit testing
- **Integration Tests**: User workflow testing
- **UI/UX Testing**: Cross-browser compatibility
- **Responsive Testing**: Mobile and desktop layouts

### Manual Testing Performed
- ✅ **User Registration & Admin Approval Workflow**
- ✅ **JWT Authentication & Role-based Access Control**
- ✅ **Course CRUD Operations** (Create, Read, Update, Delete)
- ✅ **Complete Student Enrollment & Teacher Approval Process**
- ✅ **Retake System Implementation** (Student request → Teacher approval/denial)
- ✅ **Advanced Search Functionality** (Course/student search across dashboards)
- ✅ **Unified Dashboard Interfaces** (3-tab student, integrated teacher dashboard)
- ✅ **Custom Modal Systems** (Professional retake confirmation dialogs)
- ✅ **Real-time Status Updates** (Live enrollment statistics and status changes)
- ✅ **Database Constraint Management** (PostgreSQL enum handling for enrollment statuses)
- ✅ **Responsive UI Design** (Mobile-optimized layouts with modern styling)
- ✅ **Error Handling & User Feedback** (Comprehensive notification systems)
- ✅ **Token-based Security** (JWT interceptors and protected routes)
- ✅ **Assignment Management System** (Create, edit, delete assignments with teacher filtering)
- ✅ **File Upload System** (Multiple file types, size validation, persistent storage)
- ✅ **File Download System** (Persistent downloads that survive Docker restarts)
- ✅ **Student Submission System** (ZIP-only uploads with deadline validation)
- ✅ **Submission Status Tracking** (On-Time/Late/Overdue with color coding)
- ✅ **Teacher Submission Review** (View all submissions, download files, statistics)
- ✅ **Deadline Enforcement** (Automatic prevention of late submissions when not allowed)
- ✅ **Submission File Downloads** (Teachers can download student ZIP files for evaluation)
- ✅ **Docker Containerization** (Multi-container setup with persistent volumes)
- ✅ **Teacher-Specific Data Filtering** (Teachers see only their own assignments and courses)
- ✅ **Volume Persistence Testing** (File storage survives container restarts)

## 🚀 Deployment Guide

### 🐳 Docker Deployment (Production Ready)

#### Using the Docker Script
```bash
# Production deployment
./run-docker.sh start

# View logs
./run-docker.sh logs

# Stop services
./run-docker.sh stop
```

#### Manual Docker Deployment
```bash
# Build and start all services
docker-compose up --build -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Docker Services
- **Database**: PostgreSQL with persistent volume `postgres_data`
- **Backend**: Spring Boot API with file storage volume `academy_uploads`
- **Frontend**: React app served by Nginx
- **Networking**: Internal Docker network `academy_network`

#### Data Persistence
- **Database Data**: Stored in `postgres_data` volume (survives container restarts)
- **Uploaded Files**: Stored in `academy_uploads` volume (persistent file storage)
- **Container Isolation**: Each service runs in its own container with proper networking
- **Volume Management**: Docker automatically manages volume lifecycle and permissions

#### Production Features
- **Health Checks**: Database health monitoring with automatic recovery
- **Restart Policies**: Automatic container restart on failure
- **Environment Configuration**: Proper environment variable management
- **Security**: Network isolation and proper port exposure
- **Logging**: Centralized logging for all services

### Traditional Deployment

#### Production Build
```bash
# Build Frontend
cd frontend
npm run build

# Build Backend
cd ../backend
./gradlew build

# Generated files:
# - frontend/build/ (Static files for web server)
# - backend/build/libs/demo-0.0.1-SNAPSHOT.jar (Executable JAR)
```

### Deployment Options
1. **Docker Compose** (Recommended): Complete multi-container setup
2. **Traditional Server**: Deploy JAR file with static files
3. **Cloud Platforms**: AWS, Heroku, Digital Ocean support
4. **Kubernetes**: Container orchestration for large-scale deployment

### Environment Variables
```bash
# Docker Environment (docker-compose.yml)
SPRING_DATASOURCE_URL=jdbc:postgresql://database:5432/academydb
SPRING_DATASOURCE_USERNAME=academyuser
SPRING_DATASOURCE_PASSWORD=academy123
SPRING_JPA_HIBERNATE_DDL_AUTO=update
SERVER_PORT=8080
UPLOAD_DIR=/app/data/uploads

# Production Environment Variables
SPRING_PROFILES_ACTIVE=production
DATABASE_URL=jdbc:postgresql://localhost:5432/academy
DATABASE_USERNAME=academy_user
DATABASE_PASSWORD=secure_password
JWT_SECRET=your-super-secret-jwt-key

# Frontend Configuration  
REACT_APP_API_BASE_URL=https://api.yourdomain.com
REACT_APP_BACKEND_URL=http://backend:8080
```

## 📊 Performance & Scalability

### Backend Optimizations
- **Connection Pooling**: HikariCP for database connections
- **Lazy Loading**: JPA lazy loading for large datasets
- **Caching**: Optional Redis integration for session caching
- **Pagination**: Large dataset pagination support

### Frontend Optimizations
- **Code Splitting**: React lazy loading for route-based splitting
- **Bundle Optimization**: Webpack optimizations for smaller bundles
- **API Caching**: Axios response caching for repeated requests
- **Image Optimization**: Responsive images and lazy loading

## 🔧 Troubleshooting

### Common Issues

**Docker containers won't start:**
```bash
# Check Docker is running
docker --version
docker-compose --version

# Restart all services
./run-docker.sh restart

# View logs for errors
./run-docker.sh logs
```

**Database connection issues:**
```bash
# Connect to database container
docker exec -it academy_db psql -U academyuser -d academydb

# Check container status
docker-compose ps

# Restart database
docker-compose restart database
```

**File upload/download issues:**
```bash
# Check volume mount
docker exec academy_backend ls -la /app/data/uploads/

# Check permissions
docker exec academy_backend whoami
```

**Backend build failures:**
```bash
# Clean rebuild
docker-compose build --no-cache backend
docker-compose up -d backend
```

**Frontend won't load:**
```bash
# Rebuild frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

**Port conflicts:**
```bash
# Check if ports are in use
sudo netstat -tulpn | grep :3000
sudo netstat -tulpn | grep :8080
sudo netstat -tulpn | grep :5433
```

### Legacy Issues (Non-Docker)

**Backend won't start:**
```bash
# Check Java version
java -version  # Should be 17+

# Clean and rebuild
./gradlew clean build bootRun
```

**Frontend won't start:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

**CORS errors:**
- Backend CORS is configured for localhost:3000
- Check SecurityConfig.java for allowed origins

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

### Code Standards
- **Backend**: Follow Spring Boot best practices and Google Java Style
- **Frontend**: Use ES6+ features and React functional components
- **Database**: Follow JPA naming conventions
- **Testing**: Maintain test coverage above 80%

## 📈 Future Enhancements

### Planned Features
- [x] **Assignment Management System**: Complete CRUD operations for assignments ✅
- [x] **File Upload & Download System**: Persistent file storage with multi-format support ✅
- [x] **Teacher-Specific Assignment Filtering**: Role-based data isolation ✅
- [x] **Docker Containerization**: Full multi-container deployment ✅
- [x] **Student Assignment Submission**: ZIP-only file upload system with deadline validation ✅
- [x] **Submission Status Tracking**: On-Time/Late/Overdue status with color coding ✅
- [x] **Teacher Submission Review**: Complete submission viewing and downloading interface ✅
- [ ] **Grading System**: Assignment grading, scoring, and feedback
- [ ] **Real-time Notifications**: WebSocket integration for live enrollment updates
- [ ] **Email Notification System**: Automated emails for enrollment status changes
- [ ] **Advanced Analytics Dashboard**: Detailed reports and statistics for admins
- [ ] **Calendar Integration**: Course schedules, deadlines, and academic calendar
- [ ] **Student Progress Tracking**: Comprehensive academic progress monitoring
- [ ] **Mobile App**: React Native mobile application for iOS/Android
- [ ] **Multi-language Support**: Internationalization (i18n) for global accessibility
- [ ] **Advanced User Profiles**: Extended profile management with avatars and preferences

### Technical Improvements
- [x] **Docker Compose Architecture**: Multi-container orchestration with persistent volumes ✅
- [x] **Persistent File Storage**: Volume-based storage that survives container restarts ✅
- [x] **Production-Ready Database**: PostgreSQL with proper configuration ✅
- [x] **Nginx Frontend Serving**: Production-optimized static file serving ✅
- [ ] **Microservices Architecture**: Split into user, course, and notification services
- [ ] **GraphQL API**: Alternative to REST for flexible data fetching
- [ ] **Advanced Caching**: Redis implementation for better performance
- [ ] **Monitoring**: Application performance monitoring (APM)
- [ ] **CI/CD Pipeline**: Automated testing and deployment
- [ ] **Documentation**: Interactive API documentation with Swagger
- [ ] **Load Balancing**: Multi-instance deployment with load balancer
- [ ] **Security Enhancements**: SSL/TLS, rate limiting, and advanced security headers

## 📝 License & Credits

**Project**: Academy Platform - Full-Stack Learning Management System  
**Purpose**: Educational project demonstrating modern web development practices  
**Technologies**: Spring Boot, React, JWT, JPA, PostgreSQL Database, Docker  
**Status**: Complete MVP with all core features implemented and fully dockerized

### Key Achievements
- ✅ **Complete Authentication System** with JWT and role-based access control
- ✅ **Full CRUD Operations** for users, courses, enrollments, and assignments
- ✅ **Advanced File Management** with persistent storage and download functionality
- ✅ **Student Submission System** with ZIP-only validation and deadline enforcement
- ✅ **Teacher Submission Review** with complete evaluation interface and file downloads
- ✅ **Submission Status Tracking** with automatic On-Time/Late/Overdue calculation
- ✅ **Teacher-Specific Data Filtering** ensuring proper data isolation
- ✅ **Docker Containerization** with multi-container orchestration
- ✅ **Production-Ready Database** with PostgreSQL and persistent volumes
- ✅ **Responsive Modern UI** with professional design and user experience
- ✅ **Comprehensive Testing** covering all major user workflows including submissions

### Docker Implementation Highlights
- **Multi-Container Setup**: Separate containers for database, backend, and frontend
- **Persistent Storage**: Docker volumes for database and file storage
- **Production Configuration**: Nginx for frontend serving, proper networking
- **Easy Management**: Custom script for simplified container management
- **Zero-Configuration Setup**: One-command deployment for development and production

### Acknowledgments
- Spring Boot Team for the excellent framework
- React Team for the powerful UI library
- Docker Team for containerization technology
- PostgreSQL Team for the robust database system
- Open source community for various libraries and tools
- Academia for providing the learning environment

---

**🎓 Academy Platform** - *Empowering Education Through Technology*  
*Built with ❤️ for learning and development - Now Fully Dockerized! 🐳*
