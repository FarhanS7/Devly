import { ChatService } from './chat.service';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    uploadFile(file: Express.Multer.File): {
        url: string;
    };
    getConversations(userId: string): Promise<({
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
}
