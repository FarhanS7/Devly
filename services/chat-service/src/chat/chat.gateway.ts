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

  handleConnection(client: Socket) {
    // In a real app, you'd validate the token here
    // const token = client.handshake.auth.token;
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; userId: string },
  ) {
    // Validate participation
    const canJoin = await this.chatService.isParticipant(payload.userId, payload.conversationId);
    if (canJoin) {
      client.join(payload.conversationId);
      console.log(`User ${payload.userId} joined room ${payload.conversationId}`);
    } else {
      console.warn(`User ${payload.userId} tried to join room ${payload.conversationId} but is not a participant`);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; userId: string; content?: string; attachmentUrl?: string },
  ) {
    const message = await this.chatService.saveMessage(payload.userId, payload);
    this.server.to(payload.conversationId).emit('newMessage', message);
  }

  @SubscribeMessage('markRead')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; userId: string; messageId: string },
  ) {
    await this.chatService.markRead(payload.userId, payload.conversationId, payload.messageId);
    // Notify others in the room
    client.to(payload.conversationId).emit('messageRead', {
      userId: payload.userId,
      messageId: payload.messageId,
      conversationId: payload.conversationId,
    });
  }
}
