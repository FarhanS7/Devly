# 🚀 Render Deployment Guide: DevConnect Backend

This guide provides an optimized way to deploy the DevConnect backend services on Render using **Environment Groups**.

## 🛠️ Fastest Method: Infrastructure as Code (Blueprint V2)

1.  **Update `render.yaml`**: Copy and paste the optimized code below into your `render.yaml` file.
2.  **Push to GitHub**: Commit and push the change to your `main` branch.
3.  **Deploy in Render**:
    - Go to your Render Dashboard -> **Blueprints**.
    - Click **New Blueprint Instance** and select your repo.
    - Fill in your variables in the `devconnect-shared-secrets` group.
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
    buildCommand: npm install --include=dev && npx prisma generate && npm run build
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
    buildCommand: npm install --include=dev && npx prisma generate && npm run build
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
    buildCommand: npm install --include=dev && npx prisma generate && npm run build
    startCommand: npm run start:prod
    envVars:
      - fromGroup: devconnect-shared-secrets

  - type: web
    name: devconnect-notifications
    env: node
    plan: free
    rootDir: services/notification-service
    buildCommand: npm install --include=dev && npx prisma generate && npm run build
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
