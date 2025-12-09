import { PrismaService } from '../prisma/prisma.service';
export declare class ChatService {
    prisma: PrismaService;
    constructor(prisma: PrismaService);
    saveMessage(senderId: string, payload: {
        conversationId: string;
        content?: string;
        attachmentUrl?: string;
    }): Promise<{
        sender: {
            id: string;
            handle: string;
            name: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        senderId: string;
        content: string | null;
        attachmentUrl: string | null;
        createdAt: Date;
        conversationId: string;
    }>;
    isParticipant(userId: string, conversationId: string): Promise<boolean>;
    getUserConversations(userId: string): Promise<({
        messages: {
            id: string;
            senderId: string;
            content: string | null;
            attachmentUrl: string | null;
            createdAt: Date;
            conversationId: string;
        }[];
        participants: ({
            user: {
                id: string;
                handle: string;
                name: string;
                avatarUrl: string;
            };
        } & {
            userId: string;
            joinedAt: Date;
            lastReadMessageId: string | null;
            conversationId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
    })[]>;
    getMessages(conversationId: string, userId: string): Promise<({
        sender: {
            id: string;
            handle: string;
            name: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        senderId: string;
        content: string | null;
        attachmentUrl: string | null;
        createdAt: Date;
        conversationId: string;
    })[]>;
    markRead(userId: string, conversationId: string, messageId: string): Promise<{
        userId: string;
        joinedAt: Date;
        lastReadMessageId: string | null;
        conversationId: string;
    }>;
    findOrCreateConversation(userId1: string, userId2: string): Promise<{
        messages: {
            id: string;
            senderId: string;
            content: string | null;
            attachmentUrl: string | null;
            createdAt: Date;
            conversationId: string;
        }[];
        participants: ({
            user: {
                id: string;
                handle: string;
                name: string;
                avatarUrl: string;
            };
        } & {
            userId: string;
            joinedAt: Date;
            lastReadMessageId: string | null;
            conversationId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getUnreadCount(userId: string): Promise<number>;
    getConversationUnreadCount(conversationId: string, userId: string): Promise<number>;
    saveChannelMessage(senderId: string, payload: {
        channelId: string;
        content?: string;
        attachmentUrl?: string;
        parentId?: string;
    }): Promise<{
        sender: {
            id: string;
            handle: string;
            name: string;
            avatarUrl: string;
        };
        parent: {
            id: string;
            content: string;
            sender: {
                id: string;
                handle: string;
                name: string;
            };
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
    }>;
    getThreadReplies(messageId: string, options?: {
        skip?: number;
        take?: number;
    }): Promise<{
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
    getFullThread(messageId: string): Promise<{
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
    getThreadParticipants(messageId: string): Promise<any[]>;
    getThreadSummary(messageId: string): Promise<{
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
