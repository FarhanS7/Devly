import { UseGuards } from '@nestjs/common';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';
import { ChannelsService } from '../channels/channels.service';
import { PresenceService } from '../presence/presence.service';
import { ReactionsService } from '../reactions/reactions.service';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly channelsService: ChannelsService,
    private readonly presenceService: PresenceService,
    private readonly reactionsService: ReactionsService,
  ) {}

  @UseGuards(WsJwtGuard)
  async handleConnection(client: any) {
    // Token validation is handled by WsJwtGuard
    // The guard attaches user info to the socket
    const userId = client.user?.sub;
    
    if (userId) {
      // Track online user in Redis
      await this.presenceService.setUserOnline(userId, client.id);
      
      // Broadcast to all connected clients that this user is online
      this.server.emit('userOnline', { userId });
      
      console.log(`User ${userId} connected (${client.id})`);
    } else {
      console.log(`Client connected: ${client.id}`);
    }
  }

  async handleDisconnect(client: any) {
    // Remove user from online tracking in Redis
    const userId = client.user?.sub;
    if (userId) {
      await this.presenceService.setUserOffline(userId);
      
      // Broadcast to all connected clients that this user is offline
      this.server.emit('userOffline', { userId });
      
      console.log(`User ${userId} disconnected (${client.id})`);
    } else {
      console.log(`Client disconnected: ${client.id}`);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: any,
    @MessageBody() payload: { conversationId: string },
  ) {
    const userId = client.user.sub; // Extracted from token by Guard
    // Validate participation
    const canJoin = await this.chatService.isParticipant(userId, payload.conversationId);
    if (canJoin) {
      client.join(payload.conversationId);
      console.log(`User ${userId} joined room ${payload.conversationId}`);
    } else {
      console.warn(`User ${userId} tried to join room ${payload.conversationId} but is not a participant`);
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: any,
    @MessageBody() payload: { conversationId: string; content?: string; attachmentUrl?: string },
  ) {
    const userId = client.user.sub;
    const message = await this.chatService.saveMessage(userId, payload);
    this.server.to(payload.conversationId).emit('newMessage', message);
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('markRead')
  async handleMarkRead(
    @ConnectedSocket() client: any,
    @MessageBody() payload: { conversationId: string; messageId: string },
  ) {
    const userId = client.user.sub;
    await this.chatService.markRead(userId, payload.conversationId, payload.messageId);
    // Notify others in the room
    client.to(payload.conversationId).emit('messageRead', {
      userId: userId,
      messageId: payload.messageId,
      conversationId: payload.conversationId,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: any,
    @MessageBody() payload: { conversationId: string },
  ) {
    const userId = client.user.sub;
    // Broadcast typing event to others in the conversation room
    client.to(payload.conversationId).emit('userTyping', {
      userId,
      conversationId: payload.conversationId,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('stopTyping')
  handleStopTyping(
    @ConnectedSocket() client: any,
    @MessageBody() payload: { conversationId: string },
  ) {
    const userId = client.user.sub;
    // Broadcast stop typing event to others in the conversation room
    client.to(payload.conversationId).emit('userStoppedTyping', {
      userId,
      conversationId: payload.conversationId,
    });
  }

  // ===============================================
  // CHANNEL EVENTS (Teams & Channels)
  // ===============================================

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinChannel')
  async handleJoinChannel(
    @ConnectedSocket() client: any,
    @MessageBody() payload: { channelId: string },
  ) {
    const userId = client.user.sub;
    
    // Verify user is a channel member
    const isMember = await this.channelsService.isMember(payload.channelId, userId);
    
    if (isMember) {
      client.join(payload.channelId);
      console.log(`User ${userId} joined channel ${payload.channelId}`);
      
      // Notify others in the channel
      client.to(payload.channelId).emit('channelMemberJoined', {
        userId,
        channelId: payload.channelId,
      });
    } else {
      console.warn(`User ${userId} tried to join channel ${payload.channelId} but is not a member`);
      client.emit('error', { message: 'You are not a member of this channel' });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveChannel')
  handleLeaveChannel(
    @ConnectedSocket() client: any,
    @MessageBody() payload: { channelId: string },
  ) {
    const userId = client.user.sub;
    client.leave(payload.channelId);
    console.log(`User ${userId} left channel ${payload.channelId}`);
    
    // Notify others in the channel
    client.to(payload.channelId).emit('channelMemberLeft', {
      userId,
      channelId: payload.channelId,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendChannelMessage')
  async handleSendChannelMessage(
    @ConnectedSocket() client: any,
    @MessageBody() payload: {
      channelId: string;
      content?: string;
      attachmentUrl?: string;
      parentId?: string; // For thread replies
    },
  ) {
    const userId = client.user.sub;
    
    try {
      // Verify membership
      const isMember = await this.channelsService.isMember(payload.channelId, userId);
      if (!isMember) {
        client.emit('error', { message: 'You are not a member of this channel' });
        return;
      }

      // Save message to database
      const message = await this.chatService.saveChannelMessage(userId, payload);
      
      // Broadcast to all users in the channel room
      this.server.to(payload.channelId).emit('channelMessageCreated', message);
    } catch (error) {
      console.error('Error sending channel message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('typingChannel')
  async handleTypingChannel(
    @ConnectedSocket() client: any,
    @MessageBody() payload: { channelId: string },
  ) {
    const userId = client.user.sub;
    
    // Store typing state in Redis
    await this.presenceService.startTyping(userId, payload.channelId);
    
    // Broadcast typing event to others in the channel room
    client.to(payload.channelId).emit('userTypingChannel', {
      userId,
      channelId: payload.channelId,
    });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('stopTypingChannel')
  async handleStopTypingChannel(
    @ConnectedSocket() client: any,
    @MessageBody() payload: { channelId: string },
  ) {
    const userId = client.user.sub;
    
    // Remove typing state from Redis
    await this.presenceService.stopTyping(userId, payload.channelId);
    
    // Broadcast stop typing event to others in the channel room
    client.to(payload.channelId).emit('userStoppedTypingChannel', {
      userId,
      channelId: payload.channelId,
    });
  }

  // ===============================================
  // REACTION EVENTS (Message Reactions)
  // ===============================================

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('addReaction')
  async handleAddReaction(
    @ConnectedSocket() client: any,
    @MessageBody() payload: {
      messageId: string;
      emoji: string;
    },
  ) {
    const userId = client.user.sub;

    try {
      // Verify user can access the message
      const canAccess = await this.reactionsService.canAccessMessage(userId, payload.messageId);
      if (!canAccess) {
        client.emit('error', { message: 'You do not have access to this message' });
        return;
      }

      // Add reaction
      const reaction = await this.reactionsService.addReaction(
        userId,
        payload.messageId,
        payload.emoji,
      );

      // Broadcast to channel
      this.server.to(reaction.channelId).emit('reactionAdded', {
        messageId: payload.messageId,
        userId,
        emoji: payload.emoji,
        user: reaction.user,
      });
    } catch (error) {
      console.error('Error adding reaction:', error);
      client.emit('error', { message: error.message || 'Failed to add reaction' });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('removeReaction')
  async handleRemoveReaction(
    @ConnectedSocket() client: any,
    @MessageBody() payload: {
      messageId: string;
      emoji: string;
    },
  ) {
    const userId = client.user.sub;

    try {
      // Verify user can access the message
      const canAccess = await this.reactionsService.canAccessMessage(userId, payload.messageId);
      if (!canAccess) {
        client.emit('error', { message: 'You do not have access to this message' });
        return;
      }

      // Remove reaction
      const result = await this.reactionsService.removeReaction(
        userId,
        payload.messageId,
        payload.emoji,
      );

      // Broadcast to channel
      this.server.to(result.channelId).emit('reactionRemoved', {
        messageId: payload.messageId,
        userId,
        emoji: payload.emoji,
      });
    } catch (error) {
      console.error('Error removing reaction:', error);
      client.emit('error', { message: error.message || 'Failed to remove reaction' });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('toggleReaction')
  async handleToggleReaction(
    @ConnectedSocket() client: any,
    @MessageBody() payload: {
      messageId: string;
      emoji: string;
    },
  ) {
    const userId = client.user.sub;

    try {
      // Verify user can access the message
      const canAccess = await this.reactionsService.canAccessMessage(userId, payload.messageId);
      if (!canAccess) {
        client.emit('error', { message: 'You do not have access to this message' });
        return;
      }

      // Toggle reaction
      const result = await this.reactionsService.toggleReaction(
        userId,
        payload.messageId,
        payload.emoji,
      );

      // Determine if added or removed
      const eventName = 'user' in result ? 'reactionAdded' : 'reactionRemoved';
      
      // Broadcast to channel
      this.server.to(result.channelId).emit(eventName, {
        messageId: payload.messageId,
        userId,
        emoji: payload.emoji,
        user: 'user' in result ? result.user : undefined,
      });
    } catch (error) {
      console.error('Error toggling reaction:', error);
      client.emit('error', { message: error.message || 'Failed to toggle reaction' });
    }
  }

  // ===============================================
  // THREAD EVENTS (Message Threads)
  // ===============================================

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinThread')
  async handleJoinThread(
    @ConnectedSocket() client: any,
    @MessageBody() payload: { messageId: string },
  ) {
    const userId = client.user.sub;

    try {
      // Verify message exists and user has access
      const message = await this.chatService.prisma.channelMessage.findUnique({
        where: { id: payload.messageId },
        select: { channelId: true },
      });

      if (!message) {
        client.emit('error', { message: 'Message not found' });
        return;
      }

      const isMember = await this.channelsService.isMember(message.channelId, userId);
      if (!isMember) {
        client.emit('error', { message: 'You do not have access to this thread' });
        return;
      }

      // Join thread room
      const threadRoom = `thread:${payload.messageId}`;
      client.join(threadRoom);
      console.log(`User ${userId} joined thread ${payload.messageId}`);

      // Notify client
      client.emit('threadJoined', { messageId: payload.messageId });
    } catch (error) {
      console.error('Error joining thread:', error);
      client.emit('error', { message: 'Failed to join thread' });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveThread')
  handleLeaveThread(
    @ConnectedSocket() client: any,
    @MessageBody() payload: { messageId: string },
  ) {
    const userId = client.user.sub;
    const threadRoom = `thread:${payload.messageId}`;
    client.leave(threadRoom);
    console.log(`User ${userId} left thread ${payload.messageId}`);

    client.emit('threadLeft', { messageId: payload.messageId });
  }

  // Override sendChannelMessage to also emit to thread subscribers
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendThreadReply')
  async handleSendThreadReply(
    @ConnectedSocket() client: any,
    @MessageBody() payload: {
      messageId: string;
      content?: string;
      attachmentUrl?: string;
    },
  ) {
    const userId = client.user.sub;

    try {
      // Verify parent message exists and user has access
      const parentMessage = await this.chatService.prisma.channelMessage.findUnique({
        where: { id: payload.messageId },
        select: { channelId: true },
      });

      if (!parentMessage) {
        client.emit('error', { message: 'Parent message not found' });
        return;
      }

      const isMember = await this.channelsService.isMember(parentMessage.channelId, userId);
      if (!isMember) {
        client.emit('error', { message: 'You do not have access to this channel' });
        return;
      }

      // Save reply
      const reply = await this.chatService.saveChannelMessage(userId, {
        channelId: parentMessage.channelId,
        content: payload.content,
        attachmentUrl: payload.attachmentUrl,
        parentId: payload.messageId,
      });

      // Broadcast to channel
      this.server.to(parentMessage.channelId).emit('channelMessageCreated', reply);

      // Also broadcast to thread subscribers
      const threadRoom = `thread:${payload.messageId}`;
      this.server.to(threadRoom).emit('threadReplyAdded', {
        parentMessageId: payload.messageId,
        reply,
      });
    } catch (error) {
      console.error('Error sending thread reply:', error);
      client.emit('error', { message: 'Failed to send reply' });
    }
  }
}
