# ============================================================
# 1️⃣ BUILD STAGE — compile NestJS app & generate Prisma client
# ============================================================
FROM node:22-alpine AS builder

# Install build dependencies for native modules (bcrypt, argon2, etc.)
RUN apk add --no-cache python3 make g++

# Create app directory
WORKDIR /app

# Copy package files first (better Docker layer caching)
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm install --legacy-peer-deps

# Copy source code and config files
COPY . .

# Generate Prisma client
RUN npx prisma generate

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
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Install ONLY production dependencies (smaller image)
RUN npm install --omit=dev --legacy-peer-deps

# Create uploads directory for file storage
RUN mkdir -p uploads && chown -R node:node uploads

# Environment variables (defaults, override with docker-compose)
ENV NODE_ENV=production
ENV PORT=3002

# Run as non-root user for security
USER node

# Health check - verify service is responding
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

# Expose chat service port
EXPOSE 3002

# Start the application
CMD ["node", "dist/src/main.js"]
