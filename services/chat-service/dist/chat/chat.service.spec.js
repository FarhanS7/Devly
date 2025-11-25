"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const prisma_service_1 = require("../prisma/prisma.service");
const chat_service_1 = require("./chat.service");
describe('ChatService', () => {
    let service;
    let prisma;
    const mockPrismaService = {
        message: {
            create: jest.fn(),
            findMany: jest.fn(),
        },
        conversationParticipant: {
            count: jest.fn(),
            update: jest.fn(),
        },
        conversation: {
            findMany: jest.fn(),
        },
    };
    beforeEach(async () => {
        const module = await testing_1.Test.createTestingModule({
            providers: [
                chat_service_1.ChatService,
                {
                    provide: prisma_service_1.PrismaService,
                    useValue: mockPrismaService,
                },
            ],
        }).compile();
        service = module.get(chat_service_1.ChatService);
        prisma = module.get(prisma_service_1.PrismaService);
    });
    afterEach(() => {
        jest.clearAllMocks();
    });
    it('should be defined', () => {
        expect(service).toBeDefined();
    });
    describe('saveMessage', () => {
        it('should create a message with sender details', async () => {
            const mockMessage = {
                id: 'msg-1',
                content: 'Hello',
                attachmentUrl: null,
                conversationId: 'conv-1',
                senderId: 'user-1',
                createdAt: new Date(),
                sender: {
                    id: 'user-1',
                    name: 'John Doe',
                    avatarUrl: null,
                    handle: 'johndoe',
                },
            };
            mockPrismaService.message.create.mockResolvedValue(mockMessage);
            const result = await service.saveMessage('user-1', {
                conversationId: 'conv-1',
                content: 'Hello',
            });
            expect(result).toEqual(mockMessage);
            expect(mockPrismaService.message.create).toHaveBeenCalledWith({
                data: {
                    senderId: 'user-1',
                    conversationId: 'conv-1',
                    content: 'Hello',
                    attachmentUrl: undefined,
                },
                include: {
                    sender: {
                        select: { id: true, name: true, avatarUrl: true, handle: true },
                    },
                },
            });
        });
        it('should create a message with attachment', async () => {
            const mockMessage = {
                id: 'msg-2',
                content: null,
                attachmentUrl: '/uploads/chat/image.jpg',
                conversationId: 'conv-1',
                senderId: 'user-1',
                createdAt: new Date(),
                sender: {
                    id: 'user-1',
                    name: 'John Doe',
                    avatarUrl: null,
                    handle: 'johndoe',
                },
            };
            mockPrismaService.message.create.mockResolvedValue(mockMessage);
            const result = await service.saveMessage('user-1', {
                conversationId: 'conv-1',
                attachmentUrl: '/uploads/chat/image.jpg',
            });
            expect(result).toEqual(mockMessage);
            expect(mockPrismaService.message.create).toHaveBeenCalledWith({
                data: {
                    senderId: 'user-1',
                    conversationId: 'conv-1',
                    content: undefined,
                    attachmentUrl: '/uploads/chat/image.jpg',
                },
                include: {
                    sender: {
                        select: { id: true, name: true, avatarUrl: true, handle: true },
                    },
                },
            });
        });
    });
    describe('isParticipant', () => {
        it('should return true if user is a participant', async () => {
            mockPrismaService.conversationParticipant.count.mockResolvedValue(1);
            const result = await service.isParticipant('user-1', 'conv-1');
            expect(result).toBe(true);
            expect(mockPrismaService.conversationParticipant.count).toHaveBeenCalledWith({
                where: {
                    userId: 'user-1',
                    conversationId: 'conv-1',
                },
            });
        });
        it('should return false if user is not a participant', async () => {
            mockPrismaService.conversationParticipant.count.mockResolvedValue(0);
            const result = await service.isParticipant('user-1', 'conv-1');
            expect(result).toBe(false);
        });
    });
    describe('getUserConversations', () => {
        it('should return user conversations with participants and last message', async () => {
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
            mockPrismaService.conversation.findMany.mockResolvedValue(mockConversations);
            const result = await service.getUserConversations('user-1');
            expect(result).toEqual(mockConversations);
            expect(mockPrismaService.conversation.findMany).toHaveBeenCalledWith({
                where: {
                    participants: {
                        some: { userId: 'user-1' },
                    },
                },
                include: {
                    participants: {
                        include: {
                            user: {
                                select: { id: true, name: true, avatarUrl: true, handle: true },
                            },
                        },
                    },
                    messages: {
                        take: 1,
                        orderBy: { createdAt: 'desc' },
                    },
                },
                orderBy: { updatedAt: 'desc' },
            });
        });
    });
    describe('getMessages', () => {
        it('should return messages if user is a participant', async () => {
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
            mockPrismaService.conversationParticipant.count.mockResolvedValue(1);
            mockPrismaService.message.findMany.mockResolvedValue(mockMessages);
            const result = await service.getMessages('conv-1', 'user-1');
            expect(result).toEqual(mockMessages);
            expect(mockPrismaService.message.findMany).toHaveBeenCalledWith({
                where: { conversationId: 'conv-1' },
                orderBy: { createdAt: 'asc' },
                include: {
                    sender: {
                        select: { id: true, name: true, avatarUrl: true, handle: true },
                    },
                },
            });
        });
        it('should throw error if user is not a participant', async () => {
            mockPrismaService.conversationParticipant.count.mockResolvedValue(0);
            await expect(service.getMessages('conv-1', 'user-1')).rejects.toThrow('Not a participant');
        });
    });
    describe('markRead', () => {
        it('should update last read message id', async () => {
            const mockParticipant = {
                conversationId: 'conv-1',
                userId: 'user-1',
                lastReadMessageId: 'msg-1',
                joinedAt: new Date(),
            };
            mockPrismaService.conversationParticipant.update.mockResolvedValue(mockParticipant);
            const result = await service.markRead('user-1', 'conv-1', 'msg-1');
            expect(result).toEqual(mockParticipant);
            expect(mockPrismaService.conversationParticipant.update).toHaveBeenCalledWith({
                where: {
                    conversationId_userId: {
                        conversationId: 'conv-1',
                        userId: 'user-1',
                    },
                },
                data: {
                    lastReadMessageId: 'msg-1',
                },
            });
        });
    });
});
//# sourceMappingURL=chat.service.spec.js.map