# Use OpenJDK 17 as base image
FROM openjdk:17-jdk-slim

# Set working directory
WORKDIR /app

# Install gradle
RUN apt-get update && apt-get install -y wget unzip && \
    wget https://services.gradle.org/distributions/gradle-8.5-bin.zip && \
    unzip gradle-8.5-bin.zip && \
    rm gradle-8.5-bin.zip && \
    ln -s /app/gradle-8.5/bin/gradle /usr/local/bin/gradle

# Copy gradle files
COPY build.gradle .
COPY settings.gradle .

# Copy source code
COPY src src

# Build the application
RUN gradle clean build -x test

# Create upload directory with proper permissions
RUN mkdir -p /app/data/uploads && chmod 755 /app/data/uploads

# Expose port 8081
EXPOSE 8081

# Run the jar file with docker profile
CMD ["java", "-jar", "-Dspring.profiles.active=docker", "build/libs/demo-0.0.1-SNAPSHOT.jar"]