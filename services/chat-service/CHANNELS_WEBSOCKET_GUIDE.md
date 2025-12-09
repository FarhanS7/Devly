# Teams & Channels WebSocket API

## Connection

Connect to the WebSocket server with JWT authentication:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3004', {
  auth: {
    token: 'YOUR_JWT_TOKEN', // Required
  },
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('error', (error) => {
  console.error('Error:', error.message);
});
```

---

## Channel Events

### Client → Server

#### `joinChannel`
Join a channel room to receive messages.

**Payload**:
```typescript
{
  channelId: string;
}
```

**Example**:
```javascript
socket.emit('joinChannel', { channelId: 'channel-uuid-123' });
```

**Server Response**:
- If successful: User added to room, `channelMemberJoined` broadcast to others
- If unauthorized: `error` event with message

---

#### `leaveChannel`
Leave a channel room.

**Payload**:
```typescript
{
  channelId: string;
}
```

**Example**:
```javascript
socket.emit('leaveChannel', { channelId: 'channel-uuid-123' });
```

**Server Response**:
- `channelMemberLeft` broadcast to others in channel

---

#### `sendChannelMessage`
Send a message to a channel.

**Payload**:
```typescript
{
  channelId: string;
  content?: string;
  attachmentUrl?: string;
  parentId?: string; // For thread replies (optional)
}
```

**Example**:
```javascript
// Regular message
socket.emit('sendChannelMessage', {
  channelId: 'channel-uuid-123',
  content: 'Hello everyone!',
});

// Thread reply
socket.emit('sendChannelMessage', {
  channelId: 'channel-uuid-123',
  content: 'Reply to thread',
  parentId: 'message-uuid-456', // ID of parent message
});

// With attachment
socket.emit('sendChannelMessage', {
  channelId: 'channel-uuid-123',
  content: 'Check this out',
  attachmentUrl: '/uploads/chat/file.png',
});
```

**Server Response**:
- `channelMessageCreated` broadcast to all channel members (including sender)

---

#### `typingChannel`
Indicate that user is typing in a channel.

**Payload**:
```typescript
{
  channelId: string;
}
```

**Example**:
```javascript
socket.emit('typingChannel', { channelId: 'channel-uuid-123' });
```

**Server Response**:
- `userTypingChannel` broadcast to others in channel

**Note**: Should be debounced on the client side.

---

#### `stopTypingChannel`
Indicate that user stopped typing.

**Payload**:
```typescript
{
  channelId: string;
}
```

**Example**:
```javascript
socket.emit('stopTypingChannel', { channelId: 'channel-uuid-123' });
```

**Server Response**:
- `userStoppedTypingChannel` broadcast to others in channel

---

### Server → Client

#### `channelMessageCreated`
New message was created in a channel you're in.

**Payload**:
```typescript
{
  id: string;
  channelId: string;
  senderId: string;
  content?: string;
  attachmentUrl?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  sender: {
    id: string;
    name: string;
    handle: string;
    avatarUrl?: string;
  };
  parent?: {
    id: string;
    content: string;
    sender: {
      id: string;
      name: string;
      handle: string;
    };
  };
  _count: {
    replies: number;
    reactions: number;
  };
}
```

**Example**:
```javascript
socket.on('channelMessageCreated', (message) => {
  console.log('New message:', message);
  // Add to UI
  addMessageToChannel(message.channelId, message);
});
```

---

#### `channelMemberJoined`
A user joined the channel room.

**Payload**:
```typescript
{
  userId: string;
  channelId: string;
}
```

**Example**:
```javascript
socket.on('channelMemberJoined', ({ userId, channelId }) => {
  console.log(`User ${userId} joined channel ${channelId}`);
  // Update UI presence
});
```

---

#### `channelMemberLeft`
A user left the channel room.

**Payload**:
```typescript
{
  userId: string;
  channelId: string;
}
```

**Example**:
```javascript
socket.on('channelMemberLeft', ({ userId, channelId }) => {
  console.log(`User ${userId} left channel ${channelId}`);
  // Update UI presence
});
```

---

#### `userTypingChannel`
Someone is typing in a channel.

**Payload**:
```typescript
{
  userId: string;
  channelId: string;
}
```

**Example**:
```javascript
socket.on('userTypingChannel', ({ userId, channelId }) => {
  // Show "User is typing..." indicator
  showTypingIndicator(channelId, userId);
});
```

---

#### `userStoppedTypingChannel`
Someone stopped typing.

**Payload**:
```typescript
{
  userId: string;
  channelId: string;
}
```

**Example**:
```javascript
socket.on('userStoppedTypingChannel', ({ userId, channelId }) => {
  // Hide typing indicator
  hideTypingIndicator(channelId, userId);
});
```

---

#### `error`
Error occurred during an operation.

**Payload**:
```typescript
{
  message: string;
}
```

**Example**:
```javascript
socket.on('error', (error) => {
  console.error('WebSocket error:', error.message);
  // Show error toast
});
```

---

## Complete Example: Channel Chat

```javascript
import { io } from 'socket.io-client';
import { useState, useEffect } from 'react';

function ChannelChat({ channelId, currentUserId, token }) {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState(new Set());

  useEffect(() => {
    // Connect
    const newSocket = io('http://localhost:3004', {
      auth: { token },
    });

    newSocket.on('connect', () => {
      // Join channel room
      newSocket.emit('joinChannel', { channelId });
    });

    // Listen for messages
    newSocket.on('channelMessageCreated', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Listen for typing
    newSocket.on('userTypingChannel', ({ userId }) => {
      if (userId !== currentUserId) {
        setTypingUsers((prev) => new Set(prev).add(userId));
      }
    });

    newSocket.on('userStoppedTypingChannel', ({ userId }) => {
      setTypingUsers((prev) => {
        const updated = new Set(prev);
        updated.delete(userId);
        return updated;
      });
    });

    newSocket.on('error', (error) => {
      console.error(error.message);
    });

    setSocket(newSocket);

    return () => {
      if (newSocket) {
        newSocket.emit('leaveChannel', { channelId });
        newSocket.disconnect();
      }
    };
  }, [channelId, token, currentUserId]);

  const sendMessage = (content) => {
    if (socket && content.trim()) {
      socket.emit('sendChannelMessage', {
        channelId,
        content: content.trim(),
      });
    }
  };

  const handleTyping = () => {
    socket?.emit('typingChannel', { channelId });
  };

  const handleStopTyping = () => {
    socket?.emit('stopTypingChannel', { channelId });
  };

  return (
    <div>
      <MessageList messages={messages} />
      {typingUsers.size > 0 && <TypingIndicator users={typingUsers} />}
      <MessageInput
        onSend={sendMessage}
        onTyping={handleTyping}
        onStopTyping={handleStopTyping}
      />
    </div>
  );
}
```

---

## Thread Replies Example

```javascript
// Send a thread reply
function replyToMessage(parentMessageId, content) {
  socket.emit('sendChannelMessage', {
    channelId,
    content,
    parentId: parentMessageId,
  });
}

// The message will be saved with parentId and broadcast
socket.on('channelMessageCreated', (message) => {
  if (message.parentId) {
    // This is a thread reply
    addReplyToThread(message.parentId, message);
  } else {
    // Top-level message
    addMessageToChannel(message);
  }
});
```

---

## Best Practices

1. **Debounce Typing Events**: Don't send typing events on every keystroke
   ```javascript
   const debounce = (func, wait) => {
     let timeout;
     return (...args) => {
       clearTimeout(timeout);
       timeout = setTimeout(() => func(...args), wait);
     };
   };

   const debouncedTyping = debounce(() => {
     socket.emit('typingChannel', { channelId });
   }, 300);
   ```

2. **Auto Stop Typing**: Clear typing after idle
   ```javascript
   let typingTimeout;
   function handleTyping() {
     socket.emit('typingChannel', { channelId });
     clearTimeout(typingTimeout);
     typingTimeout = setTimeout(() => {
       socket.emit('stopTypingChannel', { channelId });
     }, 3000);
   }
   ```

3. **Reconnection**: Handle disconnects gracefully
   ```javascript
   socket.on('disconnect', () => {
     console.log('Disconnected, reconnecting...');
   });

   socket.on('connect', () => {
     // Rejoin all channels
     currentChannels.forEach(channelId => {
       socket.emit('joinChannel', { channelId });
     });
   });
   ```

4. **Leave Channels**: Always leave when unmounting
   ```javascript
   useEffect(() => {
     return () => {
       socket.emit('leaveChannel', { channelId });
     };
   }, [channelId]);
   ```

---

## Error Handling

All channel operations validate permissions. Common errors:

- **"You are not a member of this channel"**: User tried to join/send to channel they're not in
  - Solution: Use REST API to add user to channel first (`POST /channels/:id/members`)

- **"Failed to send message"**: Database error or validation failed
  - Solution: Check message content and try again

---

## Migration from DMs

The channel events coexist with the existing DM events. You can use both:

**DM Events** (port 3004):
- `joinRoom` → 1-on-1 conversation
- `sendMessage` → DM
- `typing` → DM typing

**Channel Events** (same port):
- `joinChannel` → team channel
- `sendChannelMessage` → channel message
- `typingChannel` → channel typing

**Example**:
```javascript
// Same socket, different events
socket.emit('joinRoom', { conversationId }); // DM
socket.emit('joinChannel', { channelId });    // Channel
```
