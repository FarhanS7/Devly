import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ChannelsService } from '../channels/channels.service';
import { PresenceService } from '../presence/presence.service';
import { ReactionsService } from '../reactions/reactions.service';
import { ChatService } from './chat.service';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly chatService;
    private readonly channelsService;
    private readonly presenceService;
    private readonly reactionsService;
    server: Server;
    constructor(chatService: ChatService, channelsService: ChannelsService, presenceService: PresenceService, reactionsService: ReactionsService);
    handleConnection(client: any): Promise<void>;
    handleDisconnect(client: any): Promise<void>;
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
    handleJoinChannel(client: any, payload: {
        channelId: string;
    }): Promise<void>;
    handleLeaveChannel(client: any, payload: {
        channelId: string;
    }): void;
    handleSendChannelMessage(client: any, payload: {
        channelId: string;
        content?: string;
        attachmentUrl?: string;
        parentId?: string;
    }): Promise<void>;
    handleTypingChannel(client: any, payload: {
        channelId: string;
    }): Promise<void>;
    handleStopTypingChannel(client: any, payload: {
        channelId: string;
    }): Promise<void>;
    handleAddReaction(client: any, payload: {
        messageId: string;
        emoji: string;
    }): Promise<void>;
    handleRemoveReaction(client: any, payload: {
        messageId: string;
        emoji: string;
    }): Promise<void>;
    handleToggleReaction(client: any, payload: {
        messageId: string;
        emoji: string;
    }): Promise<void>;
    handleJoinThread(client: any, payload: {
        messageId: string;
    }): Promise<void>;
    handleLeaveThread(client: any, payload: {
        messageId: string;
    }): void;
    handleSendThreadReply(client: any, payload: {
        messageId: string;
        content?: string;
        attachmentUrl?: string;
    }): Promise<void>;
}
