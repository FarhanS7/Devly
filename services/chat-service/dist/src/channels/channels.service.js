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
exports.ChannelsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const teams_service_1 = require("../teams/teams.service");
let ChannelsService = class ChannelsService {
    constructor(prisma, teamsService) {
        this.prisma = prisma;
        this.teamsService = teamsService;
    }
    generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    async create(teamId, userId, createChannelDto) {
        await this.teamsService.verifyAdminOrOwner(teamId, userId);
        const slug = this.generateSlug(createChannelDto.name);
        const existing = await this.prisma.channel.findUnique({
            where: {
                teamId_slug: {
                    teamId,
                    slug,
                },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('Channel with this name already exists in this team');
        }
        const channelType = createChannelDto.type || client_1.ChannelType.PUBLIC;
        const channel = await this.prisma.channel.create({
            data: {
                teamId,
                name: createChannelDto.name,
                slug,
                description: createChannelDto.description,
                type: channelType,
            },
            include: {
                _count: { select: { members: true, messages: true } },
            },
        });
        if (channelType === client_1.ChannelType.PUBLIC) {
            const teamMembers = await this.prisma.teamMember.findMany({
                where: { teamId },
                select: { userId: true },
            });
            await this.prisma.channelMember.createMany({
                data: teamMembers.map((member) => ({
                    channelId: channel.id,
                    userId: member.userId,
                })),
            });
        }
        else {
            await this.prisma.channelMember.create({
                data: {
                    channelId: channel.id,
                    userId,
                },
            });
        }
        return this.findOne(channel.id, userId);
    }
    async findTeamChannels(teamId, userId) {
        await this.teamsService.verifyMembership(teamId, userId);
        return this.prisma.channel.findMany({
            where: {
                teamId,
                OR: [
                    { type: client_1.ChannelType.PUBLIC },
                    {
                        AND: [
                            { type: client_1.ChannelType.PRIVATE },
                            { members: { some: { userId } } },
                        ],
                    },
                ],
            },
            include: {
                _count: { select: { members: true, messages: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }
    async findOne(channelId, userId) {
        const channel = await this.prisma.channel.findUnique({
            where: { id: channelId },
            include: {
                team: {
                    select: { id: true, name: true, slug: true },
                },
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, handle: true, avatarUrl: true },
                        },
                    },
                    orderBy: { joinedAt: 'asc' },
                },
                _count: { select: { messages: true } },
            },
        });
        if (!channel) {
            throw new common_1.NotFoundException('Channel not found');
        }
        await this.verifyMembership(channelId, userId);
        return channel;
    }
    async update(channelId, userId, updateChannelDto) {
        const channel = await this.prisma.channel.findUnique({
            where: { id: channelId },
            select: { teamId: true, slug: true },
        });
        if (!channel) {
            throw new common_1.NotFoundException('Channel not found');
        }
        await this.teamsService.verifyAdminOrOwner(channel.teamId, userId);
        const data = { ...updateChannelDto };
        if (updateChannelDto.name) {
            const newSlug = this.generateSlug(updateChannelDto.name);
            const existing = await this.prisma.channel.findUnique({
                where: {
                    teamId_slug: {
                        teamId: channel.teamId,
                        slug: newSlug,
                    },
                },
            });
            if (existing && existing.id !== channelId) {
                throw new common_1.BadRequestException('Channel with this name already exists');
            }
            data.slug = newSlug;
        }
        return this.prisma.channel.update({
            where: { id: channelId },
            data,
            include: {
                _count: { select: { members: true, messages: true } },
            },
        });
    }
    async remove(channelId, userId) {
        const channel = await this.prisma.channel.findUnique({
            where: { id: channelId },
            select: { teamId: true },
        });
        if (!channel) {
            throw new common_1.NotFoundException('Channel not found');
        }
        await this.teamsService.verifyAdminOrOwner(channel.teamId, userId);
        return this.prisma.channel.delete({ where: { id: channelId } });
    }
    async addMember(channelId, userId, addMemberDto) {
        const channel = await this.prisma.channel.findUnique({
            where: { id: channelId },
            select: { teamId: true, type: true },
        });
        if (!channel) {
            throw new common_1.NotFoundException('Channel not found');
        }
        if (channel.type === client_1.ChannelType.PRIVATE) {
            await this.teamsService.verifyAdminOrOwner(channel.teamId, userId);
        }
        else {
            await this.teamsService.verifyMembership(channel.teamId, userId);
        }
        const teamMember = await this.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: channel.teamId,
                    userId: addMemberDto.userId,
                },
            },
        });
        if (!teamMember) {
            throw new common_1.BadRequestException('User must be a team member first');
        }
        const existing = await this.prisma.channelMember.findUnique({
            where: {
                channelId_userId: {
                    channelId,
                    userId: addMemberDto.userId,
                },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('User is already a channel member');
        }
        const member = await this.prisma.channelMember.create({
            data: {
                channelId,
                userId: addMemberDto.userId,
            },
            include: {
                user: {
                    select: { id: true, name: true, handle: true, avatarUrl: true },
                },
            },
        });
        return member;
    }
    async removeMember(channelId, userId, targetUserId) {
        const channel = await this.prisma.channel.findUnique({
            where: { id: channelId },
            select: { teamId: true },
        });
        if (!channel) {
            throw new common_1.NotFoundException('Channel not found');
        }
        const isSelfLeave = userId === targetUserId;
        if (!isSelfLeave) {
            await this.teamsService.verifyAdminOrOwner(channel.teamId, userId);
        }
        const member = await this.prisma.channelMember.findUnique({
            where: {
                channelId_userId: {
                    channelId,
                    userId: targetUserId,
                },
            },
        });
        if (!member) {
            throw new common_1.NotFoundException('Member not found in this channel');
        }
        return this.prisma.channelMember.delete({
            where: {
                channelId_userId: {
                    channelId,
                    userId: targetUserId,
                },
            },
        });
    }
    async getMessages(channelId, userId, options) {
        await this.verifyMembership(channelId, userId);
        const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
        const cursor = options?.cursor;
        const messages = await this.prisma.channelMessage.findMany({
            take: limit + 1,
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
            where: { channelId, parentId: null },
            orderBy: { createdAt: 'desc' },
            include: {
                sender: {
                    select: { id: true, name: true, handle: true, avatarUrl: true },
                },
                _count: { select: { replies: true, reactions: true } },
            },
        });
        let nextCursor = null;
        if (messages.length > limit) {
            const next = messages.pop();
            nextCursor = next.id;
        }
        return { messages: messages.reverse(), nextCursor };
    }
    async verifyMembership(channelId, userId) {
        const member = await this.prisma.channelMember.findUnique({
            where: {
                channelId_userId: {
                    channelId,
                    userId,
                },
            },
        });
        if (!member) {
            throw new common_1.ForbiddenException('You are not a member of this channel');
        }
    }
    async isMember(channelId, userId) {
        const member = await this.prisma.channelMember.findUnique({
            where: {
                channelId_userId: {
                    channelId,
                    userId,
                },
            },
        });
        return !!member;
    }
};
exports.ChannelsService = ChannelsService;
exports.ChannelsService = ChannelsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        teams_service_1.TeamsService])
], ChannelsService);
//# sourceMappingURL=channels.service.js.map