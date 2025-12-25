# 🚀 Render Deployment Guide: DevConnect Backend

This guide provides an optimized way to deploy the DevConnect backend services on Render using **Environment Groups**. This method is much faster as it allows you to enter your configuration just once for all services.

## 🛠️ Fastest Method: Infrastructure as Code (Blueprint V2)

1.  **Update `render.yaml`**: Copy and paste the optimized code below into your `render.yaml` file in the root of your project.
2.  **Push to GitHub**: Commit and push the change to your `main` branch.
3.  **Deploy in Render**:
    - Go to your Render Dashboard -> **Blueprints**.
    - Click **New Blueprint Instance** and select your repo.
    - Render will now show a section for **"Environment Groups"** called `devconnect-shared-secrets`.
    - **Enter your variables only once** in this group:
        - `DATABASE_URL`: Your Neon connection string.
        - `JWT_SECRET`: A random secure string.
        - `JWT_REFRESH_SECRET`: Another random secure string.
        - `FRONTEND_URL`: Your Vercel URL.
    - Click **Deploy**.

---

### ✅ Optimized `render.yaml`
```yaml
envVarGroups:
  - name: devconnect-shared-secrets
    envVars:
      - key: DATABASE_URL
        sync: false 
      - key: JWT_SECRET
        sync: false
      - key: JWT_REFRESH_SECRET
        sync: false
      - key: FRONTEND_URL
        sync: false
      - key: NODE_ENV
        value: production

services:
  - type: web
    name: devconnect-core
    env: node
    plan: free
    rootDir: services/core-service
    buildCommand: npm install && npx prisma generate && npm run build
    startCommand: npm run start:prod
    envVars:
      - fromGroup: devconnect-shared-secrets
      - key: REDIS_URL
        fromService:
          type: redis
          name: devconnect-redis
          property: connectionString

  - type: web
    name: devconnect-chat
    env: node
    plan: free
    rootDir: services/chat-service
    buildCommand: npm install && npx prisma generate && npm run build
    startCommand: npm run start:prod
    envVars:
      - fromGroup: devconnect-shared-secrets
      - key: REDIS_URL
        fromService:
          type: redis
          name: devconnect-redis
          property: connectionString

  - type: web
    name: devconnect-projects
    env: node
    plan: free
    rootDir: services/projects-service
    buildCommand: npm install && npx prisma generate && npm run build
    startCommand: npm run start:prod
    envVars:
      - fromGroup: devconnect-shared-secrets

  - type: web
    name: devconnect-notifications
    env: node
    plan: free
    rootDir: services/notification-service
    buildCommand: npm install && npx prisma generate && npm run build
    startCommand: npm run start:prod
    envVars:
      - fromGroup: devconnect-shared-secrets
      - key: REDIS_URL
        fromService:
          type: redis
          name: devconnect-redis
          property: connectionString

  - type: redis
    name: devconnect-redis
    plan: free
    ipAllowList: [] 
```
