# Notification Service - Frontend Guide

## Overview
The Notification Service handles real-time updates for user interactions such as follows, likes, and comments. It uses **Socket.IO** for real-time events and provides a **REST API** for retrieving notification history and managing read status.

## 📡 Connection Details

### WebSocket URL
- **Base URL**: `http://localhost:3002` (or your deployed URL)
- **Namespace**: `/ws/notifications`
- **Full Connection String**: `http://localhost:3002/ws/notifications`

### Authentication
Currently, the WebSocket connection requires a `userId` in the query parameters to identify the user.
> **Note**: Future improvements may require a JWT in the `Authorization` header or handshake auth.

**Query Parameter**: `?userId=<YOUR_USER_ID>`

## 🔌 Real-Time Events

### 1. Connecting
When connecting, pass the `userId` in the query options.

```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3002/ws/notifications", {
  query: {
    userId: "user-uuid-123"
  }
});

socket.on("connect", () => {
  console.log("Connected to notifications!");
});
```

### 2. Listening for Notifications
Listen for the `notification` event to receive real-time updates.

**Event Name**: `notification`

**Payload Structure**:
```typescript
interface NotificationPayload {
  id: string;          // Unique ID of the notification
  type: 'FOLLOW' | 'LIKE' | 'COMMENT';
  message: string;     // Human-readable message (e.g., "John started following you")
  actorId: string;     // ID of the user who performed the action
  postId?: string;     // ID of the related post (if applicable)
  createdAt: string;   // ISO 8601 Date string
  seen: boolean;       // Read status (default: false)
}
```

**Example Handler**:
```javascript
socket.on("notification", (data) => {
  console.log("New Notification:", data);
  // Update UI, show toast, increment badge count, etc.
});
```

## 🌐 REST API

The service exposes REST endpoints for managing notification history.
**Base URL**: `http://localhost:3002`

### 1. Get My Notifications
Fetch the list of notifications for the authenticated user.

- **Endpoint**: `GET /notifications`
- **Headers**:
  - `Authorization`: `Bearer <YOUR_JWT_TOKEN>`
- **Response**: Array of `Notification` objects (same structure as payload).

### 2. Mark as Read
Mark a specific notification as seen.

- **Endpoint**: `PATCH /notifications/:id/read`
- **Headers**:
  - `Authorization`: `Bearer <YOUR_JWT_TOKEN>`
- **Response**: The updated notification object.

## 🧪 Testing Integration

To test the integration without relying on other services:
1. Connect to the WebSocket using the details above.
2. Trigger an action in the `core-service` (e.g., like a post or follow a user) if the backend is fully running.
3. Alternatively, you can manually emit an event if you have access to the backend console, but the best way is to use the actual flow.

## 🛠️ Example React Hook

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useNotifications = (userId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    const newSocket = io("http://localhost:3002/ws/notifications", {
      query: { userId }
    });

    newSocket.on("connect", () => {
      console.log("Connected to notification service");
    });

    newSocket.on("notification", (notification) => {
      setNotifications(prev => [notification, ...prev]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [userId]);

  return { socket, notifications };
};
```
