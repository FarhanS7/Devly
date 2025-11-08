import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class NotificationsGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;

  handleConnection(socket: any) {
    const userId = socket.handshake.query.userId;
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`🧑‍💻 User ${userId} connected`);
    }
  }

  async pushToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }
}
