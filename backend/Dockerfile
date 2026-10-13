# Multi-stage Dockerfile for optimized production build (Render / Cloud deployment)
# Stage 1: Build the Spring Boot application
FROM eclipse-temurin:17-jdk-focal AS builder

WORKDIR /app

# Install gradle
RUN apt-get update && apt-get install -y wget unzip && \
    wget -q https://services.gradle.org/distributions/gradle-8.5-bin.zip && \
    unzip -q gradle-8.5-bin.zip && \
    rm gradle-8.5-bin.zip && \
    ln -s /app/gradle-8.5/bin/gradle /usr/local/bin/gradle

# Cache Gradle dependencies
COPY build.gradle settings.gradle ./
COPY gradle gradle
RUN gradle --no-daemon dependencies || true

# Copy source code and build production jar
COPY src src
RUN gradle clean bootJar -x test --no-daemon

# Stage 2: Minimal JRE runtime
FROM eclipse-temurin:17-jre-focal AS runner

WORKDIR /app

# Create upload directory with proper permissions
RUN mkdir -p /app/data/uploads && chmod 755 /app/data/uploads

# Copy built jar from builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

# Expose default ports
EXPOSE 8080 8081

# Production JVM options tuned for 512MB RAM constraint (Render Free Tier)
ENV SPRING_PROFILES_ACTIVE=docker
ENV JAVA_OPTS="-Xms180m -Xmx280m -XX:MaxMetaspaceSize=110m -XX:ReservedCodeCacheSize=40m -Xss512k -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError"

# Dynamic port binding for Render ($PORT) or Docker Compose ($SERVER_PORT) with fallback to 8081
CMD ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT:-${SERVER_PORT:-8081}} -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:-docker} -jar app.jar"]