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
var NotesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let NotesService = NotesService_1 = class NotesService {
    prisma;
    logger = new common_1.Logger(NotesService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createNote(userId, projectId, dto) {
        await this.verifyProjectAccess(userId, projectId);
        this.logger.log(`Creating note in project ${projectId}: ${dto.title}`);
        const note = await this.prisma.projectNote.create({
            data: {
                projectId,
                title: dto.title,
                content: dto.content || {},
                createdBy: userId,
            },
            include: {
                author: { select: { id: true, name: true, handle: true, avatarUrl: true } },
            },
        });
        await this.logActivity(projectId, userId, 'NOTE_CREATED', { noteId: note.id, title: dto.title });
        return note;
    }
    async getNotes(userId, projectId) {
        await this.verifyProjectAccess(userId, projectId);
        return this.prisma.projectNote.findMany({
            where: { projectId },
            include: {
                author: { select: { id: true, name: true, handle: true, avatarUrl: true } },
            },
            orderBy: { updatedAt: 'desc' },
        });
    }
    async getNote(userId, projectId, noteId) {
        await this.verifyProjectAccess(userId, projectId);
        const note = await this.prisma.projectNote.findUnique({
            where: { id: noteId },
            include: {
                author: { select: { id: true, name: true, handle: true, avatarUrl: true } },
            },
        });
        if (!note || note.projectId !== projectId) {
            throw new common_1.NotFoundException('Note not found');
        }
        return note;
    }
    async updateNote(userId, projectId, noteId, dto) {
        await this.verifyProjectAccess(userId, projectId, true);
        const note = await this.prisma.projectNote.findUnique({ where: { id: noteId } });
        if (!note || note.projectId !== projectId) {
            throw new common_1.NotFoundException('Note not found');
        }
        this.logger.log(`Updating note ${noteId}`);
        const updated = await this.prisma.projectNote.update({
            where: { id: noteId },
            data: dto,
            include: {
                author: { select: { id: true, name: true, handle: true, avatarUrl: true } },
            },
        });
        await this.logActivity(projectId, userId, 'NOTE_UPDATED', { noteId });
        return updated;
    }
    async deleteNote(userId, projectId, noteId) {
        await this.verifyProjectAccess(userId, projectId, true);
        const note = await this.prisma.projectNote.findUnique({ where: { id: noteId } });
        if (!note || note.projectId !== projectId) {
            throw new common_1.NotFoundException('Note not found');
        }
        this.logger.log(`Deleting note ${noteId}`);
        await this.prisma.projectNote.delete({ where: { id: noteId } });
        await this.logActivity(projectId, userId, 'NOTE_DELETED', { noteId });
        return { success: true };
    }
    async verifyProjectAccess(userId, projectId, requireEditor = false) {
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
        if (requireEditor && member.role === 'VIEWER') {
            throw new common_1.ForbiddenException('Viewers cannot edit notes');
        }
        return project;
    }
    async logActivity(projectId, userId, action, metadata) {
        await this.prisma.activityLog.create({
            data: { projectId, userId, action, metadata },
        });
    }
};
exports.NotesService = NotesService;
exports.NotesService = NotesService = NotesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotesService);
//# sourceMappingURL=notes.service.js.map