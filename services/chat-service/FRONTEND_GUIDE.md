# Frontend Developer Guide: Chat Service Integration

This guide provides a complete reference for integrating the Chat Service into the frontend application. It covers authentication, WebSocket connection, real-time events, and REST API endpoints.

## 1. Authentication

The Chat Service uses the same **JWT Authentication** as the Core Service.

-   **Token Source**: Use the JWT token obtained from the login flow.
-   **Header**: All HTTP requests must include the `Authorization` header: `Bearer <token>`.
-   **WebSocket**: The token must be passed in the WebSocket handshake (see below).

## 2. WebSocket Connection

We use `socket.io-client` to connect to the Chat Service.

### Connection Setup

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3004', {
  auth: {
    token: 'YOUR_JWT_TOKEN', // Pass the JWT token here
  },
});

socket.on('connect', () => {
  console.log('Connected to Chat Service:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('Connection failed:', err.message);
});
```

## 3. Real-time Events

### Emitting Events (Client -> Server)

#### `joinRoom`
Join a specific conversation room to receive messages.
*   **Payload**: `{ conversationId: string }`
*   **Example**:
    ```javascript
    socket.emit('joinRoom', { conversationId: 'uuid-123' });
    ```

#### `sendMessage`
Send a new message to a conversation.
*   **Payload**:
    ```typescript
    {
      conversationId: string;
      content?: string;
      attachmentUrl?: string;
    }
    ```
*   **Example**:
    ```javascript
    socket.emit('sendMessage', {
      conversationId: 'uuid-123',
      content: 'Hello world!',
    });
    ```

#### `markRead`
Mark a specific message as read.
*   **Payload**: `{ conversationId: string, messageId: string }`
*   **Example**:
    ```javascript
    socket.emit('markRead', {
      conversationId: 'uuid-123',
      messageId: 'msg-456',
    });
    ```

#### `typing`
Indicate that you're typing in a conversation.
*   **Payload**: `{ conversationId: string }`
*   **Example**:
    ```javascript
    socket.emit('typing', { conversationId: 'uuid-123' });
    ```

#### `stopTyping`
Indicate that you've stopped typing.
*   **Payload**: `{ conversationId: string }`
*   **Example**:
    ```javascript
    socket.emit('stopTyping', { conversationId: 'uuid-123' });
    ```

### Listening for Events (Server -> Client)

#### `newMessage`
Received when a new message is sent to the room.
*   **Payload**: `Message` object (see Data Types).
*   **Usage**: Append this message to your UI list.

#### `messageRead`
Received when another user reads a message.
*   **Payload**:
    ```typescript
    {
      userId: string;
      messageId: string;
      conversationId: string;
    }
    ```
*   **Usage**: Update the "read receipt" status in the UI.

#### `userTyping`
Received when another user starts typing.
*   **Payload**:
    ```typescript
    {
      userId: string;
      conversationId: string;
    }
    ```
*   **Usage**: Show "User is typing..." indicator.

#### `userStoppedTyping`
Received when another user stops typing.
*   **Payload**:
    ```typescript
    {
      userId: string;
      conversationId: string;
    }
    ```
*   **Usage**: Hide typing indicator.

#### `userOnline`
Received when a user comes online.
*   **Payload**: `{ userId: string }`
*   **Usage**: Update user's online status badge to green.

#### `userOffline`
Received when a user goes offline.
*   **Payload**: `{ userId: string }`
*   **Usage**: Update user's online status badge to gray.

## 4. REST API Endpoints

Base URL: `http://localhost:3004/chat`

### Start Conversation
Create a new conversation or get existing one with another user.
*   **Method**: `POST`
*   **Endpoint**: `/conversations/start`
*   **Body**: `{ recipientId: string }`
*   **Response**: `Conversation` object
*   **Example**:
    ```javascript
    const res = await fetch('http://localhost:3004/chat/conversations/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ recipientId: 'user-abc-123' })
    });
    const conversation = await res.json();
    ```

### Upload File
Upload an image or file for chat attachments.
*   **Method**: `POST`
*   **Endpoint**: `/upload`
*   **Body**: `FormData` with key `file`.
*   **Response**: `{ url: string }`
*   **Example**:
    ```javascript
    const formData = new FormData();
    formData.append('file', fileInput.files[0]);
    
    const res = await fetch('http://localhost:3004/chat/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    const { url } = await res.json();
    ```

### Get Conversations
Fetch the list of conversations for the current user.
*   **Method**: `GET`
*   **Endpoint**: `/conversations`
*   **Response**: Array of `Conversation` objects.

### Get Messages
Fetch message history for a specific conversation.
*   **Method**: `GET`
*   **Endpoint**: `/:conversationId/messages`
*   **Response**: Array of `Message` objects.

### Get Unread Count
Get total unread message count across all conversations.
*   **Method**: `GET`
*   **Endpoint**: `/unread-count`
*   **Response**: `{ unreadCount: number }`

## 5. Data Types

### Message
```typescript
interface Message {
  id: string;
  content?: string;
  attachmentUrl?: string;
  createdAt: string;
  senderId: string;
  conversationId: string;
  sender: {
    id: string;
    name: string;
    handle: string;
    avatarUrl?: string;
  };
}
```

### Conversation
```typescript
interface Conversation {
  id: string;
  participants: {
    user: {
      id: string;
      name: string;
      handle: string;
      avatarUrl?: string;
    };
  }[];
  messages: Message[];
}
```

## 6. Complete Example

Here's a complete example of a chat implementation:

```javascript
import { io } from 'socket.io-client';

// Connect to chat service
const socket = io('http://localhost:3004', {
  auth: { token: localStorage.getItem('token') }
});

// Handle connection events
socket.on('connect', () => console.log('Connected'));
socket.on('userOnline', ({ userId }) => updateUserStatus(userId, 'online'));
socket.on('userOffline', ({ userId }) => updateUserStatus(userId, 'offline'));

// Start a conversation (from user profile)
async function startChat(otherUserId) {
  const res = await fetch('/chat/conversations/start', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ recipientId: otherUserId })
  });
  const conversation = await res.json();
  
  // Join the room
  socket.emit('joinRoom', { conversationId: conversation.id });
  
  // Listen for new messages
  socket.on('newMessage', (message) => {
    appendMessageToUI(message);
  });
  
  // Listen for typing indicators
  socket.on('userTyping', ({ userId, conversationId }) => {
    showTypingIndicator(userId);
  });
  
  socket.on('userStoppedTyping', ({ userId }) => {
    hideTypingIndicator(userId);
  });
  
  return conversation;
}

// Send a message
function sendMessage(conversationId, content) {
  socket.emit('sendMessage', { conversationId, content });
}

// Handle typing
let typingTimeout;
function handleTyping(conversationId) {
  socket.emit('typing', { conversationId });
  
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('stopTyping', { conversationId });
  }, 3000);
}
```

