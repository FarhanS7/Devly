import { PrismaService } from '../prisma/prisma.service';
export declare class ReactionsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    addReaction(userId: string, messageId: string, emoji: string): Promise<{
        channelId: string;
        user: {
            id: string;
            handle: string;
            name: string;
            avatarUrl: string;
        };
        emoji: string;
        id: string;
        createdAt: Date;
        messageId: string;
        userId: string;
    }>;
    removeReaction(userId: string, messageId: string, emoji: string): Promise<{
        messageId: string;
        userId: string;
        emoji: string;
        channelId: string;
    }>;
    toggleReaction(userId: string, messageId: string, emoji: string): Promise<{
        messageId: string;
        userId: string;
        emoji: string;
        channelId: string;
    }>;
    getMessageReactions(messageId: string): Promise<{
        emoji: string;
        count: number;
        users: any[];
    }[]>;
    getReactionSummary(messageId: string): Promise<{
        emoji: string;
        count: number;
    }[]>;
    canAccessMessage(userId: string, messageId: string): Promise<boolean>;
}
