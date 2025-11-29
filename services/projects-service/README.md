# Projects Service

Microservice for managing Projects and Tasks in DevConnect.

## Features

- **Projects**: Create, read, update, delete projects.
- **Tasks**: Create, read, update, delete tasks within projects.
- **Activity Log**: Tracks history of task changes (status, assignment, priority).
- **Pagination**: Cursor-based pagination for lists.
- **Security**: JWT authentication and role-based access control (Owner/Assignee).

## Tech Stack

- **Framework**: NestJS
- **Database**: PostgreSQL (via Prisma)
- **Auth**: Passport JWT (Shared secret with Core Service)

## Setup

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    Create a `.env` file based on `.env.example`:
    ```env
    DATABASE_URL="postgresql://user:password@localhost:5435/devconnect?schema=public"
    JWT_SECRET="your-secret"
    PORT=3006
    ```

3.  **Database**:
    Ensure the PostgreSQL database is running.
    ```bash
    npx prisma generate
    ```

4.  **Run**:
    ```bash
    # Development
    npm run start:dev

    # Production
    npm run build
    npm run start:prod
    ```

## API Documentation

See [PROJECTS_FRONTEND_GUIDE.md](./PROJECTS_FRONTEND_GUIDE.md) for detailed API usage.
