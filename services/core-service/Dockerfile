# ============================================================
# 1️⃣ BUILD STAGE — compile NestJS app & generate Prisma client
# ============================================================
FROM node:22-alpine AS builder

# Create app directory
WORKDIR /app

# Copy and install dependencies
COPY package*.json ./
RUN npm ci

# Copy the source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the project (transpile TS → JS)
RUN npm run build


# ============================================================
# 2️⃣ RUNTIME STAGE — run lightweight production server
# ============================================================
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Copy only necessary files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

# Install only production dependencies
RUN npm ci --omit=dev

# Environment variables (optional defaults)
ENV NODE_ENV=production
ENV PORT=3000


# Add Docker healthcheck to call /health every 10s
HEALTHCHECK --interval=10s --timeout=3s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1


# Expose the port your NestJS app runs on
EXPOSE 3000

# Run database migrations before starting
CMD npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/src/main.js
