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
exports.TeamsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
let TeamsService = class TeamsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    generateSlug(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }
    async create(userId, createTeamDto) {
        const slug = this.generateSlug(createTeamDto.name);
        const existing = await this.prisma.team.findUnique({ where: { slug } });
        if (existing) {
            throw new common_1.BadRequestException('Team with this name already exists');
        }
        const team = await this.prisma.team.create({
            data: {
                ...createTeamDto,
                slug,
                ownerId: userId,
                members: {
                    create: {
                        userId,
                        role: client_1.TeamRole.OWNER,
                    },
                },
            },
            include: {
                owner: {
                    select: { id: true, name: true, handle: true, avatarUrl: true },
                },
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, handle: true, avatarUrl: true },
                        },
                    },
                },
                _count: { select: { channels: true, members: true } },
            },
        });
        return team;
    }
    async findUserTeams(userId) {
        return this.prisma.team.findMany({
            where: {
                members: {
                    some: { userId },
                },
            },
            include: {
                owner: {
                    select: { id: true, name: true, handle: true, avatarUrl: true },
                },
                _count: { select: { channels: true, members: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(teamId, userId) {
        const team = await this.prisma.team.findUnique({
            where: { id: teamId },
            include: {
                owner: {
                    select: { id: true, name: true, handle: true, avatarUrl: true },
                },
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, handle: true, avatarUrl: true, email: true },
                        },
                    },
                    orderBy: { joinedAt: 'asc' },
                },
                channels: {
                    where: {
                        OR: [
                            { type: 'PUBLIC' },
                            {
                                AND: [
                                    { type: 'PRIVATE' },
                                    { members: { some: { userId } } },
                                ],
                            },
                        ],
                    },
                    orderBy: { createdAt: 'asc' },
                },
            },
        });
        if (!team) {
            throw new common_1.NotFoundException('Team not found');
        }
        await this.verifyMembership(teamId, userId);
        return team;
    }
    async update(teamId, userId, updateTeamDto) {
        await this.verifyAdminOrOwner(teamId, userId);
        const data = { ...updateTeamDto };
        if (updateTeamDto.name) {
            const newSlug = this.generateSlug(updateTeamDto.name);
            const existing = await this.prisma.team.findUnique({
                where: { slug: newSlug },
            });
            if (existing && existing.id !== teamId) {
                throw new common_1.BadRequestException('Team with this name already exists');
            }
            data.slug = newSlug;
        }
        return this.prisma.team.update({
            where: { id: teamId },
            data,
            include: {
                owner: {
                    select: { id: true, name: true, handle: true, avatarUrl: true },
                },
                _count: { select: { channels: true, members: true } },
            },
        });
    }
    async remove(teamId, userId) {
        await this.verifyOwner(teamId, userId);
        return this.prisma.team.delete({ where: { id: teamId } });
    }
    async addMember(teamId, userId, addMemberDto) {
        await this.verifyAdminOrOwner(teamId, userId);
        const existing = await this.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId: addMemberDto.userId,
                },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException('User is already a team member');
        }
        const targetUser = await this.prisma.user.findUnique({
            where: { id: addMemberDto.userId },
        });
        if (!targetUser) {
            throw new common_1.NotFoundException('User not found');
        }
        const member = await this.prisma.teamMember.create({
            data: {
                teamId,
                userId: addMemberDto.userId,
                role: addMemberDto.role || client_1.TeamRole.MEMBER,
            },
            include: {
                user: {
                    select: { id: true, name: true, handle: true, avatarUrl: true, email: true },
                },
            },
        });
        return member;
    }
    async removeMember(teamId, userId, targetUserId) {
        await this.verifyAdminOrOwner(teamId, userId);
        const member = await this.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId: targetUserId,
                },
            },
        });
        if (!member) {
            throw new common_1.NotFoundException('Member not found');
        }
        if (member.role === client_1.TeamRole.OWNER) {
            throw new common_1.BadRequestException('Cannot remove team owner');
        }
        return this.prisma.teamMember.delete({
            where: {
                teamId_userId: {
                    teamId,
                    userId: targetUserId,
                },
            },
        });
    }
    async updateMemberRole(teamId, userId, targetUserId, updateRoleDto) {
        await this.verifyOwner(teamId, userId);
        const member = await this.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId: targetUserId,
                },
            },
        });
        if (!member) {
            throw new common_1.NotFoundException('Member not found');
        }
        if (member.role === client_1.TeamRole.OWNER || updateRoleDto.role === client_1.TeamRole.OWNER) {
            throw new common_1.BadRequestException('Cannot modify owner role');
        }
        return this.prisma.teamMember.update({
            where: {
                teamId_userId: {
                    teamId,
                    userId: targetUserId,
                },
            },
            data: { role: updateRoleDto.role },
            include: {
                user: {
                    select: { id: true, name: true, handle: true, avatarUrl: true },
                },
            },
        });
    }
    async verifyMembership(teamId, userId) {
        const member = await this.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId,
                },
            },
        });
        if (!member) {
            throw new common_1.ForbiddenException('You are not a member of this team');
        }
    }
    async verifyAdminOrOwner(teamId, userId) {
        const member = await this.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId,
                },
            },
        });
        if (!member || (member.role !== client_1.TeamRole.OWNER && member.role !== client_1.TeamRole.ADMIN)) {
            throw new common_1.ForbiddenException('Only team admins or owner can perform this action');
        }
    }
    async verifyOwner(teamId, userId) {
        const team = await this.prisma.team.findUnique({
            where: { id: teamId },
            select: { ownerId: true },
        });
        if (!team) {
            throw new common_1.NotFoundException('Team not found');
        }
        if (team.ownerId !== userId) {
            throw new common_1.ForbiddenException('Only team owner can perform this action');
        }
    }
    async getMemberRole(teamId, userId) {
        const member = await this.prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId,
                    userId,
                },
            },
            select: { role: true },
        });
        return member?.role || null;
    }
};
exports.TeamsService = TeamsService;
exports.TeamsService = TeamsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeamsService);
//# sourceMappingURL=teams.service.js.map