# Projects Service - Frontend Guide

## Overview
The Projects Service manages projects and tasks. It provides a **REST API** for creating, retrieving, updating, and deleting projects and their associated tasks.

## 📡 Connection Details

### Base URL
- **Local**: `http://localhost:3006`
- **Production**: (TBD)

### Authentication
All endpoints require a valid JWT token in the `Authorization` header.
- **Header**: `Authorization: Bearer <YOUR_JWT_TOKEN>`

## 🛠️ API Endpoints

### 1. Projects

#### Create Project
Create a new project.

- **Endpoint**: `POST /projects`
- **Body**:
  ```json
  {
    "name": "My New Project",
    "description": "Optional description"
  }
  ```
- **Response**: The created `Project` object.

#### Get My Projects
Retrieve a list of projects owned by the authenticated user. Supports cursor-based pagination.

- **Endpoint**: `GET /projects`
- **Query Params**:
  - `limit` (optional): Number of items to return (default: 10)
  - `cursor` (optional): ID of the last item from the previous page
- **Response**:
  ```json
  {
    "data": [ ... ], // Array of Project objects
    "nextCursor": "uuid-string" // Use this for the next request
  }
  ```

#### Get Project Details
Get a single project by ID.

- **Endpoint**: `GET /projects/:id`
- **Response**: `Project` object with `tasks` included.

#### Update Project
Update project details.

- **Endpoint**: `PATCH /projects/:id`
- **Body**: (Partial `CreateProjectDto`)
  ```json
  {
    "name": "Updated Name",
    "description": "Updated description"
  }
  ```

#### Delete Project
Delete a project and all its tasks.

- **Endpoint**: `DELETE /projects/:id`
- **Response**: `{ success: true }`

---

### 2. Tasks

#### Create Task
Add a task to a project.

- **Endpoint**: `POST /projects/:projectId/tasks`
- **Body**:
  ```json
  {
    "title": "Implement Login",
    "description": "Use JWT strategy",
    "priority": "HIGH", // LOW, MEDIUM, HIGH, URGENT
    "status": "TODO",   // TODO, IN_PROGRESS, REVIEW, DONE
    "assigneeId": "user-uuid" // Optional
  }
  ```

#### Get Assigned Tasks
Get tasks assigned to the current user across all projects.

- **Endpoint**: `GET /projects/tasks/assigned`
- **Query Params**:
  - `limit`, `cursor`: Pagination
  - `status`: Filter by status (e.g., `IN_PROGRESS`)
- **Response**: Paginated list of tasks.

#### Get Task Details
Get a single task by ID.

- **Endpoint**: `GET /projects/tasks/:taskId`

#### Update Task
Update task status, priority, or details.

- **Endpoint**: `PATCH /projects/tasks/:taskId`
- **Body**: (Partial `CreateTaskDto`)
  ```json
  {
    "status": "DONE",
    "assigneeId": "new-user-uuid"
  }
  ```

#### Delete Task
Delete a task.

- **Endpoint**: `DELETE /projects/tasks/:taskId`

## 📦 Data Models

### Project
```typescript
interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  tasks?: Task[]; // Included in getProjectById
}
```

### Task
```typescript
interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  projectId: string;
  creatorId: string;
  assigneeId?: string;
  createdAt: string;
  updatedAt: string;
}
```

## 🧪 Testing
You can test these endpoints using Postman or curl. Ensure you have a valid JWT token from the `core-service` login flow.
