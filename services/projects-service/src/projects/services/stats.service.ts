import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class StatsService {
  private readonly logger = new Logger(StatsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getProjectStats(userId: string, projectId: string) {
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

    const overdueTasks = tasks.filter(
      (t) => t.deadline && new Date(t.deadline) < now && t.status !== 'DONE',
    ).length;

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
