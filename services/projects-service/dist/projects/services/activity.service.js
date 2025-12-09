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
var ActivityService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ActivityService = ActivityService_1 = class ActivityService {
    prisma;
    logger = new common_1.Logger(ActivityService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProjectActivity(userId, projectId, limit = 50) {
        await this.verifyProjectAccess(userId, projectId);
        return this.prisma.activityLog.findMany({
            where: { projectId },
            include: {
                actor: { select: { id: true, name: true, handle: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
    }
    async logActivity(projectId, userId, action, metadata) {
        await this.prisma.activityLog.create({
            data: { projectId, userId, action, metadata },
        });
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
};
exports.ActivityService = ActivityService;
exports.ActivityService = ActivityService = ActivityService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ActivityService);
//# sourceMappingURL=activity.service.js.map