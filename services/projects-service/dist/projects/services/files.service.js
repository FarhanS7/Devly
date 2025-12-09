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
var FilesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let FilesService = FilesService_1 = class FilesService {
    prisma;
    logger = new common_1.Logger(FilesService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async uploadFile(userId, projectId, fileData) {
        await this.verifyProjectAccess(userId, projectId, true);
        this.logger.log(`Uploading file to project ${projectId}: ${fileData.fileName}`);
        const file = await this.prisma.projectFile.create({
            data: {
                projectId,
                fileName: fileData.fileName,
                url: fileData.url,
                size: fileData.size,
                mimeType: fileData.mimeType,
                uploadedBy: userId,
            },
            include: {
                uploader: { select: { id: true, name: true, handle: true, avatarUrl: true } },
            },
        });
        await this.logActivity(projectId, userId, 'FILE_UPLOADED', { fileId: file.id, fileName: fileData.fileName });
        return file;
    }
    async getFiles(userId, projectId) {
        await this.verifyProjectAccess(userId, projectId);
        return this.prisma.projectFile.findMany({
            where: { projectId },
            include: {
                uploader: { select: { id: true, name: true, handle: true, avatarUrl: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async deleteFile(userId, projectId, fileId) {
        await this.verifyProjectAccess(userId, projectId, true);
        const file = await this.prisma.projectFile.findUnique({ where: { id: fileId } });
        if (!file || file.projectId !== projectId) {
            throw new common_1.NotFoundException('File not found');
        }
        this.logger.log(`Deleting file ${fileId}`);
        await this.prisma.projectFile.delete({ where: { id: fileId } });
        await this.logActivity(projectId, userId, 'FILE_DELETED', { fileId, fileName: file.fileName });
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
            throw new common_1.ForbiddenException('Viewers cannot upload or delete files');
        }
        return project;
    }
    async logActivity(projectId, userId, action, metadata) {
        await this.prisma.activityLog.create({
            data: { projectId, userId, action, metadata },
        });
    }
};
exports.FilesService = FilesService;
exports.FilesService = FilesService = FilesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FilesService);
//# sourceMappingURL=files.service.js.map