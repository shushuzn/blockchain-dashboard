# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Install dependencies for frontend
COPY src/webapp/package*.json ./src/webapp/
RUN cd src/webapp && npm install

# Build frontend
COPY src/webapp/ ./src/webapp/
RUN cd src/webapp && npm run build

# Install dependencies for backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built frontend
COPY --from=build /app/dist ./dist

# Copy backend files
COPY backend/ ./backend/

# Copy built backend dependencies
COPY --from=build /app/backend/node_modules ./backend/node_modules

# Create .env file
COPY backend/.env.example ./backend/.env

# Expose ports
EXPOSE 8000

# Start backend server
CMD ["node", "backend/server.js"]