# ========================================================
# Skill Swap Platform - Production Multi-Stage Dockerfile
# ========================================================

# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/client

# Copy client dependency manifests
COPY client/package*.json ./
RUN npm ci

# Copy client source code and compile
COPY client/ ./
RUN npm run build

# Stage 2: Production Server & Runner
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Install production dependencies for server
COPY server/package*.json ./server/
RUN cd server && npm ci --only=production

# Copy server code
COPY server/ ./server/

# Copy compiled frontend from Stage 1
COPY --from=frontend-builder /app/client/dist ./client/dist

# Ensure data storage directory exists for SQLite
RUN mkdir -p /app/server/data

# Expose standard application port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start the application
CMD ["node", "server/src/server.js"]
