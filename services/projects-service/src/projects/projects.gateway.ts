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
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from '../auth/guards/ws-jwt.guard';

interface AuthenticatedSocket extends Socket {
  user?: {
    sub: string;
    email: string;
    handle?: string;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/ws/projects',
})
export class ProjectsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map socket.id -> userId for cleanup
  private socketUser = new Map<string, string>();

  handleConnection(client: AuthenticatedSocket) {
    console.log(`[Projects WS] Client connected: ${client.id}`);
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const userId = this.socketUser.get(client.id);
    if (userId) {
      this.socketUser.delete(client.id);
    }
    console.log(`[Projects WS] Client disconnected: ${client.id}`);
  }

  // ===============================================
  // PROJECT ROOM MANAGEMENT
  // ===============================================

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinProject')
  handleJoinProject(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { projectId: string },
  ) {
    const userId = client.user?.sub;
    if (!userId) return;

    const room = `project:${payload.projectId}`;
    client.join(room);
    this.socketUser.set(client.id, userId);

    console.log(`[Projects WS] User ${userId} joined project room ${payload.projectId}`);
    client.emit('joinedProject', { projectId: payload.projectId });
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveProject')
  handleLeaveProject(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() payload: { projectId: string },
  ) {
    const userId = client.user?.sub;
    const room = `project:${payload.projectId}`;
    client.leave(room);

    console.log(`[Projects WS] User ${userId} left project room ${payload.projectId}`);
    client.emit('leftProject', { projectId: payload.projectId });
  }

  // ===============================================
  // EMIT METHODS (called by EventsService)
  // ===============================================

  /** Emit event to all users in a project room */
  emitToProject(projectId: string, event: string, payload: any) {
    const room = `project:${projectId}`;
    this.server.to(room).emit(event, payload);
  }

  /** Emit event to a specific user */
  emitToUser(userId: string, event: string, payload: any) {
    const room = `user:${userId}`;
    this.server.to(room).emit(event, payload);
  }

  /** User joins their personal notification room */
  @UseGuards(WsJwtGuard)
  @SubscribeMessage('subscribeNotifications')
  handleSubscribeNotifications(@ConnectedSocket() client: AuthenticatedSocket) {
    const userId = client.user?.sub;
    if (!userId) return;

    const room = `user:${userId}`;
    client.join(room);
    console.log(`[Projects WS] User ${userId} subscribed to notifications`);
    client.emit('subscribedNotifications', { userId });
  }
}
