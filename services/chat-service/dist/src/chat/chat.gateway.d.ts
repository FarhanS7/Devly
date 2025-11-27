import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ChatService } from './chat.service';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatService;
    server: Server;
    constructor(chatService: ChatService);
    private onlineUsers;
    handleConnection(client: any): void;
    handleDisconnect(client: any): void;
    handleJoinRoom(client: any, payload: {
        conversationId: string;
    }): Promise<void>;
    handleSendMessage(client: any, payload: {
        conversationId: string;
        content?: string;
        attachmentUrl?: string;
    }): Promise<void>;
    handleMarkRead(client: any, payload: {
        conversationId: string;
        messageId: string;
    }): Promise<void>;
    handleTyping(client: any, payload: {
        conversationId: string;
    }): void;
    handleStopTyping(client: any, payload: {
        conversationId: string;
    }): void;
}
