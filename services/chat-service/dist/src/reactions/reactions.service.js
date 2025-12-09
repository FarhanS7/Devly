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
var ReactionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReactionsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReactionsService = ReactionsService_1 = class ReactionsService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ReactionsService_1.name);
    }
    async addReaction(userId, messageId, emoji) {
        try {
            const message = await this.prisma.channelMessage.findUnique({
                where: { id: messageId },
                select: { id: true, channelId: true },
            });
            if (!message) {
                throw new common_1.NotFoundException('Message not found');
            }
            const reaction = await this.prisma.messageReaction.create({
                data: {
                    messageId,
                    userId,
                    emoji,
                },
                include: {
                    user: {
                        select: { id: true, name: true, handle: true, avatarUrl: true },
                    },
                },
            });
            this.logger.log(`User ${userId} added reaction ${emoji} to message ${messageId}`);
            return { ...reaction, channelId: message.channelId };
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('You have already reacted with this emoji');
            }
            throw error;
        }
    }
    async removeReaction(userId, messageId, emoji) {
        const message = await this.prisma.channelMessage.findUnique({
            where: { id: messageId },
            select: { id: true, channelId: true },
        });
        if (!message) {
            throw new common_1.NotFoundException('Message not found');
        }
        const reaction = await this.prisma.messageReaction.findFirst({
            where: {
                messageId,
                userId,
                emoji,
            },
        });
        if (!reaction) {
            throw new common_1.NotFoundException('Reaction not found');
        }
        await this.prisma.messageReaction.delete({
            where: { id: reaction.id },
        });
        this.logger.log(`User ${userId} removed reaction ${emoji} from message ${messageId}`);
        return { messageId, userId, emoji, channelId: message.channelId };
    }
    async toggleReaction(userId, messageId, emoji) {
        const existing = await this.prisma.messageReaction.findFirst({
            where: {
                messageId,
                userId,
                emoji,
            },
        });
        if (existing) {
            return this.removeReaction(userId, messageId, emoji);
        }
        else {
            return this.addReaction(userId, messageId, emoji);
        }
    }
    async getMessageReactions(messageId) {
        const reactions = await this.prisma.messageReaction.findMany({
            where: { messageId },
            include: {
                user: {
                    select: { id: true, name: true, handle: true, avatarUrl: true },
                },
            },
            orderBy: { createdAt: 'asc' },
        });
        const grouped = reactions.reduce((acc, reaction) => {
            if (!acc[reaction.emoji]) {
                acc[reaction.emoji] = {
                    emoji: reaction.emoji,
                    count: 0,
                    users: [],
                };
            }
            acc[reaction.emoji].count++;
            acc[reaction.emoji].users.push(reaction.user);
            return acc;
        }, {});
        return Object.values(grouped);
    }
    async getReactionSummary(messageId) {
        const reactions = await this.prisma.messageReaction.groupBy({
            by: ['emoji'],
            where: { messageId },
            _count: { emoji: true },
        });
        return reactions.map((r) => ({
            emoji: r.emoji,
            count: r._count.emoji,
        }));
    }
    async canAccessMessage(userId, messageId) {
        const message = await this.prisma.channelMessage.findUnique({
            where: { id: messageId },
            select: {
                channel: {
                    select: {
                        members: {
                            where: { userId },
                            select: { id: true },
                        },
                    },
                },
            },
        });
        return message?.channel?.members?.length > 0;
    }
};
exports.ReactionsService = ReactionsService;
exports.ReactionsService = ReactionsService = ReactionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReactionsService);
//# sourceMappingURL=reactions.service.js.map