import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getProjectActivity(userId: string, projectId: string, limit = 50) {
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

  async logActivity(projectId: string, userId: string, action: string, metadata: any) {
    await this.prisma.activityLog.create({
      data: { projectId, userId, action, metadata },
    });
  }

  // Helpers
  private async verifyProjectAccess(userId: string, projectId: string) {
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

    return project;
  }
}
