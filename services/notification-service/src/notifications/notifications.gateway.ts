import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' }, // tighten in prod
  namespace: '/ws/notifications', // clear namespace
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;

  // Map socket.id -> userId (for cleanup/debug)
  private socketUser = new Map<string, string>();

  handleConnection(client: Socket) {
    // Very simple identification (for now). You can swap to JWT later.
    const userId = (client.handshake.query.userId as string) || '';
    if (!userId) {
      client.disconnect(true);
      return;
    }

    // put client in their personal room
    const room = this.userRoom(userId);
    client.join(room);
    this.socketUser.set(client.id, userId);

    // Optional: ack
    client.emit('connected', { ok: true, userId });
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketUser.get(client.id);
    if (userId) {
      client.leave(this.userRoom(userId));
      this.socketUser.delete(client.id);
    }
  }

  private userRoom(userId: string) {
    return `user:${userId}`;
  }

  /** Push a notification payload to a specific user */
  emitToUser(userId: string, event: string, payload: any) {
    const room = this.userRoom(userId);
    this.server.to(room).emit(event, payload);
  }
}
