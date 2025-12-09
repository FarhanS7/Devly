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
var MembersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MembersService = void 0;
const common_1 = require("@nestjs/common");
const events_service_1 = require("../../events/events.service");
const prisma_service_1 = require("../../prisma/prisma.service");
let MembersService = MembersService_1 = class MembersService {
    prisma;
    eventsService;
    logger = new common_1.Logger(MembersService_1.name);
    constructor(prisma, eventsService) {
        this.prisma = prisma;
        this.eventsService = eventsService;
    }
    async addMember(userId, projectId, dto) {
        await this.verifyProjectOwner(userId, projectId);
        const existing = await this.prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId: dto.userId } },
        });
        if (existing) {
            throw new common_1.ForbiddenException('User is already a member of this project');
        }
        this.logger.log(`Adding member ${dto.userId} to project ${projectId}`);
        const member = await this.prisma.projectMember.create({
            data: {
                projectId,
                userId: dto.userId,
                role: dto.role || 'VIEWER',
            },
            include: {
                user: { select: { id: true, name: true, handle: true, avatarUrl: true } },
            },
        });
        await this.logActivity(projectId, userId, 'MEMBER_ADDED', { memberId: dto.userId, role: dto.role });
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        await this.eventsService.emitMemberAdded({
            projectId,
            projectName: project?.name,
            memberId: dto.userId,
            memberName: member.user?.name,
            actorId: userId,
            role: dto.role || 'VIEWER',
        });
        return member;
    }
    async getMembers(userId, projectId) {
        await this.verifyProjectAccess(userId, projectId);
        return this.prisma.projectMember.findMany({
            where: { projectId },
            include: {
                user: { select: { id: true, name: true, handle: true, avatarUrl: true } },
            },
            orderBy: { joinedAt: 'asc' },
        });
    }
    async updateMemberRole(userId, projectId, memberId, dto) {
        await this.verifyProjectOwner(userId, projectId);
        const member = await this.prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId: memberId } },
        });
        if (!member) {
            throw new common_1.NotFoundException('Member not found');
        }
        if (member.role === 'OWNER') {
            throw new common_1.ForbiddenException('Cannot change the owner role');
        }
        this.logger.log(`Updating member ${memberId} role to ${dto.role}`);
        const updated = await this.prisma.projectMember.update({
            where: { projectId_userId: { projectId, userId: memberId } },
            data: { role: dto.role },
            include: {
                user: { select: { id: true, name: true, handle: true, avatarUrl: true } },
            },
        });
        await this.logActivity(projectId, userId, 'MEMBER_ROLE_CHANGED', { memberId, newRole: dto.role });
        this.eventsService.emitMemberRoleUpdated({
            projectId,
            memberId,
            memberName: updated.user?.name,
            actorId: userId,
            role: dto.role,
        });
        return updated;
    }
    async removeMember(userId, projectId, memberId) {
        await this.verifyProjectOwner(userId, projectId);
        const member = await this.prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId: memberId } },
        });
        if (!member) {
            throw new common_1.NotFoundException('Member not found');
        }
        if (member.role === 'OWNER') {
            throw new common_1.ForbiddenException('Cannot remove the project owner');
        }
        this.logger.log(`Removing member ${memberId} from project ${projectId}`);
        await this.prisma.projectMember.delete({
            where: { projectId_userId: { projectId, userId: memberId } },
        });
        await this.logActivity(projectId, userId, 'MEMBER_REMOVED', { memberId });
        this.eventsService.emitMemberRemoved({
            projectId,
            memberId,
            actorId: userId,
        });
        return { success: true };
    }
    async verifyProjectOwner(userId, projectId) {
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        if (project.ownerId !== userId) {
            throw new common_1.ForbiddenException('Only the project owner can perform this action');
        }
        return project;
    }
    async verifyProjectAccess(userId, projectId) {
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
            throw new common_1.NotFoundException('Project not found');
        }
        if (project.ownerId === userId)
            return project;
        const member = await this.prisma.projectMember.findUnique({
            where: { projectId_userId: { projectId, userId } },
        });
        if (!member) {
            throw new common_1.ForbiddenException('You do not have access to this project');
        }
        return project;
    }
    async logActivity(projectId, userId, action, metadata) {
        await this.prisma.activityLog.create({
            data: { projectId, userId, action, metadata },
        });
    }
};
exports.MembersService = MembersService;
exports.MembersService = MembersService = MembersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_service_1.EventsService])
], MembersService);
//# sourceMappingURL=members.service.js.map