"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ChatService = class ChatService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async saveMessage(senderId, payload) {
        return this.prisma.message.create({
            data: {
                senderId,
                conversationId: payload.conversationId,
                content: payload.content,
                attachmentUrl: payload.attachmentUrl,
            },
            include: {
                sender: {
                    select: { id: true, name: true, avatarUrl: true, handle: true },
                },
            },
        });
    }
    async isParticipant(userId, conversationId) {
        const count = await this.prisma.conversationParticipant.count({
            where: {
                userId,
                conversationId,
            },
        });
        return count > 0;
    }
    async getUserConversations(userId) {
        return this.prisma.conversation.findMany({
            where: {
                participants: {
                    some: { userId },
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
    }
    async getMessages(conversationId, userId) {
        const isPart = await this.isParticipant(userId, conversationId);
        if (!isPart)
            throw new Error('Not a participant');
        return this.prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: {
                    select: { id: true, name: true, avatarUrl: true, handle: true },
                },
            },
        });
    }
    async markRead(userId, conversationId, messageId) {
        return this.prisma.conversationParticipant.update({
            where: {
                conversationId_userId: {
                    conversationId,
                    userId,
                },
            },
            data: {
                lastReadMessageId: messageId,
            },
        });
    }
    async findOrCreateConversation(userId1, userId2) {
        const existingConversation = await this.prisma.conversation.findFirst({
            where: {
                participants: {
                    every: {
                        userId: {
                            in: [userId1, userId2],
                        },
                    },
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
                    include: {
                        sender: {
                            select: { id: true, name: true, avatarUrl: true, handle: true },
                        },
                    },
                },
            },
        });
        if (existingConversation && existingConversation.participants.length === 2) {
            const participantIds = existingConversation.participants.map(p => p.userId).sort();
            const expectedIds = [userId1, userId2].sort();
            if (participantIds[0] === expectedIds[0] && participantIds[1] === expectedIds[1]) {
                return existingConversation;
            }
        }
        const newConversation = await this.prisma.conversation.create({
            data: {
                participants: {
                    create: [
                        { userId: userId1 },
                        { userId: userId2 },
                    ],
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
                messages: true,
            },
        });
        return newConversation;
    }
    async getUnreadCount(userId) {
        const conversations = await this.prisma.conversation.findMany({
            where: {
                participants: {
                    some: { userId },
                },
            },
            include: {
                participants: {
                    where: { userId },
                    select: { lastReadMessageId: true },
                },
                messages: {
                    select: { id: true },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        let totalUnread = 0;
        for (const conv of conversations) {
            const lastReadId = conv.participants[0]?.lastReadMessageId;
            if (!lastReadId) {
                totalUnread += conv.messages.length;
            }
            else {
                const lastReadIndex = conv.messages.findIndex(m => m.id === lastReadId);
                if (lastReadIndex !== -1) {
                    totalUnread += lastReadIndex;
                }
            }
        }
        return totalUnread;
    }
    async getConversationUnreadCount(conversationId, userId) {
        const participant = await this.prisma.conversationParticipant.findUnique({
            where: {
                conversationId_userId: { conversationId, userId },
            },
            select: { lastReadMessageId: true },
        });
        if (!participant)
            return 0;
        const messages = await this.prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'desc' },
            select: { id: true },
        });
        if (!participant.lastReadMessageId) {
            return messages.length;
        }
        const lastReadIndex = messages.findIndex(m => m.id === participant.lastReadMessageId);
        return lastReadIndex === -1 ? 0 : lastReadIndex;
    }
    async saveChannelMessage(senderId, payload) {
        return this.prisma.channelMessage.create({
            data: {
                senderId,
                channelId: payload.channelId,
                content: payload.content,
                attachmentUrl: payload.attachmentUrl,
                parentId: payload.parentId,
            },
            include: {
                sender: {
                    select: { id: true, name: true, avatarUrl: true, handle: true },
                },
                parent: payload.parentId
                    ? {
                        select: {
                            id: true,
                            content: true,
                            sender: {
                                select: { id: true, name: true, handle: true },
                            },
                        },
                    }
                    : undefined,
                _count: { select: { replies: true, reactions: true } },
            },
        });
    }
    async getThreadReplies(messageId, options = {}) {
        const { skip = 0, take = 50 } = options;
        const replies = await this.prisma.channelMessage.findMany({
            where: { parentId: messageId },
            include: {
                sender: {
                    select: { id: true, name: true, avatarUrl: true, handle: true },
                },
                _count: { select: { replies: true, reactions: true } },
            },
            orderBy: { createdAt: 'asc' },
            skip,
            take,
        });
        const total = await this.prisma.channelMessage.count({
            where: { parentId: messageId },
        });
        return { replies, total, hasMore: skip + take < total };
    }
    async getFullThread(messageId) {
        const parent = await this.prisma.channelMessage.findUnique({
            where: { id: messageId },
            include: {
                sender: {
                    select: { id: true, name: true, avatarUrl: true, handle: true },
                },
                _count: { select: { replies: true, reactions: true } },
            },
        });
        if (!parent) {
            return null;
        }
        const replies = await this.prisma.channelMessage.findMany({
            where: { parentId: messageId },
            include: {
                sender: {
                    select: { id: true, name: true, avatarUrl: true, handle: true },
                },
                _count: { select: { replies: true, reactions: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
        return {
            parent,
            replies,
            replyCount: replies.length,
        };
    }
    async getThreadParticipants(messageId) {
        const messages = await this.prisma.channelMessage.findMany({
            where: {
                OR: [{ id: messageId }, { parentId: messageId }],
            },
            select: {
                sender: {
                    select: { id: true, name: true, avatarUrl: true, handle: true },
                },
            },
        });
        const uniqueUsers = new Map();
        messages.forEach((msg) => {
            if (!uniqueUsers.has(msg.sender.id)) {
                uniqueUsers.set(msg.sender.id, msg.sender);
            }
        });
        return Array.from(uniqueUsers.values());
    }
    async getThreadSummary(messageId) {
        const thread = await this.getFullThread(messageId);
        if (!thread) {
            return null;
        }
        const participants = await this.getThreadParticipants(messageId);
        const latestReply = thread.replies[thread.replies.length - 1];
        return {
            messageId,
            replyCount: thread.replyCount,
            participants,
            latestReply: latestReply
                ? {
                    id: latestReply.id,
                    content: latestReply.content,
                    sender: latestReply.sender,
                    createdAt: latestReply.createdAt,
                }
                : null,
        };
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatService);
//# sourceMappingURL=chat.service.js.map