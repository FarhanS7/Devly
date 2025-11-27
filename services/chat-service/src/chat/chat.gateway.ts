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
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly chatService: ChatService) {}

  // Map to track online users: userId -> socketId
  private onlineUsers = new Map<string, string>();

  @UseGuards(WsJwtGuard)
  handleConnection(client: any) {
    // Token validation is handled by WsJwtGuard
    // The guard attaches user info to the socket
    const userId = client.user?.sub;
    
    if (userId) {
      // Track online user
      this.onlineUsers.set(userId, client.id);
      
      // Broadcast to all connected clients that this user is online
      this.server.emit('userOnline', { userId });
      
      console.log(`User ${userId} connected (${client.id})`);
    } else {
      console.log(`Client connected: ${client.id}`);
    }
  }

  handleDisconnect(client: any) {
    // Remove user from online tracking
    const userId = client.user?.sub;
    if (userId) {
      this.onlineUsers.delete(userId);
      
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
}
