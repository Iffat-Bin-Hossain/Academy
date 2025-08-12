# Use OpenJDK 17 as base image
FROM openjdk:17-jdk-slim

# Install wget and unzip for Gradle installation
RUN apt-get update && apt-get install -y wget unzip && rm -rf /var/lib/apt/lists/*

# Download and install Gradle
RUN wget https://services.gradle.org/distributions/gradle-8.5-bin.zip && \
    unzip gradle-8.5-bin.zip && \
    mv gradle-8.5 /opt/gradle && \
    rm gradle-8.5-bin.zip

# Add Gradle to PATH
ENV PATH=/opt/gradle/bin:$PATH

# Set working directory
WORKDIR /app

# Copy gradle configuration files
COPY build.gradle .
COPY settings.gradle .

# Copy source code
COPY src src

# Build the application
RUN gradle clean build -x test

# Create upload directory with proper permissions
RUN mkdir -p /app/data/uploads && chmod 755 /app/data/uploads

# Expose port 8080
EXPOSE 8080

# Run the jar file with docker profile
CMD ["java", "-jar", "-Dspring.profiles.active=docker", "build/libs/demo-0.0.1-SNAPSHOT.jar"]
