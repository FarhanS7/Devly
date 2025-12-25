# 🚀 Render Deployment Guide: DevConnect Backend

This guide provides a comprehensive walkthrough for deploying the DevConnect backend services on [Render](https://render.com).

## 📋 Prerequisites

Before you begin, ensure you have:
1. A **Render Account**.
2. A **PostgreSQL Database** (Render offers a managed PostgreSQL service).
3. A **Redis Instance** (Render offers a managed Redis service).
4. **Clerk API Keys** (from your Clerk dashboard).

---

## 🛠️ Method 1: Infrastructure as Code (Recommended)

DevConnect includes a `render.yaml` Blueprint file that can deploy all services, the database, and Redis with a single configuration.

1. **Connect your GitHub or GitLab repository** to Render.
2. Go to the **Blueprints** section in the Render Dashboard.
3. Click **New Blueprint Instance**.
4. Select your repository.
5. Render will automatically detect the `render.yaml` file.
6. **Fill in the Environment Variables** requested by the Blueprint.
7. Click **Deploy**.

---

## 🖱️ Method 2: Manual Deployment

If you prefer to set up each service manually, follow these steps for each service.

### 1. Database & Redis Setup
- **Create a PostgreSQL Database** on Render. 
- Once created, copy the **Internal Database URL**. You will need to paste this into the `DATABASE_URL` fields when Render prompts you during the blueprint setup.
- **Redis Instance** is automatically created by the blueprint.

### 2. Core Service (`devconnect-core`)
- **Service Type**: Web Service
- **Runtime**: Node
- **Root Directory**: `services/core-service`
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm run start:prod`
- **Environment Variables**:
  - `DATABASE_URL`: Your PostgreSQL Internal URL (Paste when prompted).
  - `REDIS_URL`: Automatically linked.
  - `NODE_ENV`: `production`
  - `JWT_SECRET`: A random secure string (Enter when prompted).
  - `JWT_REFRESH_SECRET`: Another random secure string (You may need to add this manually if not in the prompt).
  - `FRONTEND_URL`: The URL of your deployed frontend (e.g., `https://your-app.vercel.app`).

### 3. Chat Service (`devconnect-chat`)
- **Service Type**: Web Service
- **Root Directory**: `services/chat-service`
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm run start:prod`
- **Environment Variables**:
  - `DATABASE_URL`: Same as Core Service.
  - `REDIS_URL`: Automatically linked.
  - `PORT`: `3001` (Render usually sets this automatically, but ensure it matches your app).

### 4. Notification Service (`devconnect-notifications`)
- **Service Type**: Web Service
- **Root Directory**: `services/notification-service`
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm run start:prod`
- **Environment Variables**:
  - `DATABASE_URL`: Same as Core Service.
  - `REDIS_URL`: Automatically linked.

### 5. Projects Service (`devconnect-projects`)
- **Service Type**: Web Service
- **Root Directory**: `services/projects-service`
- **Build Command**: `npm install && npx prisma generate && npm run build`
- **Start Command**: `npm run start:prod`
- **Environment Variables**:
  - `DATABASE_URL`: Same as Core Service.

---

## 🌐 Connecting the Frontend

Once your backend services are live, update your frontend environment variables:

- `NEXT_PUBLIC_CORE_API_URL`: Your `devconnect-core` Render URL.
- `NEXT_PUBLIC_CHAT_API_URL`: Your `devconnect-chat` Render URL.
- `NEXT_PUBLIC_PROJECTS_API_URL`: Your `devconnect-projects` Render URL.

> [!TIP]
> Use Render's **Log Streams** to monitor your services during deployment and identify any configuration errors quickly.

> [!IMPORTANT]
> Ensure all services are in the same **Render Region** to minimize latency and ensure they can communicate via internal URLs.
