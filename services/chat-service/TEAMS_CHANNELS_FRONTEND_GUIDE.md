# Teams & Channels - Frontend Integration Guide

> **Complete A-Z guide for integrating Teams, Channels, Threads, Reactions, and Presence features into your React frontend**

You already have 1v1 chat working. This guide shows how to add Teams & Channels features alongside your existing implementation.

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Authentication](#authentication)
3. [Teams Management](#teams-management)
4. [Channels](#channels)
5. [Channel Messaging](#channel-messaging)
6. [Message Threads](#message-threads)
7. [Reactions](#reactions)
8. [Presence & Typing](#presence--typing)
9. [Complete Examples](#complete-examples)
10. [State Management](#state-management)
11. [Best Practices](#best-practices)

---

## Quick Start

### Installation

```bash
npm install socket.io-client axios
# Or with your existing setup
```

### Base Configuration

```typescript
// config/chat.ts
export const CHAT_API_URL = 'http://localhost:3002';
export const CHAT_WS_URL = 'http://localhost:3002';

// You likely already have this from 1v1 chat
export const getAuthHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('token')}`,
});
```

---

## Authentication

**Same as your existing 1v1 chat** - use the JWT token from your auth service.

```typescript
// Already working from your 1v1 chat
import { io } from 'socket.io-client';

const socket = io(CHAT_WS_URL, {
  auth: {
    token: localStorage.getItem('token'), // Your existing token
  },
});
```

---

## Teams Management

### TypeScript Types

```typescript
// types/teams.ts
export enum TeamRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

export interface Team {
  id: string;
  name: string;
  slug: string;
  description?: string;
  ownerId: string;
  createdAt: string;
  _count?: {
    members: number;
    channels: number;
  };
}

export interface TeamMember {
  id: string;
  userId: string;
  teamId: string;
  role: TeamRole;
  user: {
    id: string;
    name: string;
    handle: string;
    avatarUrl?: string;
  };
}
```

### API Functions

```typescript
// api/teams.ts
import axios from 'axios';
import { CHAT_API_URL, getAuthHeaders } from '../config/chat';

export const teamsApi = {
  // Create team
  create: async (data: { name: string; description?: string }) => {
    const res = await axios.post(`${CHAT_API_URL}/teams`, data, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  // List my teams
  getAll: async () => {
    const res = await axios.get(`${CHAT_API_URL}/teams`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  // Get team details
  getById: async (teamId: string) => {
    const res = await axios.get(`${CHAT_API_URL}/teams/${teamId}`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  // Add member
  addMember: async (teamId: string, data: { userId: string; role?: TeamRole }) => {
    const res = await axios.post(
      `${CHAT_API_URL}/teams/${teamId}/members`,
      data,
      { headers: getAuthHeaders() }
    );
    return res.data;
  },

  // Update member role
  updateRole: async (teamId: string, userId: string, role: TeamRole) => {
    const res = await axios.patch(
      `${CHAT_API_URL}/teams/${teamId}/members/${userId}/role`,
      { role },
      { headers: getAuthHeaders() }
    );
    return res.data;
  },

  // Remove member
  removeMember: async (teamId: string, userId: string) => {
    await axios.delete(
      `${CHAT_API_URL}/teams/${teamId}/members/${userId}`,
      { headers: getAuthHeaders() }
    );
  },
};
```

### React Hook Example

```typescript
// hooks/useTeams.ts
import { useState, useEffect } from 'react';
import { teamsApi } from '../api/teams';
import type { Team } from '../types/teams';

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    try {
      setLoading(true);
      const data = await teamsApi.getAll();
      setTeams(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTeam = async (name: string, description?: string) => {
    const team = await teamsApi.create({ name, description });
    setTeams((prev) => [...prev, team]);
    return team;
  };

  return { teams, loading, error, createTeam, refetch: loadTeams };
}
```

### UI Component Example

```typescript
// components/TeamSidebar.tsx
import { useTeams } from '../hooks/useTeams';
import { useState } from 'react';

export function TeamSidebar({ onSelectTeam }) {
  const { teams, loading, createTeam } = useTeams();
  const [showCreate, setShowCreate] = useState(false);
  const [teamName, setTeamName] = useState('');

  const handleCreate = async (e) => {
    e.preventDefault();
    await createTeam(teamName);
    setTeamName('');
    setShowCreate(false);
  };

  if (loading) return <div>Loading teams...</div>;

  return (
    <div className="team-sidebar">
      <h2>Teams</h2>
      
      {teams.map((team) => (
        <div
          key={team.id}
          className="team-item"
          onClick={() => onSelectTeam(team)}
        >
          <div className="team-icon">{team.name[0]}</div>
          <span>{team.name}</span>
          <span className="member-count">{team._count?.members || 0}</span>
        </div>
      ))}

      {showCreate ? (
        <form onSubmit={handleCreate}>
          <input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="Team name"
            autoFocus
          />
          <button type="submit">Create</button>
          <button type="button" onClick={() => setShowCreate(false)}>
            Cancel
          </button>
        </form>
      ) : (
        <button onClick={() => setShowCreate(true)}>+ New Team</button>
      )}
    </div>
  );
}
```

---

## Channels

### TypeScript Types

```typescript
// types/channels.ts
export enum ChannelType {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
}

export interface Channel {
  id: string;
  teamId: string;
  name: string;
  slug: string;
  description?: string;
  type: ChannelType;
  createdAt: string;
  _count?: {
    members: number;
    messages: number;
  };
}
```

### API Functions

```typescript
// api/channels.ts
export const channelsApi = {
  // Get team channels
  getByTeam: async (teamId: string) => {
    const res = await axios.get(`${CHAT_API_URL}/teams/${teamId}/channels`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  // Create channel
  create: async (teamId: string, data: {
    name: string;
    description?: string;
    type: ChannelType;
  }) => {
    const res = await axios.post(
      `${CHAT_API_URL}/teams/${teamId}/channels`,
      data,
      { headers: getAuthHeaders() }
    );
    return res.data;
  },

  // Get channel details
  getById: async (channelId: string) => {
    const res = await axios.get(`${CHAT_API_URL}/channels/${channelId}`, {
      headers: getAuthHeaders(),
    });
    return res.data;
  },

  // Get channel messages
  getMessages: async (channelId: string, params?: {
    skip?: number;
    take?: number;
  }) => {
    const res = await axios.get(
      `${CHAT_API_URL}/channels/${channelId}/messages`,
      {
        headers: getAuthHeaders(),
        params,
      }
    );
    return res.data;
  },

  // Add member to private channel
  addMember: async (channelId: string, userId: string) => {
    const res = await axios.post(
      `${CHAT_API_URL}/channels/${channelId}/members`,
      { userId },
      { headers: getAuthHeaders() }
    );
    return res.data;
  },
};
```

### UI Component Example

```typescript
// components/ChannelList.tsx
export function ChannelList({ teamId, onSelectChannel }) {
  const [channels, setChannels] = useState<Channel[]>([]);

  useEffect(() => {
    if (teamId) {
      channelsApi.getByTeam(teamId).then(setChannels);
    }
  }, [teamId]);

  const publicChannels = channels.filter((c) => c.type === 'PUBLIC');
  const privateChannels = channels.filter((c) => c.type === 'PRIVATE');

  return (
    <div className="channel-list">
      <div className="channel-section">
        <h3># Public Channels</h3>
        {publicChannels.map((channel) => (
          <div
            key={channel.id}
            className="channel-item"
            onClick={() => onSelectChannel(channel)}
          >
            # {channel.name}
          </div>
        ))}
      </div>

      <div className="channel-section">
        <h3>🔒 Private Channels</h3>
        {privateChannels.map((channel) => (
          <div
            key={channel.id}
            className="channel-item"
            onClick={() => onSelectChannel(channel)}
          >
            🔒 {channel.name}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Channel Messaging

### WebSocket Integration

**Build on your existing 1v1 chat socket** - same connection, different events!

```typescript
// hooks/useChannelSocket.ts
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { CHAT_WS_URL } from '../config/chat';

export function useChannelSocket(channelId: string | null) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Reuse your existing socket or create new one
    if (!socketRef.current) {
      socketRef.current = io(CHAT_WS_URL, {
        auth: {
          token: localStorage.getItem('token'),
        },
      });
    }

    const socket = socketRef.current;

    if (channelId) {
      // Join channel room
      socket.emit('joinChannel', { channelId });

      // Listen for messages
      const handleMessage = (message: any) => {
        // Add message to state
        console.log('New message:', message);
      };

      socket.on('channelMessageCreated', handleMessage);

      return () => {
        socket.emit('leaveChannel', { channelId });
        socket.off('channelMessageCreated', handleMessage);
      };
    }
  }, [channelId]);

  const sendMessage = (content: string, parentId?: string) => {
    if (socketRef.current && channelId) {
      socketRef.current.emit('sendChannelMessage', {
        channelId,
        content,
        parentId, // For thread replies
      });
    }
  };

  return { sendMessage, socket: socketRef.current };
}
```

### Channel Chat Component

```typescript
// components/ChannelChat.tsx
import { useState, useEffect } from 'react';
import { useChannelSocket } from '../hooks/useChannelSocket';
import { channelsApi } from '../api/channels';

export function ChannelChat({ channel }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const { sendMessage, socket } = useChannelSocket(channel?.id);

  // Load initial messages
  useEffect(() => {
    if (channel) {
      channelsApi.getMessages(channel.id).then((data) => {
        setMessages(data.messages);
      });
    }
  }, [channel]);

  // Listen for new messages
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message) => {
      setMessages((prev) => [...prev, message]);
    };

    socket.on('channelMessageCreated', handleNewMessage);
    return () => {
      socket.off('channelMessageCreated', handleNewMessage);
    };
  }, [socket]);

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="channel-chat">
      <div className="channel-header">
        <h2># {channel.name}</h2>
        <p>{channel.description}</p>
      </div>

      <div className="messages">
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}
      </div>

      <form onSubmit={handleSend} className="message-input">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Message #${channel.name}`}
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
```

---

## Message Threads

### API Functions

```typescript
// api/threads.ts
export const threadsApi = {
  // Get thread replies
  getReplies: async (messageId: string, params?: {
    skip?: number;
    take?: number;
  }) => {
    const res = await axios.get(
      `${CHAT_API_URL}/messages/${messageId}/replies`,
      {
        headers: getAuthHeaders(),
        params,
      }
    );
    return res.data;
  },

  // Get full thread
  getFull: async (messageId: string) => {
    const res = await axios.get(
      `${CHAT_API_URL}/messages/${messageId}/thread`,
      { headers: getAuthHeaders() }
    );
    return res.data;
  },

  // Get thread summary
  getSummary: async (messageId: string) => {
    const res = await axios.get(
      `${CHAT_API_URL}/messages/${messageId}/summary`,
      { headers: getAuthHeaders() }
    );
    return res.data;
  },
};
```

### Thread Component

```typescript
// components/ThreadView.tsx
import { useEffect, useState } from 'react';
import { threadsApi } from '../api/threads';
import { useChannelSocket } from '../hooks/useChannelSocket';

export function ThreadView({ message, onClose }) {
  const [thread, setThread] = useState(null);
  const [reply, setReply] = useState('');
  const { socket } = useChannelSocket(message.channelId);

  useEffect(() => {
    // Load thread
    threadsApi.getFull(message.id).then(setThread);

    // Join thread room for real-time updates
    if (socket) {
      socket.emit('joinThread', { messageId: message.id });

      const handleReply = (data) => {
        if (data.parentMessageId === message.id) {
          setThread((prev) => ({
            ...prev,
            replies: [...prev.replies, data.reply],
          }));
        }
      };

      socket.on('threadReplyAdded', handleReply);

      return () => {
        socket.emit('leaveThread', { messageId: message.id });
        socket.off('threadReplyAdded', handleReply);
      };
    }
  }, [message.id, socket]);

  const handleSendReply = (e) => {
    e.preventDefault();
    if (socket && reply.trim()) {
      socket.emit('sendThreadReply', {
        messageId: message.id,
        content: reply.trim(),
      });
      setReply('');
    }
  };

  if (!thread) return <div>Loading thread...</div>;

  return (
    <div className="thread-view">
      <div className="thread-header">
        <h3>Thread</h3>
        <button onClick={onClose}>×</button>
      </div>

      {/* Parent message */}
      <div className="parent-message">
        <Message message={thread.parent} />
      </div>

      {/* Replies */}
      <div className="thread-replies">
        {thread.replies.map((reply) => (
          <Message key={reply.id} message={reply} isReply />
        ))}
      </div>

      {/* Reply input */}
      <form onSubmit={handleSendReply} className="thread-input">
        <input
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          placeholder="Reply to thread..."
        />
        <button type="submit">Reply</button>
      </form>
    </div>
  );
}
```

### Show Thread Count on Messages

```typescript
// components/Message.tsx
export function Message({ message, onOpenThread }) {
  return (
    <div className="message">
      <img src={message.sender.avatarUrl} alt={message.sender.name} />
      <div className="message-content">
        <div className="message-header">
          <strong>{message.sender.name}</strong>
          <span>{formatTime(message.createdAt)}</span>
        </div>
        <p>{message.content}</p>

        {/* Thread indicator */}
        {message._count?.replies > 0 && (
          <button
            className="thread-indicator"
            onClick={() => onOpenThread(message)}
          >
            💬 {message._count.replies} {message._count.replies === 1 ? 'reply' : 'replies'}
          </button>
        )}
      </div>
    </div>
  );
}
```

---

## Reactions

### API Functions

```typescript
// api/reactions.ts
export const reactionsApi = {
  // Add reaction
  add: async (messageId: string, emoji: string) => {
    const res = await axios.post(
      `${CHAT_API_URL}/messages/${messageId}/reactions`,
      { emoji },
      { headers: getAuthHeaders() }
    );
    return res.data;
  },

  // Remove reaction
  remove: async (messageId: string, emoji: string) => {
    await axios.delete(
      `${CHAT_API_URL}/messages/${messageId}/reactions/${emoji}`,
      { headers: getAuthHeaders() }
    );
  },

  // Get reactions
  get: async (messageId: string) => {
    const res = await axios.get(
      `${CHAT_API_URL}/messages/${messageId}/reactions`,
      { headers: getAuthHeaders() }
    );
    return res.data;
  },
};
```

### WebSocket Reactions

```typescript
// Real-time reactions
useEffect(() => {
  if (!socket) return;

  const handleReactionAdded = (data) => {
    // Update message with new reaction
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === data.messageId
          ? { ...msg, reactions: [...(msg.reactions || []), data] }
          : msg
      )
    );
  };

  const handleReactionRemoved = (data) => {
    // Remove reaction from message
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === data.messageId
          ? {
              ...msg,
              reactions: msg.reactions.filter(
                (r) => !(r.userId === data.userId && r.emoji === data.emoji)
              ),
            }
          : msg
      )
    );
  };

  socket.on('reactionAdded', handleReactionAdded);
  socket.on('reactionRemoved', handleReactionRemoved);

  return () => {
    socket.off('reactionAdded', handleReactionAdded);
    socket.off('reactionRemoved', handleReactionRemoved);
  };
}, [socket]);

// Add reaction via WebSocket
const addReaction = (messageId: string, emoji: string) => {
  socket?.emit('addReaction', { messageId, emoji });
};

// Or use REST API
const addReaction = async (messageId: string, emoji: string) => {
  await reactionsApi.add(messageId, emoji);
};
```

### Reaction Picker Component

```typescript
// components/ReactionPicker.tsx
const COMMON_EMOJIS = ['👍', '❤️', '😂', '😮', '🎉', '🚀'];

export function ReactionPicker({ messageId, onReact }) {
  const [show, setShow] = useState(false);

  const handleClick = (emoji: string) => {
    onReact(messageId, emoji);
    setShow(false);
  };

  return (
    <div className="reaction-picker">
      <button onClick={() => setShow(!show)}>😀</button>
      {show && (
        <div className="emoji-popup">
          {COMMON_EMOJIS.map((emoji) => (
            <button key={emoji} onClick={() => handleClick(emoji)}>
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Usage in Message component
<ReactionPicker
  messageId={message.id}
  onReact={(msgId, emoji) => addReaction(msgId, emoji)}
/>
```

---

## Presence & Typing

### Online Status

```typescript
// The WebSocket automatically tracks online/offline
// Listen for presence events
useEffect(() => {
  if (!socket) return;

  const handleUserOnline = ({ userId }) => {
    // Update user status
    setOnlineUsers((prev) => [...prev, userId]);
  };

  const handleUserOffline = ({ userId }) => {
    setOnlineUsers((prev) => prev.filter((id) => id !== userId));
  };

  socket.on('userOnline', handleUserOnline);
  socket.on('userOffline', handleUserOffline);

  return () => {
    socket.off('userOnline', handleUserOnline);
    socket.off('userOffline', handleUserOffline);
  };
}, [socket]);
```

### Typing Indicators

```typescript
// hooks/useTypingIndicator.ts
import { useEffect, useState, useCallback } from 'react';

export function useTypingIndicator(socket: Socket | null, channelId: string) {
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  let typingTimeout: NodeJS.Timeout;

  useEffect(() => {
    if (!socket) return;

    const handleTyping = ({ userId, channelId: chan }) => {
      if (chan === channelId) {
        setTypingUsers((prev) => new Set(prev).add(userId));
      }
    };

    const handleStopTyping = ({ userId, channelId: chan }) => {
      if (chan === channelId) {
        setTypingUsers((prev) => {
          const updated = new Set(prev);
          updated.delete(userId);
          return updated;
        });
      }
    };

    socket.on('userTypingChannel', handleTyping);
    socket.on('userStoppedTypingChannel', handleStopTyping);

    return () => {
      socket.off('userTypingChannel', handleTyping);
      socket.off('userStoppedTypingChannel', handleStopTyping);
    };
  }, [socket, channelId]);

  const startTyping = useCallback(() => {
    if (socket && channelId) {
      socket.emit('typingChannel', { channelId });

      // Auto-stop after 3 seconds
      clearTimeout(typingTimeout);
      typingTimeout = setTimeout(() => {
        socket.emit('stopTypingChannel', { channelId });
      }, 3000);
    }
  }, [socket, channelId]);

  const stopTyping = useCallback(() => {
    if (socket && channelId) {
      clearTimeout(typingTimeout);
      socket.emit('stopTypingChannel', { channelId });
    }
  }, [socket, channelId]);

  return { typingUsers: Array.from(typingUsers), startTyping, stopTyping };
}

// Usage
const { typingUsers, startTyping, stopTyping } = useTypingIndicator(socket, channel.id);

<input
  onChange={(e) => {
    setInput(e.target.value);
    startTyping();
  }}
  onBlur={stopTyping}
/>

{typingUsers.length > 0 && (
  <div className="typing-indicator">
    {typingUsers.map(id => getUserName(id)).join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
  </div>
)}
```

---

## Complete Examples

### Full Channel Chat with All Features

```typescript
// pages/ChannelPage.tsx
import { useState } from 'react';
import { TeamSidebar } from '../components/TeamSidebar';
import { ChannelList } from '../components/ChannelList';
import { ChannelChat } from '../components/ChannelChat';
import { ThreadView } from '../components/ThreadView';

export function ChannelPage() {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [threadMessage, setThreadMessage] = useState(null);

  return (
    <div className="channel-page">
      {/* Teams sidebar */}
      <TeamSidebar onSelectTeam={setSelectedTeam} />

      {/* Channels list */}
      {selectedTeam && (
        <ChannelList
          teamId={selectedTeam.id}
          onSelectChannel={setSelectedChannel}
        />
      )}

      {/* Main chat area */}
      {selectedChannel && (
        <ChannelChat
          channel={selectedChannel}
          onOpenThread={setThreadMessage}
        />
      )}

      {/* Thread sidebar */}
      {threadMessage && (
        <ThreadView
          message={threadMessage}
          onClose={() => setThreadMessage(null)}
        />
      )}
    </div>
  );
}
```

---

## State Management

### Using Zustand (Recommended)

```typescript
// store/chatStore.ts
import create from 'zustand';

interface ChatState {
  teams: Team[];
  selectedTeam: Team | null;
  selectedChannel: Channel | null;
  channels: Record<string, Channel[]>; // teamId -> channels
  messages: Record<string, Message[]>; // channelId -> messages
  
  setTeams: (teams: Team[]) => void;
  selectTeam: (team: Team) => void;
  selectChannel: (channel: Channel) => void;
  addMessage: (channelId: string, message: Message) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  teams: [],
  selectedTeam: null,
  selectedChannel: null,
  channels: {},
  messages: {},

  setTeams: (teams) => set({ teams }),
  selectTeam: (team) => set({ selectedTeam: team }),
  selectChannel: (channel) => set({ selectedChannel: channel }),
  
  addMessage: (channelId, message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [channelId]: [...(state.messages[channelId] || []), message],
      },
    })),
}));
```

---

## Best Practices

### 1. **Socket Connection Management**

```typescript
// Use a single socket instance across your app
// Reuse your existing 1v1 chat socket

// providers/SocketProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const newSocket = io(CHAT_WS_URL, {
      auth: { token: localStorage.getItem('token') },
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
```

### 2. **Optimistic Updates**

```typescript
// Add message optimistically
const sendMessage = (content: string) => {
  // Add to UI immediately
  const tempMessage = {
    id: `temp-${Date.now()}`,
    content,
    sender: currentUser,
    createdAt: new Date().toISOString(),
  };
  setMessages((prev) => [...prev, tempMessage]);

  // Send to server
  socket.emit('sendChannelMessage', {
    channelId,
    content,
  });
};

// Replace temp message when real one arrives
socket.on('channelMessageCreated', (message) => {
  setMessages((prev) =>
    prev.map((msg) =>
      msg.id.startsWith('temp-') && msg.content === message.content
        ? message
        : msg
    )
  );
});
```

### 3. **Pagination**

```typescript
// Infinite scroll for messages
const loadMore = async () => {
  const { messages, hasMore } = await channelsApi.getMessages(channelId, {
    skip: currentMessages.length,
    take: 50,
  });
  
  setMessages((prev) => [...messages, ...prev]); // Prepend older messages
};
```

### 4. **Error Handling**

```typescript
// Listen for WebSocket errors
socket.on('error', ({ message }) => {
  toast.error(message);
});

// Retry logic for API calls
const withRetry = async (fn, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)));
    }
  }
};
```

---

## Quick Reference

### REST Endpoints

```
Teams:
  GET    /teams
  POST   /teams
  GET    /teams/:id
  PATCH  /teams/:id
  DELETE /teams/:id
  POST   /teams/:id/members
  DELETE /teams/:id/members/:userId
  PATCH  /teams/:id/members/:userId/role

Channels:
  GET    /teams/:id/channels
  POST   /teams/:id/channels
  GET    /channels/:id
  GET    /channels/:id/messages
  POST   /channels/:id/members
  DELETE /channels/:id/members/:userId

Threads:
  GET    /messages/:id/replies
  GET    /messages/:id/thread
  GET    /messages/:id/participants
  GET    /messages/:id/summary

Reactions:
  POST   /messages/:id/reactions
  DELETE /messages/:id/reactions/:emoji
  GET    /messages/:id/reactions
```

### WebSocket Events

```typescript
// Client → Server
socket.emit('joinChannel', { channelId })
socket.emit('leaveChannel', { channelId })
socket.emit('sendChannelMessage', { channelId, content, parentId? })
socket.emit('typingChannel', { channelId })
socket.emit('stopTypingChannel', { channelId })
socket.emit('addReaction', { messageId, emoji })
socket.emit('removeReaction', { messageId, emoji })
socket.emit('joinThread', { messageId })
socket.emit('leaveThread', { messageId })
socket.emit('sendThreadReply', { messageId, content })

// Server → Client
socket.on('channelMessageCreated', (message) => {})
socket.on('userTypingChannel', ({ userId, channelId }) => {})
socket.on('userStoppedTypingChannel', ({ userId, channelId }) => {})
socket.on('reactionAdded', ({ messageId, userId, emoji, user }) => {})
socket.on('reactionRemoved', ({ messageId, userId, emoji }) => {})
socket.on('threadReplyAdded', ({ parentMessageId, reply }) => {})
socket.on('userOnline', ({ userId }) => {})
socket.on('userOffline', ({ userId }) => {})
```

---

## Need Help?

- **WebSocket Guide**: See `CHANNELS_WEBSOCKET_GUIDE.md` for detailed WebSocket examples
- **Database Schema**: Check Prisma schema for data structure
- **Existing 1v1 Chat**: Most patterns are the same, just different event names!

**Your existing 1v1 chat code is 80% reusable - just add new event handlers! 🚀**
