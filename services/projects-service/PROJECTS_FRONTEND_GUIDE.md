# Projects & Tasks Frontend Integration Guide

This guide provides complete reference for integrating the Project Management feature into the frontend application. It covers authentication, API endpoints, data types, and implementation examples.

## 1. Authentication

All endpoints require **JWT Authentication**.

-   **Token Source**: Use the JWT token from login/auth flow.
-   **Header**: Include `Authorization: Bearer <token>` on all requests.

## 2. API Endpoints

Base URL: `http://localhost:3006/projects`

### Projects

#### Create Project
Create a new project owned by the current user.

*   **Method**: `POST`
*   **Endpoint**: `/projects`
*   **Body**:
    ```typescript
    {
      name: string;
      description?: string;
    }
    ```
*   **Response**: `Project` object (includes owner info)

#### Get My Projects
Fetch all projects owned by the current user.

*   **Method**: `GET`
*   **Endpoint**: `/projects`
*   **Response**: Array of `Project` objects with task counts

#### Get Project by ID
Fetch a single project with all its tasks.

*   **Method**: `GET`
*   **Endpoint**: `/projects/:id`
*   **Response**: `Project` object (includes tasks array)

#### Update Project
Update project details (owner only).

*   **Method**: `PATCH`
*   **Endpoint**: `/projects/:id`
*   **Body**:
    ```typescript
    {
      name?: string;
      description?: string;
    }
    ```
*   **Response**: Updated `Project` object

#### Delete Project
Delete a project and all its tasks (owner only).

*   **Method**: `DELETE`
*   **Endpoint**: `/projects/:id`
*   **Response**: `204 No Content`

### Tasks

#### Create Task
Create a new task within a project.

*   **Method**: `POST`
*   **Endpoint**: `/projects/:projectId/tasks`
*   **Body**:
    ```typescript
    {
      title: string;
      description?: string;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
      assigneeId?: string;
    }
    ```
*   **Response**: `Task` object

#### Get Task by ID
Fetch a single task with full details (including activity history).

*   **Method**: `GET`
*   **Endpoint**: `/projects/tasks/:taskId`
*   **Response**: `Task` object with `activities` array

#### Update Task
Update task details (owner or assignee).

*   **Method**: `PATCH`
*   **Endpoint**: `/projects/tasks/:taskId`
*   **Body**:
    ```typescript
    {
      title?: string;
      description?: string;
      status?: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
      assigneeId?: string;
    }
    ```
*   **Response**: Updated `Task` object

#### Delete Task
Delete a task (owner only).

*   **Method**: `DELETE`
*   **Endpoint**: `/projects/tasks/:taskId`
*   **Response**: `204 No Content`

## 3. Data Types

### Project
```typescript
interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    handle: string;
    avatarUrl?: string;
  };
  tasks?: Task[];
  _count?: {
    tasks: number;
  };
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
  assignee?: {
    id: string;
    name: string;
    handle: string;
    avatarUrl?: string;
  };
  activities?: TaskActivity[];
}
```

### TaskActivity
```typescript
interface TaskActivity {
  id: string;
  taskId: string;
  actorId: string;
  type: string; // 'CREATED', 'STATUS_CHANGED', 'ASSIGNED', 'PRIORITY_CHANGED', etc.
  payload: any; // Varies by type
  createdAt: string;
  actor: {
    id: string;
    name: string;
    handle: string;
    avatarUrl?: string;
  };
}
```

## 4. Implementation Example

```typescript
// API Client Methods
const apiClient = {
  // Projects
  async getProjects() {
    const res = await fetch('http://localhost:3006/projects', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async createProject(data: { name: string; description?: string }) {
    const res = await fetch('http://localhost:3006/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getProjectById(projectId: string) {
    const res = await fetch(`http://localhost:3006/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async updateProject(projectId: string, data: { name?: string; description?: string }) {
    const res = await fetch(`http://localhost:3006/projects/${projectId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteProject(projectId: string) {
    await fetch(`http://localhost:3006/projects/${projectId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },

  // Tasks
  async createTask(projectId: string, data: CreateTaskDto) {
    const res = await fetch(`http://localhost:3006/projects/${projectId}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async getTaskById(taskId: string) {
    const res = await fetch(`http://localhost:3006/projects/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res.json();
  },

  async updateTask(taskId: string, data: UpdateTaskDto) {
    const res = await fetch(`http://localhost:3006/projects/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  async deleteTask(taskId: string) {
    await fetch(`http://localhost:3006/projects/tasks/${taskId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};
```

## 5. UI Implementation Tips

### Project List Page
- Display projects in a grid or list
- Show project name, description, task count, and last updated time
- Include "Create Project" button
- Each project card should link to the project detail page

### Project Detail Page (Kanban Board)
- Create 4 columns for task statuses: TODO, IN_PROGRESS, REVIEW, DONE
- Group tasks by status and display in respective columns
- Each task card shows:
  - Title
  - Priority badge (color-coded)
  - Assignee avatar/name
  - Quick actions (edit, delete)
- Add "Create Task" button
- Consider drag-and-drop for moving tasks between statuses (updates status via API)

### Task Detail Modal/Page
- Show full task information
- Display activity timeline (from `activities` array)
- Allow inline editing of title, description, status, priority, assignee
- Show assignee selector (list of users from your user service)

## 6. Activity Timeline Rendering

```typescript
function renderActivity(activity: TaskActivity) {
  const { type, payload, actor, createdAt } = activity;
  
  switch (type) {
    case 'CREATED':
      return `${actor.name} created this task`;
    case 'STATUS_CHANGED':
      return `${actor.name} moved from ${payload.from} to ${payload.to}`;
    case 'ASSIGNED':
      return `${actor.name} assigned this task`;
    case 'PRIORITY_CHANGED':
      return `${actor.name} changed priority from ${payload.from} to ${payload.to}`;
    default:
      return `${actor.name} updated this task`;
  }
}
```

## 7. Permissions Summary

- **Project Owner**: Can do everything (create, read, update, delete project and all tasks)
- **Task Assignee**: Can update their assigned tasks (status, etc.) but cannot delete
- **Non-Members**: Cannot access the project at all

(Note: Multi-member projects are not yet implemented but can be added in Phase 3)
