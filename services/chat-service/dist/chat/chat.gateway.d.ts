import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatService;
    server: Server;
    constructor(chatService: ChatService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinRoom(client: Socket, payload: {
        conversationId: string;
        userId: string;
    }): Promise<void>;
    handleSendMessage(client: Socket, payload: {
        conversationId: string;
        userId: string;
        content?: string;
        attachmentUrl?: string;
    }): Promise<void>;
    handleMarkRead(client: Socket, payload: {
        conversationId: string;
        userId: string;
        messageId: string;
    }): Promise<void>;
}
