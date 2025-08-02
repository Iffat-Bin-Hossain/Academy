# Academy Project

A modern full-stack web application for academy management with user authentication, admin dashboard, and beautiful UI design.

## 🎨 Design Features

- **Modern Branding**: Blue gradient backgrounds with "academy" branding
- **Curved Logo Design**: "ACADEMY" text curved in an arc above a graduation cap icon
- **Grid Overlay**: Subtle grid pattern for visual sophistication  
- **Tagline**: "STAY LINKED, STAY LOCAL" in italic styling
- **Glass Morphism**: Semi-transparent cards with backdrop blur effects

## 🚀 Tech Stack

### Backend
- **Spring Boot** (Java) - REST API server
- **Spring Security** - Authentication and authorization
- **JPA/Hibernate** - Database ORM
- **H2/PostgreSQL** - Database
- **Port**: 8080

### Frontend  
- **React** (JavaScript) - UI framework
- **Axios** - HTTP client for API calls
- **React Router** - Client-side routing
- **Custom CSS** - Styling with modern utilities
- **Port**: 3000

## 🛠️ Setup & Installation

### Prerequisites
- Java 11+ 
- Node.js 14+
- npm or yarn

### Backend Setup
```bash
cd backend
./gradlew bootRun
```

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

## 📱 Features

### User Authentication
- **Login**: User authentication with demo credentials
- **Signup**: New user registration with role selection
- **Admin Dashboard**: User approval system for admins

### Demo Credentials (for testing)
- **Email**: `admin@academy.com`
- **Password**: `admin123`

### Admin Features
- View pending user registrations
- Approve/reject new users
- Dashboard with user statistics

## 🎯 Project Structure

```
academy/
├── backend/                 # Spring Boot API
│   ├── src/main/java/      # Java source code
│   ├── src/main/resources/ # Configuration files
│   └── build.gradle        # Dependencies
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── api/           # API configuration
│   │   └── App.js         # Main app component
│   ├── public/            # Static assets
│   └── package.json       # Dependencies
└── README.md
```

## 🌐 API Endpoints

- `POST /auth/login` - User login
- `POST /auth/signup` - User registration  
- `GET /admin/pending` - Get pending users
- `POST /admin/approve/{id}` - Approve user

## 💻 Development

The application features:
- Responsive design for mobile and desktop
- Modern UI with gradient backgrounds
- Real-time form validation
- Loading states and error handling
- Professional admin dashboard

## 🚀 Deployment

1. Build the frontend: `npm run build`
2. Build the backend: `./gradlew build`
3. Deploy both to your hosting platform

## 📝 License

This project is part of the Therap JavaFest competition.
