# ============================================================
# 1️⃣ BUILD STAGE — compile NestJS app & generate Prisma client
# ============================================================
FROM node:22-alpine AS builder

# Install build dependencies for native modules
RUN apk add --no-cache python3 make g++

# Create app directory
WORKDIR /app

# Copy package files first (better Docker layer caching)
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm install --legacy-peer-deps

# Copy source code and config files
COPY . .

# Generate Prisma client (if using Prisma)
RUN npx prisma generate || true

# Build the project (transpile TS → JS)
RUN npm run build


# ============================================================
# 2️⃣ RUNTIME STAGE — lightweight production server
# ============================================================
FROM node:22-alpine

# Add runtime dependencies (for health checks)
RUN apk add --no-cache wget

# Set working directory
WORKDIR /app

# Copy built application from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
# Conditionally copy Prisma client if it exists
RUN --mount=type=bind,from=builder,source=/app/node_modules/.prisma,target=/tmp/.prisma \
    if [ -d /tmp/.prisma ]; then mkdir -p ./node_modules && cp -r /tmp/.prisma ./node_modules/; fi

# Install ONLY production dependencies
RUN npm install --omit=dev --legacy-peer-deps

# Environment variables (defaults, override with docker-compose)
ENV NODE_ENV=production
ENV PORT=3005

# Run as non-root user for security
USER node

# Health check - verify service is responding
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3005/health || exit 1

# Expose notification service port
EXPOSE 3005

# Start the application
CMD ["node", "dist/src/main.js"]
