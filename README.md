# Academy - Comprehensive Educational Management System

## 🎯 Overview

The Academy platform is a robust educational management system designed to facilitate seamless interactions between teachers, students, and administrators. Built with modern technologies and containerized architecture, it provides comprehensive tools for course management, assignments, messaging, and user collaboration.

## 🛠️ Technology Stack

### Backend
- **Java 21** with Spring Boot 3.2+
- **Spring Security** with JWT authentication
- **Spring Data JPA** with Hibernate
- **PostgreSQL 15** database
- **Docker** containerization

### Frontend
- **React 18** with modern hooks
- **React Router** for navigation
- **Axios** for HTTP requests
- **CSS3** with responsive design

### Infrastructure
- **Docker Compose** for orchestration
- **Multi-stage builds** for optimization
- **Health checks** and auto-restart policies
- **Persistent volume management** for data integrity
- **Automated backup/restore** tooling

## 🌟 Key Features

### 📚 Course Management
- **Create & manage courses** with detailed information
- **Multi-teacher support** with role-based permissions
- **Student enrollment** with approval workflows
- **Course categories** and search functionality

### 📝 Assignment System
- **Rich assignment creation** with file attachments
- **Due date management** and notifications
- **Student submission tracking**
- **Automated grading** integration
- **Bulk operations** for efficiency

### 💬 Communication Hub
- **Real-time messaging** between users
- **Discussion forums** for course collaboration
- **Announcement system** with priority levels
- **Email notifications** for important updates

### 👤 User Profiles & Management
- **Role-based access control** (Admin, Teacher, Student)
- **Comprehensive user profiles** with custom fields
- **Profile photo management** with persistent storage
- **User approval workflows**
- **Smart profile editing** with role-specific sections

### 📊 Resource Management
- **File upload/download** with type validation
- **Resource categorization** and tagging
- **Version control** for educational materials
- **Batch operations** for bulk management

## 🐳 Docker Setup & Persistent Storage

### Prerequisites
- Docker (24.0+)
- Docker Compose (2.20+)
- Git

### Quick Start

1. **Clone the repository**:
```bash
git clone https://github.com/Iffat-Bin-Hossain/Academy.git
cd Academy
```

2. **Start with persistent volumes**:
```bash
# Using the volume management script (recommended)
./manage-volumes.sh start

# Or manually with docker-compose
docker-compose up --build -d
```

3. **Access the application**:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Database**: localhost:5433

4. **Manage persistent data**:
```bash
# Backup volumes
./manage-volumes.sh backup

# Restore from backup
./manage-volumes.sh restore

# List volume information
./manage-volumes.sh info

# Clean volumes (warning: deletes data)
./manage-volumes.sh clean
```

### Persistent Volume Configuration

The application uses Docker volumes for persistent data storage:

- **`academy_uploads`**: Stores all uploaded files including profile photos
- **`postgres_data`**: Maintains database persistence across container restarts

Volume mount points:
- Backend: `/app/data/uploads` → `academy_uploads` volume
- Database: `/var/lib/postgresql/data` → `postgres_data` volume

### Environment Configuration

The project supports environment variables through a `.env` file:

```env
# Database Configuration
POSTGRES_DB=academydb
POSTGRES_USER=academyuser
POSTGRES_PASSWORD=academy123

# Backend Configuration
UPLOAD_DIR=/app/data/uploads
SERVER_PORT=8080

# Frontend Configuration
REACT_APP_API_URL=http://localhost:8080

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## 🔐 Authentication & Security System

### JWT Token-Based Authentication
- **Secure token generation** with configurable expiration
- **Role-based authorization** for different user types
- **Token refresh** mechanism
- **Automatic logout** on token expiration

### Security Configuration Updates
- **Public file access** for profile images and downloads
- **CORS configuration** with multiple origin support
- **JWT filter chain** with proper endpoint protection
- **File access permissions** without authentication headers

### User Roles & Permissions

#### Admin
- Full system access and user management
- Course creation and management across all departments
- Profile photo management for all users
- System configuration and monitoring

#### Teacher
- Course management for assigned courses
- Assignment creation and grading
- Student communication and messaging
- Resource management and file uploads

#### Student
- Course enrollment and participation
- Assignment submission and tracking
- Personal profile management with photo uploads
- Messaging with teachers and classmates

## 📸 Profile Photo Management System

### Enhanced Features (Latest Updates)
- **Persistent storage** with Docker volumes
- **Configurable paths** using environment variables
- **Automatic directory creation** for uploads
- **File type validation** (images only)
- **Size limits** (5MB for profile photos)
- **Secure download endpoints** without authentication

### Configuration Details
```properties
# Backend application.properties
app.profile.photos.dir=${UPLOAD_DIR:./persistent-uploads}/profiles
spring.servlet.multipart.max-file-size=50MB
spring.servlet.multipart.max-request-size=100MB

# Docker environment
UPLOAD_DIR=/app/data/uploads
```

### API Endpoints
```
POST /api/profile/{userId}/photo - Upload profile photo
DELETE /api/profile/{userId}/photo - Delete profile photo
GET /api/files/download/profiles/{filename} - Download profile photo (public)
```

### File Storage Structure
```
academy_uploads volume:
├── profiles/           # Profile photos
│   ├── profile_1_uuid.jpg
│   └── profile_2_uuid.png
└── resources/         # Course resources
    ├── assignments/
    └── materials/
```

## 💬 Messaging System

### Features
- **Direct messaging** between users
- **Group conversations** for course discussions
- **File attachments** in messages with persistent storage
- **Message search** and filtering
- **Notification system** for new messages

### API Endpoints
```
POST /api/messages/send - Send a message
GET /api/messages/conversations - List conversations
GET /api/messages/conversation/{userId} - Get conversation with user
PUT /api/messages/{messageId}/read - Mark message as read
DELETE /api/messages/{messageId} - Delete message
```

## 📱 API Documentation

### Authentication Endpoints
```
POST /api/auth/signup - User registration
POST /api/auth/login - User login
POST /api/auth/logout - User logout
POST /api/auth/refresh - Refresh JWT token
```

### Course Management
```
GET /api/courses - List all courses
POST /api/courses - Create new course (Admin)
GET /api/courses/{id} - Get course details
PUT /api/courses/{id} - Update course (Admin/Teacher)
DELETE /api/courses/{id} - Delete course (Admin)
POST /api/courses/enroll - Enroll in course (Student)
```

### Profile Management (Enhanced)
```
GET /api/profile/{userId} - Get user profile
PUT /api/profile/{userId} - Update user profile
POST /api/profile/{userId}/photo - Upload profile photo
DELETE /api/profile/{userId}/photo - Delete profile photo
```

### File Management (Updated)
```
POST /api/files/upload - Upload general files
GET /api/files/download/{filename} - Download files
GET /api/files/download/profiles/{filename} - Download profile photos (public)
```

## 🔧 Development Setup

### Backend Development
```bash
cd backend
./gradlew bootRun

# With persistent uploads directory
mkdir -p persistent-uploads/profiles
./gradlew bootRun
```

### Frontend Development
```bash
cd frontend
npm install
npm start
```

### Local Development with Docker
```bash
# Start only database for development
docker-compose up database -d

# Connect backend to containerized database
export SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5433/academydb
./gradlew bootRun
```

## 📊 Recent Updates (December 2024)

### Major Infrastructure Improvements

#### Persistent Storage Implementation
- **Docker volume management** with automated backup/restore scripts
- **File path configuration** using environment variables
- **Volume mounting** for uploads and database persistence
- **Data integrity** across container restarts

#### Security Enhancements
- **Public file access** configuration for profile images
- **SecurityConfig updates** with `.requestMatchers("/api/files/download/**").permitAll()`
- **JWT authentication** refinements for file downloads
- **CORS policy** improvements with multiple origin support

#### FileUploadController Improvements
- **Configurable path support** using `@Value("${app.profile.photos.dir}")`
- **Fixed hardcoded paths** that caused 404 errors
- **Enhanced error handling** for file operations
- **Profile photo specific endpoint** with proper content types

#### Profile Management System
- **Smart profile component** with role-based editing
- **Enhanced photo upload/delete** with persistent storage
- **File validation** improvements (type, size, security)
- **Preview functionality** with error handling

### Technical Fixes Implemented

#### Backend Configuration
```java
// SecurityConfig.java - Added public file access
.requestMatchers("/api/files/download/**").permitAll()

// FileUploadController.java - Fixed path configuration
@Value("${app.profile.photos.dir:./uploads/profiles}")
private String profilePhotoDir;

// UserProfileService.java - Enhanced persistence
String photoUrl = "/api/files/download/profiles/" + uniqueFilename;
```

#### Frontend Enhancements
- **Profile photo preview** with loading states
- **Error handling** improvements for image loading
- **File upload validation** on client side
- **Responsive design** updates for profile management

#### Docker & Environment
- **Environment variable integration** across services
- **Volume backup/restore** automation scripts
- **Health checks** and dependency management
- **Multi-environment** configuration support

### Development Workflow Improvements
- **Git repository** configuration with SSH/HTTPS support
- **Build optimization** with Gradle caching
- **Container rebuild** automation
- **Volume persistence** verification tools

## 🚀 Production Deployment

### Prerequisites
- Docker Swarm or Kubernetes cluster
- SSL certificates for HTTPS
- Persistent volume storage (NFS/EFS)
- Load balancer with health checks
- Backup storage system

### Production Configuration
```bash
# Build optimized images
docker-compose -f docker-compose.prod.yml build --no-cache

# Deploy with production settings
docker-compose -f docker-compose.prod.yml up -d

# Verify persistent volumes
docker volume ls | grep academy
./manage-volumes.sh info
```

### Monitoring & Maintenance
- **Application logs**: `docker-compose logs -f backend`
- **Database health**: Automatic health checks configured
- **File system monitoring**: Volume usage and backup verification
- **Performance metrics**: Ready for integration with monitoring tools

### Backup Strategy
```bash
# Automated daily backups
0 2 * * * /path/to/academy/manage-volumes.sh backup

# Weekly database dumps
0 1 * * 0 docker exec academy_db pg_dump -U academyuser academydb > backup_$(date +%Y%m%d).sql
```

## 🤝 Contributing

### Development Guidelines
1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/enhancement-name`
3. **Follow coding standards**: Java conventions, ESLint for React
4. **Test thoroughly**: Include unit and integration tests
5. **Update documentation**: README and inline comments
6. **Submit pull request**: With detailed description

### Code Review Process
- **Security review** for authentication/authorization changes
- **Performance testing** for database queries
- **UI/UX validation** for frontend modifications
- **Docker image testing** for infrastructure changes

### Testing Strategy
```bash
# Backend tests
cd backend && ./gradlew test

# Frontend tests
cd frontend && npm test

# Integration tests with Docker
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📞 Support & Documentation

### Getting Help
- **GitHub Issues**: [Report bugs/feature requests](https://github.com/Iffat-Bin-Hossain/Academy/issues)
- **Documentation**: Inline code comments and API documentation
- **Wiki**: Project wiki with detailed setup guides

### Common Issues & Solutions

#### Profile Photo Upload Issues
1. **Check volume mounts**: `docker volume inspect academy_uploads`
2. **Verify permissions**: Ensure backend can write to mounted directory
3. **Path configuration**: Check `UPLOAD_DIR` environment variable

#### Database Connection Problems
1. **Health check status**: `docker-compose ps`
2. **Network connectivity**: Verify `academy_network` exists
3. **Credentials**: Check `.env` file configuration

#### File Download 404 Errors
1. **Security config**: Ensure public access for `/api/files/download/**`
2. **File existence**: Check if file exists in volume
3. **Path matching**: Verify controller path variables

## 🔄 Version History

### v2.1.0 (December 2024) - Persistent Storage Update
- **Major**: Persistent storage implementation with Docker volumes
- **Enhanced**: Profile photo management with configurable paths
- **Fixed**: Security configuration for public file access
- **Added**: Volume management automation scripts
- **Improved**: FileUploadController path handling

### v2.0.0 (August 2024) - Security & UI Overhaul
- **Major**: JWT authentication system implementation
- **Enhanced**: Role-based access control
- **Added**: Smart profile management interface
- **Improved**: Messaging system with file attachments

### v1.0.0 (Initial Release)
- **Core**: Course management system
- **Basic**: User authentication and profiles
- **Initial**: Docker containerization setup

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Spring Boot Community** for robust framework and documentation
- **React Team** for powerful frontend library and hooks system
- **Docker Inc.** for containerization platform and best practices
- **PostgreSQL Community** for reliable database system
- **Contributors & Testers** for continuous improvement and feedback
- **Educational Institutions** for requirements and use case validation

---

**🎓 Built with dedication for educational excellence and modern learning experiences**

*Last updated: December 2024 | Version 2.1.0*
