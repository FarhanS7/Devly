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
var StatsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let StatsService = StatsService_1 = class StatsService {
    prisma;
    logger = new common_1.Logger(StatsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getProjectStats(userId, projectId) {
        await this.verifyProjectAccess(userId, projectId);
        const tasks = await this.prisma.task.findMany({
            where: { projectId },
            select: { status: true, priority: true, deadline: true },
        });
        const now = new Date();
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === 'DONE').length;
        const tasksByStatus = {
            TODO: tasks.filter((t) => t.status === 'TODO').length,
            IN_PROGRESS: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
            REVIEW: tasks.filter((t) => t.status === 'REVIEW').length,
            DONE: completedTasks,
        };
        const tasksByPriority = {
            LOW: tasks.filter((t) => t.priority === 'LOW').length,
            MEDIUM: tasks.filter((t) => t.priority === 'MEDIUM').length,
            HIGH: tasks.filter((t) => t.priority === 'HIGH').length,
            URGENT: tasks.filter((t) => t.priority === 'URGENT').length,
        };
        const overdueTasks = tasks.filter((t) => t.deadline && new Date(t.deadline) < now && t.status !== 'DONE').length;
        const upcomingDeadlines = await this.prisma.task.findMany({
            where: {
                projectId,
                status: { not: 'DONE' },
                deadline: { gte: now },
            },
            orderBy: { deadline: 'asc' },
            take: 5,
            select: { id: true, title: true, deadline: true, priority: true },
        });
        return {
            totalTasks,
            completedTasks,
            tasksByStatus,
            tasksByPriority,
            overdueTasks,
            upcomingDeadlines,
            completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
        };
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
exports.StatsService = StatsService;
exports.StatsService = StatsService = StatsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], StatsService);
//# sourceMappingURL=stats.service.js.map