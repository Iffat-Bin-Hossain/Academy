# Use OpenJDK 17 as base image
FROM openjdk:17-jdk-slim

# Set working directory
WORKDIR /app

# Copy your Gradle 8.5 installation
COPY gradle-8.5 gradle-8.5

# Copy gradle files
COPY build.gradle .
COPY settings.gradle .

# Copy source code
COPY src src

# Build the application using your Gradle 8.5
RUN ./gradle-8.5/bin/gradle clean build -x test

# Create upload directory with proper permissions
RUN mkdir -p /app/data/uploads && chmod 755 /app/data/uploads

# Expose port 8080
EXPOSE 8080

# Run the jar file with docker profile
CMD ["java", "-jar", "-Dspring.profiles.active=docker", "build/libs/demo-0.0.1-SNAPSHOT.jar"]
