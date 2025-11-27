"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const chat_controller_1 = require("./chat.controller");
const chat_service_1 = require("./chat.service");
describe('ChatController', () => {
    let controller;
    let chatService;
    const mockChatService = {
        getUserConversations: jest.fn(),
        getMessages: jest.fn(),
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            controllers: [chat_controller_1.ChatController],
            providers: [
                {
                    provide: chat_service_1.ChatService,
                    useValue: mockChatService,
                },
            ],
        }).compile();
        controller = module.get(chat_controller_1.ChatController);
        chatService = module.get(chat_service_1.ChatService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(controller).toBeDefined();
    });
    describe('uploadFile', () => {
        it('should return uploaded file URL', () => {
            const mockFile = {
                filename: 'test-image.jpg',
                originalname: 'image.jpg',
                mimetype: 'image/jpeg',
                size: 1024,
            };
            const result = controller.uploadFile(mockFile);
            expect(result).toEqual({
                url: '/uploads/chat/test-image.jpg',
            });
        });
    });
    describe('getConversations', () => {
        it('should return user conversations', async () => {
            const mockConversations = [
                {
                    id: 'conv-1',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    participants: [
                        {
                            userId: 'user-1',
                            user: { id: 'user-1', name: 'John', avatarUrl: null, handle: 'john' },
                        },
                        {
                            userId: 'user-2',
                            user: { id: 'user-2', name: 'Jane', avatarUrl: null, handle: 'jane' },
                        },
                    ],
                    messages: [
                        {
                            id: 'msg-1',
                            content: 'Hello',
                            createdAt: new Date(),
                        },
                    ],
                },
            ];
            mockChatService.getUserConversations.mockResolvedValue(mockConversations);
            const result = await controller.getConversations('user-1');
            expect(result).toEqual(mockConversations);
            expect(mockChatService.getUserConversations).toHaveBeenCalledWith('user-1');
        });
        it('should return empty array if no conversations', async () => {
            mockChatService.getUserConversations.mockResolvedValue([]);
            const result = await controller.getConversations('user-1');
            expect(result).toEqual([]);
            expect(mockChatService.getUserConversations).toHaveBeenCalledWith('user-1');
        });
    });
    describe('getMessages', () => {
        it('should return conversation messages', async () => {
            const mockMessages = [
                {
                    id: 'msg-1',
                    content: 'Hello',
                    conversationId: 'conv-1',
                    senderId: 'user-1',
                    createdAt: new Date(),
                    sender: { id: 'user-1', name: 'John', avatarUrl: null, handle: 'john' },
                },
                {
                    id: 'msg-2',
                    content: 'Hi',
                    conversationId: 'conv-1',
                    senderId: 'user-2',
                    createdAt: new Date(),
                    sender: { id: 'user-2', name: 'Jane', avatarUrl: null, handle: 'jane' },
                },
            ];
            mockChatService.getMessages.mockResolvedValue(mockMessages);
            const result = await controller.getMessages('conv-1', 'user-1');
            expect(result).toEqual(mockMessages);
            expect(mockChatService.getMessages).toHaveBeenCalledWith('conv-1', 'user-1');
        });
        it('should throw error if user is not authorized', async () => {
            mockChatService.getMessages.mockRejectedValue(new Error('Not a participant'));
            await expect(controller.getMessages('conv-1', 'user-1')).rejects.toThrow('Not a participant');
        });
    });
});
//# sourceMappingURL=chat.controller.spec.js.map