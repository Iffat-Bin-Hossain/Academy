#!/bin/bash

# Academy Docker Volume Management Script

echo "🚀 Academy Project Docker Management"
echo "=================================="

# Function to start with persistent volumes
start_project() {
    echo "📁 Creating persistent volumes..."
    docker volume create academy_uploads 2>/dev/null || true
    docker volume create postgres_data 2>/dev/null || true
    
    echo "🔧 Building and starting services..."
    docker-compose up --build -d
    
    echo "✅ Project started with persistent volumes!"
    echo "📊 Volume status:"
    docker volume ls | grep academy
    
    echo "🌐 Services available at:"
    echo "   Frontend: http://localhost:3000"
    echo "   Backend: http://localhost:8080"
    echo "   Database: localhost:5433"
}

# Function to backup uploads volume
backup_uploads() {
    echo "💾 Backing up profile pictures..."
    mkdir -p ./backups
    docker run --rm -v academy_uploads:/data -v $(pwd)/backups:/backup alpine tar czf /backup/uploads-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .
    echo "✅ Backup completed in ./backups/"
}

# Function to restore uploads volume
restore_uploads() {
    if [ -z "$1" ]; then
        echo "❌ Please provide backup file path"
        echo "Usage: ./manage-volumes.sh restore /path/to/backup.tar.gz"
        exit 1
    fi
    
    echo "📂 Restoring uploads from $1..."
    docker run --rm -v academy_uploads:/data -v $(pwd):/backup alpine tar xzf /backup/$1 -C /data
    echo "✅ Restore completed!"
}

# Function to show volume info
show_volumes() {
    echo "📊 Academy Docker Volumes:"
    echo "=========================="
    docker volume ls | grep -E "(academy|postgres)" || echo "No Academy volumes found"
    echo ""
    echo "📁 Volume details:"
    docker volume inspect academy_uploads postgres_data 2>/dev/null | grep -A 10 "Mountpoint" || echo "Volumes not found"
}

# Function to clean up
cleanup() {
    echo "🧹 Stopping services..."
    docker-compose down
    
    read -p "🗑️  Do you want to remove volumes (will delete all data)? [y/N]: " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        docker volume rm academy_uploads postgres_data 2>/dev/null || true
        echo "✅ Volumes removed"
    else
        echo "📁 Volumes preserved"
    fi
}

# Main script logic
case "${1:-start}" in
    "start")
        start_project
        ;;
    "backup")
        backup_uploads
        ;;
    "restore")
        restore_uploads $2
        ;;
    "volumes")
        show_volumes
        ;;
    "clean")
        cleanup
        ;;
    "help"|"--help"|"-h")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  start     - Start project with persistent volumes (default)"
        echo "  backup    - Backup upload volumes"
        echo "  restore   - Restore uploads from backup"
        echo "  volumes   - Show volume information"
        echo "  clean     - Stop and optionally remove volumes"
        echo "  help      - Show this help"
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo "Run '$0 help' for usage information"
        exit 1
        ;;
esac
