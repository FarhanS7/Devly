import { AddReactionDto } from './dto/add-reaction.dto';
import { ReactionsService } from './reactions.service';
export declare class ReactionsController {
    private readonly reactionsService;
    constructor(reactionsService: ReactionsService);
    addReaction(messageId: string, dto: AddReactionDto, userId: string): Promise<{
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
    removeReaction(messageId: string, emoji: string, userId: string): Promise<{
        messageId: string;
        userId: string;
        emoji: string;
        channelId: string;
    }>;
    getReactions(messageId: string, userId: string): Promise<{
        emoji: string;
        count: number;
        users: any[];
    }[]>;
}
