# Build stage
FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with increased timeout and retries
RUN npm ci --legacy-peer-deps --timeout=120000 || npm ci --legacy-peer-deps --timeout=120000

# Copy source code
COPY . .

# Build the application
RUN npm run build 2>&1

# Production stage
FROM nginx:alpine

# Copy built files to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 3000
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
