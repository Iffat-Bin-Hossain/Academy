#!/bin/bash

# Academy Database Cleanup Script
# This script will clear all data from the Academy database

echo "🗑️  Academy Database Cleanup Script"
echo "=================================="
echo ""
echo "⚠️  WARNING: This will permanently delete ALL data from your database!"
echo "This includes users, courses, assignments, submissions, and all other data."
echo ""

# Ask for confirmation
read -p "Are you sure you want to proceed? (type 'yes' to continue): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo "❌ Operation cancelled."
    exit 1
fi

echo ""
echo "🔄 Starting database cleanup..."

# Check if Docker is running
if ! docker ps &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if the database container is running
if ! docker ps --format "table {{.Names}}" | grep -q "academy_db"; then
    echo "❌ Academy database container is not running."
    echo "💡 Please start your Academy application with: docker-compose up -d"
    exit 1
fi

# Execute the PostgreSQL cleanup script
echo "🧹 Executing database cleanup..."
docker exec -i academy_db psql -U academyuser -d academydb < /home/iffat25082002/Desktop/Academy/database/clear_all_data_postgresql.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database cleanup completed successfully!"
    echo "📊 All tables have been cleared and auto-increment counters reset."
    echo ""
    echo "📁 Note: File uploads in the persistent-uploads and uploads directories"
    echo "   are still present. To remove them, run:"
    echo "   sudo rm -rf /home/iffat25082002/Desktop/Academy/persistent-uploads/*"
    echo "   sudo rm -rf /home/iffat25082002/Desktop/Academy/uploads/*"
else
    echo ""
    echo "❌ Database cleanup failed!"
    echo "Please check the error messages above and try again."
    exit 1
fi
