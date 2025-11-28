# Notification Service Integration Guide

This guide details how to integrate the Notification Service into the frontend application. It covers WebSocket connections, real-time events, and REST API endpoints.

## 1. Authentication

The Notification Service uses the same **JWT Authentication** as the Core Service.

-   **Token Source**: Use the JWT token obtained from the login flow.
-   **Header**: All HTTP requests must include the `Authorization` header: `Bearer <token>`.
-   **WebSocket**: The token must be passed in the WebSocket handshake (query param or auth object).

## 2. WebSocket Connection

Connect to the Notification Service using `socket.io-client`.

### Connection Setup

```javascript
import { io } from 'socket.io-client';

// URL should be your notification service URL (e.g., http://localhost:3005)
// Namespace is /ws/notifications
const socket = io('http://localhost:3005/ws/notifications', {
  query: {
    userId: 'CURRENT_USER_ID', // Required for now, will move to JWT later
  },
  // If JWT auth is enabled on gateway:
  // auth: {
  //   token: 'YOUR_JWT_TOKEN',
  // },
});

socket.on('connect', () => {
  console.log('Connected to Notification Service');
});
```

## 3. Real-time Events

### Listening for Events (Server -> Client)

#### `notification`
Received when a new notification is created (Follow, Like, Comment).

*   **Payload**:
    ```typescript
    interface NotificationEvent {
      id: string;
      type: 'FOLLOW' | 'LIKE' | 'COMMENT' | 'SYSTEM';
      message: string;
      actorId: string;
      postId?: string | null;
      createdAt: string; // ISO Date
      seen: boolean;
    }
    ```
*   **Usage**: Display a toast or update the notification bell counter.

## 4. REST API Endpoints

Base URL: `http://localhost:3005/notifications`

### Get My Notifications
Fetch the list of notifications for the current user.

*   **Method**: `GET`
*   **Endpoint**: `/`
*   **Headers**: `Authorization: Bearer <token>`
*   **Response**: Array of `Notification` objects.

### Mark as Read
Mark a specific notification as read.

*   **Method**: `PATCH`
*   **Endpoint**: `/:id/read`
*   **Headers**: `Authorization: Bearer <token>`
*   **Response**: Updated `Notification` object.

## 5. Notification Types

| Type | Description |
| :--- | :--- |
| `FOLLOW` | Someone followed the user. |
| `LIKE` | Someone liked the user's post. |
| `COMMENT` | Someone commented on the user's post. |
| `SYSTEM` | System-wide notification. |
