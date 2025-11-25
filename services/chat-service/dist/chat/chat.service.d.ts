import { PrismaService } from '../prisma/prisma.service';
export declare class ChatService {
    private prisma;
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
        content: string | null;
        attachmentUrl: string | null;
        createdAt: Date;
        conversationId: string;
        senderId: string;
    }>;
    isParticipant(userId: string, conversationId: string): Promise<boolean>;
    getUserConversations(userId: string): Promise<({
        messages: {
            id: string;
            content: string | null;
            attachmentUrl: string | null;
            createdAt: Date;
            conversationId: string;
            senderId: string;
        }[];
        participants: ({
            user: {
                id: string;
                handle: string;
                name: string;
                avatarUrl: string;
            };
        } & {
            conversationId: string;
            userId: string;
            joinedAt: Date;
            lastReadMessageId: string | null;
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
        content: string | null;
        attachmentUrl: string | null;
        createdAt: Date;
        conversationId: string;
        senderId: string;
    })[]>;
    markRead(userId: string, conversationId: string, messageId: string): Promise<{
        conversationId: string;
        userId: string;
        joinedAt: Date;
        lastReadMessageId: string | null;
    }>;
}
