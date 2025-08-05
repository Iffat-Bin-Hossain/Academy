# Academy Project - Docker Setup

This project is fully dockerized with PostgreSQL database, Spring Boot backend, and React frontend.

## Prerequisites

- Docker
- Docker Compose

## Quick Start

### Option 1: Using the run-docker.sh script (Recommended)
```bash
# Make script executable (first time only)
chmod +x run-docker.sh

# Start all services
./run-docker.sh start

# Stop all services
./run-docker.sh stop

# Restart all services
./run-docker.sh restart

# View logs
./run-docker.sh logs

# Clean up everything
./run-docker.sh clean

# Show help
./run-docker.sh help
```

### Option 2: Using docker-compose directly
1. **Clone the repository** (if not already done)
```bash
git clone <repository-url>
cd Academy
```

2. **Build and run all services**
```bash
sudo docker-compose up --build
```

3. **Access the application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:8080
- PostgreSQL: localhost:5433

### Individual Service Commands

### Build all services
```bash
sudo docker-compose build
```

### Run all services
```bash
sudo docker-compose up
```

### Run in background
```bash
sudo docker-compose up -d
```

### View logs
```bash
# All services
sudo docker-compose logs

# Specific service
sudo docker-compose logs backend
sudo docker-compose logs frontend
sudo docker-compose logs database
```

### Stop all services
```bash
sudo docker-compose down
```

### Stop and remove volumes (database data)
```bash
sudo docker-compose down -v
```

## Default Admin Account

After the first startup, you can login with:
- **Email**: admin@academy.com
- **Password**: admin123

## Service Details

### Database (PostgreSQL)
- **Image**: postgres:15-alpine
- **Port**: 5433 (Docker) / 5432 (Container Internal)
- **Database**: academydb
- **Username**: academyuser
- **Password**: academy123

### Backend (Spring Boot)
- **Port**: 8080
- **Profile**: docker
- **Auto-reconnects to database**
- **Health check enabled**
- **Built with**: Gradle 8.5

### Frontend (React)
- **Port**: 3000
- **Built with**: React 19 + Node.js 18
- **Served with**: Nginx reverse proxy
- **Features**: Cross-tab synchronization for real-time updates

## Environment Variables

You can customize the setup by creating a `.env` file:

```env
# Database
POSTGRES_DB=academydb
POSTGRES_USER=academyuser
POSTGRES_PASSWORD=academy123

# Backend
SERVER_PORT=8080
SPRING_PROFILES_ACTIVE=docker

# Email (optional)
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM_EMAIL=noreply@academy.com
SMTP_FROM_NAME=Academy Platform
```

## Development vs Production

### Development
```bash
# Run with hot reload (requires local Node.js and Java)
cd frontend && npm start
cd backend && ./gradlew bootRun
```

### Production (Docker)
```bash
# Optimized builds with Docker
docker-compose up --build
```

## Troubleshooting

### Database Connection Issues
```bash
# Check database health
docker-compose exec database pg_isready -U academyuser -d academydb

# View database logs
docker-compose logs database
```

### Backend Issues
```bash
# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend
```

### Frontend Issues
```bash
# Check frontend logs
docker-compose logs frontend

# Rebuild frontend
docker-compose build frontend
docker-compose up frontend
```

### Clean Start
```bash
# Remove all containers, networks, and volumes
docker-compose down -v
docker system prune -f

# Rebuild everything
docker-compose up --build
```

## Network Architecture

```
Internet → Frontend (3000) → Backend (8080) → Database (5433)
```

All services communicate through a dedicated Docker network: `academy_network`

### Cross-Tab Synchronization
The frontend includes real-time cross-tab synchronization:
- ✅ Data updates in one tab automatically refresh other tabs
- ✅ Login/logout status synced across all browser tabs
- ✅ Prevents "Failed to load data" errors in multiple windows

### Technical Stack
- **Frontend**: React 19 + Nginx reverse proxy
- **Backend**: Spring Boot 3.5.4 + Gradle 8.5 + Java 17
- **Database**: PostgreSQL 15
- **Authentication**: JWT tokens with automatic refresh
- **Containerization**: Docker + Docker Compose
