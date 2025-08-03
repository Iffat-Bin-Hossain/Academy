# Academy Platform

A comprehensive full-stack web application for academy management with complete user authentication, role-based dashboards, course management, and enrollment system.

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
- **H2 Database** - In-memory database for development
- **Lombok** - Code generation and boilerplate reduction
- **Jakarta Validation** - Input validation and constraints
- **Port**: 8080

### Frontend  
- **React 19** (JavaScript) - Modern UI framework with hooks
- **Axios** - HTTP client with interceptors for API calls
- **React Router** - Client-side routing and navigation
- **JWT Decode** - Token parsing and role extraction
- **Custom CSS** - Modern styling with CSS Grid and Flexbox
- **React Icons** - Icon library for UI elements
- **Port**: 3000

## 🛠️ Setup & Installation

### Prerequisites
- **Java 17+** (OpenJDK recommended)
- **Node.js 18+** (LTS version)
- **npm** or **yarn** for package management
- **Git** for version control

### Backend Setup
```bash
cd backend
./gradlew bootRun
```
*The backend will start on http://localhost:8080*

### Frontend Setup
```bash
cd frontend
npm install
npm start
```
*The frontend will start on http://localhost:3000*

### Database
- Uses **H2 in-memory database** for development
- Database console available at: http://localhost:8080/h2-console
- JDBC URL: `jdbc:h2:mem:testdb`
- Username: `sa`, Password: *(empty)*

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
- **Course Assignment**: View courses assigned by administrators
- **Student Enrollment**: Approve/reject student enrollment requests
- **Class Management**: Monitor enrolled students per course
- **Enrollment Statistics**: Track pending and approved enrollments
- **Course Details**: Detailed view of assigned courses
- **Student Communication**: Interface for student interactions

### 👨‍🎓 Student Dashboard Features
- **Course Browsing**: Explore available courses with detailed information
- **Course Enrollment**: Request enrollment in desired courses
- **My Courses**: View enrolled courses and track progress
- **Enrollment Status**: Monitor pending, approved, and rejected requests
- **Course Unenrollment**: Option to withdraw from courses
- **Academic Progress**: Track learning journey and achievements

### 📚 Course Management System
- **Course Creation**: Admin can create courses with detailed information
- **Course Assignment**: Admin assigns courses to specific teachers
- **Enrollment Workflow**: Student request → Teacher approval → Course access
- **Course Deletion**: Safe deletion with enrollment cleanup
- **Course Updates**: Modify course details and descriptions
- **Search & Filter**: Find courses by title, code, or teacher

### 🎯 Advanced Features
- **Real-time Updates**: Dynamic content refresh without page reload
- **Error Handling**: Comprehensive error messages and user feedback
- **Loading States**: Smooth loading indicators and transitions
- **Form Validation**: Client and server-side input validation
- **Responsive Design**: Mobile-optimized interface
- **Toast Notifications**: Success and error message system

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
├── backend/                    # Spring Boot REST API
│   ├── src/main/java/
│   │   └── com/example/demo/
│   │       ├── config/         # Security, CORS, JWT configuration
│   │       ├── controller/     # REST API endpoints
│   │       ├── model/          # JPA entities and DTOs
│   │       ├── repository/     # Data access layer
│   │       └── service/        # Business logic layer
│   ├── src/main/resources/
│   │   └── application.properties  # Database and server config
│   └── build.gradle           # Dependencies and build config
├── frontend/                  # React SPA
│   ├── src/
│   │   ├── components/        # React components
│   │   │   ├── Login.js       # Authentication component
│   │   │   ├── Signup.js      # User registration
│   │   │   ├── ModernAdminDashboard.js    # Admin interface
│   │   │   ├── ModernTeacherDashboard.js  # Teacher interface
│   │   │   ├── ModernStudentDashboard.js  # Student interface
│   │   │   └── Layout.js      # Common layout wrapper
│   │   ├── api/
│   │   │   └── axiosInstance.js  # HTTP client configuration
│   │   └── App.js             # Main application component
│   ├── public/                # Static assets
│   └── package.json           # Dependencies and scripts
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
- `POST /api/courses/decide` - Approve/reject enrollment (TEACHER)
- `GET /api/courses/student/{id}` - Get student's enrolled courses
- `GET /api/courses/teacher/{id}` - Get teacher's assigned courses

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
- ✅ **User Registration & Approval Workflow**
- ✅ **JWT Authentication & Role-based Access**
- ✅ **Course CRUD Operations** (Create, Read, Update, Delete)
- ✅ **Student Enrollment & Teacher Approval Process**
- ✅ **Admin Dashboard Management Features**
- ✅ **Error Handling & User Feedback**
- ✅ **Database Relationship Integrity**
- ✅ **Foreign Key Constraint Handling**

## 🚀 Deployment Guide

### Production Build
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
1. **Traditional Server**: Deploy JAR file with static files
2. **Docker**: Containerized deployment (Dockerfile included)
3. **Cloud Platforms**: AWS, Heroku, Digital Ocean support
4. **Database**: Switch to PostgreSQL/MySQL for production

### Environment Variables
```bash
# Backend Configuration
SPRING_PROFILES_ACTIVE=production
DATABASE_URL=jdbc:postgresql://localhost:5432/academy
DATABASE_USERNAME=academy_user
DATABASE_PASSWORD=secure_password
JWT_SECRET=your-super-secret-jwt-key

# Frontend Configuration  
REACT_APP_API_BASE_URL=https://api.yourdomain.com
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

**Database connection issues:**
- Check H2 console at http://localhost:8080/h2-console
- Verify JDBC URL: `jdbc:h2:mem:testdb`
- Username: `sa`, Password: *(empty)*

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
- [ ] **File Upload System**: Document and image uploads for courses
- [ ] **Real-time Notifications**: WebSocket integration for live updates
- [ ] **Assignment System**: Homework submission and grading
- [ ] **Calendar Integration**: Course schedules and deadlines
- [ ] **Email Notifications**: Automated email alerts for enrollment status
- [ ] **Report Generation**: PDF reports for admin analytics
- [ ] **Mobile App**: React Native mobile application
- [ ] **Multi-language Support**: Internationalization (i18n)

### Technical Improvements
- [ ] **Microservices Architecture**: Split into user, course, and notification services
- [ ] **GraphQL API**: Alternative to REST for flexible data fetching
- [ ] **Advanced Caching**: Redis implementation for better performance
- [ ] **Monitoring**: Application performance monitoring (APM)
- [ ] **CI/CD Pipeline**: Automated testing and deployment
- [ ] **Documentation**: Interactive API documentation with Swagger

## 📝 License & Credits

**Project**: Academy Platform - Full-Stack Learning Management System  
**Purpose**: Educational project demonstrating modern web development practices  
**Technologies**: Spring Boot, React, JWT, JPA, H2 Database  
**Status**: Complete MVP with all core features implemented

### Acknowledgments
- Spring Boot Team for the excellent framework
- React Team for the powerful UI library
- Open source community for various libraries and tools
- Academia for providing the learning environment

---

**🎓 Academy Platform** - *Empowering Education Through Technology*  
*Built with ❤️ for learning and development*
