#!/bin/bash

# Academy Project Docker Runner Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
check_docker() {
    if ! sudo docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    print_success "Docker is running"
}

# Check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose > /dev/null 2>&1; then
        print_error "Docker Compose is not installed. Please install Docker Compose and try again."
        exit 1
    fi
    print_success "Docker Compose is available"
}

# Main function
main() {
    print_status "Starting Academy Project with Docker..."
    
    # Checks
    check_docker
    check_docker_compose
    
    # Build and run
    print_status "Building and starting all services..."
    sudo docker-compose up --build -d
    
    # Wait a moment for services to start
    sleep 5
    
    # Check service status
    print_status "Checking service status..."
    sudo docker-compose ps
    
    print_success "Academy Project is running!"
    print_status "Access points:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend API: http://localhost:8080"
    echo "  - Database: localhost:5433"
    echo ""
    print_status "Default Admin Login:"
    echo "  - Email: admin@academy.com"
    echo "  - Password: admin123"
    echo ""
    print_status "To view logs: docker-compose logs"
    print_status "To stop services: docker-compose down"
}

# Handle script arguments
case "${1:-}" in
    "start"|"up"|"")
        main
        ;;
    "stop"|"down")
        print_status "Stopping Academy Project..."
        sudo docker-compose down
        print_success "Academy Project stopped"
        ;;
    "restart")
        print_status "Restarting Academy Project..."
        sudo docker-compose down
        sudo docker-compose up --build -d
        print_success "Academy Project restarted"
        ;;
    "logs")
        sudo docker-compose logs -f
        ;;
    "clean")
        print_warning "This will remove all containers, networks, and volumes!"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            sudo docker-compose down -v
            sudo docker system prune -f
            print_success "Cleanup completed"
        else
            print_status "Cleanup cancelled"
        fi
        ;;
    "help"|"-h"|"--help")
        echo "Academy Project Docker Runner"
        echo ""
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  start, up     Start all services (default)"
        echo "  stop, down    Stop all services"
        echo "  restart       Restart all services"
        echo "  logs          View logs"
        echo "  clean         Remove all containers and volumes"
        echo "  help          Show this help"
        ;;
    *)
        print_error "Unknown command: $1"
        print_status "Use '$0 help' for usage information"
        exit 1
        ;;
esac
