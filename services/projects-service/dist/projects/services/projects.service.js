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
var ProjectsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ProjectsService = ProjectsService_1 = class ProjectsService {
    prisma;
    logger = new common_1.Logger(ProjectsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createProject(userId, dto) {
        this.logger.log(`Creating project for user ${userId}: ${dto.name}`);
        const project = await this.prisma.project.create({
            data: {
                ...dto,
                ownerId: userId,
            },
            include: {
                owner: { select: { id: true, name: true, handle: true, avatarUrl: true } },
            },
        });
        this.logger.log(`Project created: ${project.id}`);
        return project;
    }
    async getMyProjects(userId, options) {
        const limit = Math.min(Math.max(options?.limit ?? 20, 1), 50);
        const cursor = options?.cursor;
        const projects = await this.prisma.project.findMany({
            take: limit + 1,
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
            where: { ownerId: userId },
            orderBy: { updatedAt: 'desc' },
            include: {
                _count: { select: { tasks: true } },
            },
        });
        let nextCursor = null;
        if (projects.length > limit) {
            const next = projects.pop();
            nextCursor = next.id;
        }
        return { items: projects, nextCursor };
    }
    async getAssignedTasks(userId, options) {
        const limit = Math.min(Math.max(options?.limit ?? 20, 1), 50);
        const cursor = options?.cursor;
        const tasks = await this.prisma.task.findMany({
            take: limit + 1,
            ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
            where: {
                assigneeId: userId,
                ...(options?.status ? { status: options.status } : {}),
            },
            orderBy: { updatedAt: 'desc' },
            include: {
                project: { select: { id: true, name: true } },
                creator: { select: { id: true, name: true, handle: true, avatarUrl: true } },
            },
        });
        let nextCursor = null;
        if (tasks.length > limit) {
            const next = tasks.pop();
            nextCursor = next.id;
        }
        return { items: tasks, nextCursor };
    }
    async getProjectById(userId, projectId) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            include: {
                owner: { select: { id: true, name: true, handle: true, avatarUrl: true } },
                tasks: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        assignee: { select: { id: true, name: true, handle: true, avatarUrl: true } },
                    },
                },
            },
        });
        if (!project) {
            this.logger.warn(`Project not found: ${projectId}`);
            throw new common_1.NotFoundException(`Project with ID ${projectId} not found`);
        }
        if (project.ownerId !== userId) {
            this.logger.warn(`Access denied to project ${projectId} for user ${userId}`);
            throw new common_1.ForbiddenException('You do not have access to this project');
        }
        return project;
    }
    async updateProject(userId, projectId, dto) {
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
            throw new common_1.NotFoundException(`Project with ID ${projectId} not found`);
        }
        if (project.ownerId !== userId) {
            throw new common_1.ForbiddenException('Only the project owner can update the project');
        }
        this.logger.log(`Updating project ${projectId}`);
        return this.prisma.project.update({
            where: { id: projectId },
            data: dto,
        });
    }
    async deleteProject(userId, projectId) {
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
            throw new common_1.NotFoundException(`Project with ID ${projectId} not found`);
        }
        if (project.ownerId !== userId) {
            throw new common_1.ForbiddenException('Only the project owner can delete the project');
        }
        this.logger.log(`Deleting project ${projectId} and all associated tasks`);
        return this.prisma.project.delete({ where: { id: projectId } });
    }
    async createTask(userId, projectId, dto) {
        const project = await this.prisma.project.findUnique({ where: { id: projectId } });
        if (!project) {
            throw new common_1.NotFoundException(`Project with ID ${projectId} not found`);
        }
        if (project.ownerId !== userId) {
            throw new common_1.ForbiddenException('You do not have permission to create tasks in this project');
        }
        if (dto.assigneeId) {
            await this.validateUserExists(dto.assigneeId);
        }
        this.logger.log(`Creating task in project ${projectId}: ${dto.title}`);
        const task = await this.prisma.task.create({
            data: {
                ...dto,
                projectId,
                creatorId: userId,
            },
            include: {
                assignee: { select: { id: true, name: true, handle: true, avatarUrl: true } },
            },
        });
        await this.logActivity(task.id, userId, 'CREATED', { title: task.title });
        if (dto.assigneeId) {
            await this.logActivity(task.id, userId, 'ASSIGNED', { assigneeId: dto.assigneeId });
        }
        this.logger.log(`Task created: ${task.id}`);
        return task;
    }
    async getTaskById(userId, taskId) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: {
                project: true,
                assignee: { select: { id: true, name: true, handle: true, avatarUrl: true } },
                creator: { select: { id: true, name: true, handle: true, avatarUrl: true } },
                activities: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        actor: { select: { id: true, name: true, handle: true, avatarUrl: true } },
                    },
                },
            },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task with ID ${taskId} not found`);
        }
        if (task.project.ownerId !== userId && task.assigneeId !== userId) {
            this.logger.warn(`Access denied to task ${taskId} for user ${userId}`);
            throw new common_1.ForbiddenException('You do not have access to this task');
        }
        return task;
    }
    async updateTask(userId, taskId, dto) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: { project: true },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task with ID ${taskId} not found`);
        }
        const isOwner = task.project.ownerId === userId;
        const isAssignee = task.assigneeId === userId;
        if (!isOwner && !isAssignee) {
            throw new common_1.ForbiddenException('Only the project owner or task assignee can update this task');
        }
        if (dto.assigneeId && dto.assigneeId !== task.assigneeId) {
            await this.validateUserExists(dto.assigneeId);
        }
        if (dto.status && dto.status !== task.status) {
            this.validateStatusTransition(task.status, dto.status);
        }
        this.logger.log(`Updating task ${taskId}`);
        const updated = await this.prisma.task.update({
            where: { id: taskId },
            data: dto,
            include: {
                assignee: { select: { id: true, name: true, handle: true, avatarUrl: true } },
            },
        });
        if (dto.status && dto.status !== task.status) {
            await this.logActivity(taskId, userId, 'STATUS_CHANGED', { from: task.status, to: dto.status });
        }
        if (dto.assigneeId && dto.assigneeId !== task.assigneeId) {
            await this.logActivity(taskId, userId, 'ASSIGNED', { assigneeId: dto.assigneeId });
        }
        if (dto.priority && dto.priority !== task.priority) {
            await this.logActivity(taskId, userId, 'PRIORITY_CHANGED', { from: task.priority, to: dto.priority });
        }
        return updated;
    }
    async deleteTask(userId, taskId) {
        const task = await this.prisma.task.findUnique({
            where: { id: taskId },
            include: { project: true },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task with ID ${taskId} not found`);
        }
        if (task.project.ownerId !== userId) {
            throw new common_1.ForbiddenException('Only the project owner can delete tasks');
        }
        this.logger.log(`Deleting task ${taskId}`);
        return this.prisma.task.delete({ where: { id: taskId } });
    }
    async validateUserExists(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { id: true },
        });
        if (!user) {
            this.logger.warn(`User validation failed: ${userId}`);
            throw new common_1.BadRequestException(`User with ID ${userId} does not exist`);
        }
    }
    validateStatusTransition(from, to) {
        const validTransitions = {
            TODO: ['IN_PROGRESS'],
            IN_PROGRESS: ['TODO', 'REVIEW', 'DONE'],
            REVIEW: ['IN_PROGRESS', 'DONE'],
            DONE: ['REVIEW', 'IN_PROGRESS'],
        };
        const allowed = validTransitions[from];
        if (!allowed || !allowed.includes(to)) {
            throw new common_1.BadRequestException(`Invalid status transition from ${from} to ${to}. Allowed transitions from ${from}: ${allowed?.join(', ') || 'none'}`);
        }
    }
    async logActivity(taskId, actorId, type, payload) {
        await this.prisma.taskActivity.create({
            data: {
                taskId,
                actorId,
                type,
                payload,
            },
        });
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = ProjectsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map