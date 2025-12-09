import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async uploadFile(
    userId: string,
    projectId: string,
    fileData: { fileName: string; url: string; size: number; mimeType: string },
  ) {
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

  async getFiles(userId: string, projectId: string) {
    await this.verifyProjectAccess(userId, projectId);

    return this.prisma.projectFile.findMany({
      where: { projectId },
      include: {
        uploader: { select: { id: true, name: true, handle: true, avatarUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async deleteFile(userId: string, projectId: string, fileId: string) {
    await this.verifyProjectAccess(userId, projectId, true);

    const file = await this.prisma.projectFile.findUnique({ where: { id: fileId } });
    if (!file || file.projectId !== projectId) {
      throw new NotFoundException('File not found');
    }

    this.logger.log(`Deleting file ${fileId}`);

    await this.prisma.projectFile.delete({ where: { id: fileId } });

    await this.logActivity(projectId, userId, 'FILE_DELETED', { fileId, fileName: file.fileName });

    return { success: true };
  }

  // Helpers
  private async verifyProjectAccess(userId: string, projectId: string, requireEditor = false) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerId === userId) return project;

    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!member) {
      throw new ForbiddenException('You do not have access to this project');
    }

    if (requireEditor && member.role === 'VIEWER') {
      throw new ForbiddenException('Viewers cannot upload or delete files');
    }

    return project;
  }

  private async logActivity(projectId: string, userId: string, action: string, metadata: any) {
    await this.prisma.activityLog.create({
      data: { projectId, userId, action, metadata },
    });
  }
}
