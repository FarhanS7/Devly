import { ChatService } from '../chat/chat.service';
import { ChannelsService } from './channels.service';
export declare class ThreadsController {
    private readonly chatService;
    private readonly channelsService;
    constructor(chatService: ChatService, channelsService: ChannelsService);
    getThreadReplies(messageId: string, skip: number, take: number, userId: string): Promise<{
        replies: ({
            sender: {
                id: string;
                handle: string;
                name: string;
                avatarUrl: string;
            };
            _count: {
                replies: number;
                reactions: number;
            };
        } & {
            id: string;
            channelId: string;
            senderId: string;
            content: string | null;
            attachmentUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
            parentId: string | null;
        })[];
        total: number;
        hasMore: boolean;
    }>;
    getFullThread(messageId: string, userId: string): Promise<{
        parent: {
            sender: {
                id: string;
                handle: string;
                name: string;
                avatarUrl: string;
            };
            _count: {
                replies: number;
                reactions: number;
            };
        } & {
            id: string;
            channelId: string;
            senderId: string;
            content: string | null;
            attachmentUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
            parentId: string | null;
        };
        replies: ({
            sender: {
                id: string;
                handle: string;
                name: string;
                avatarUrl: string;
            };
            _count: {
                replies: number;
                reactions: number;
            };
        } & {
            id: string;
            channelId: string;
            senderId: string;
            content: string | null;
            attachmentUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
            parentId: string | null;
        })[];
        replyCount: number;
    }>;
    getThreadParticipants(messageId: string, userId: string): Promise<any[]>;
    getThreadSummary(messageId: string, userId: string): Promise<{
        messageId: string;
        replyCount: number;
        participants: any[];
        latestReply: {
            id: string;
            content: string;
            sender: {
                id: string;
                handle: string;
                name: string;
                avatarUrl: string;
            };
            createdAt: Date;
        };
    }>;
}
