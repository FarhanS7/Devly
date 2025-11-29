import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
} from '@nestjs/common';
// @ts-ignore
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ---------------- PROJECTS ----------------

  async createProject(userId: string, dto: CreateProjectDto) {
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

  async getMyProjects(
    userId: string,
    options?: { cursor?: string; limit?: number },
  ) {
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

    let nextCursor: string | null = null;
    if (projects.length > limit) {
      const next = projects.pop();
      nextCursor = next!.id;
    }

    return { items: projects, nextCursor };
  }

  async getAssignedTasks(
    userId: string,
    options?: { cursor?: string; limit?: number; status?: TaskStatus },
  ) {
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

    let nextCursor: string | null = null;
    if (tasks.length > limit) {
      const next = tasks.pop();
      nextCursor = next!.id;
    }

    return { items: tasks, nextCursor };
  }

  async getProjectById(userId: string, projectId: string) {
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
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    if (project.ownerId !== userId) {
      this.logger.warn(`Access denied to project ${projectId} for user ${userId}`);
      throw new ForbiddenException('You do not have access to this project');
    }

    return project;
  }

  async updateProject(userId: string, projectId: string, dto: UpdateProjectDto) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
    
    if (project.ownerId !== userId) {
      throw new ForbiddenException('Only the project owner can update the project');
    }

    this.logger.log(`Updating project ${projectId}`);
    return this.prisma.project.update({
      where: { id: projectId },
      data: dto,
    });
  }

  async deleteProject(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
    
    if (project.ownerId !== userId) {
      throw new ForbiddenException('Only the project owner can delete the project');
    }

    this.logger.log(`Deleting project ${projectId} and all associated tasks`);
    return this.prisma.project.delete({ where: { id: projectId } });
  }

  // ---------------- TASKS ----------------

  async createTask(userId: string, projectId: string, dto: CreateTaskDto) {
    // Validate project exists and user has access
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }
    if (project.ownerId !== userId) {
      throw new ForbiddenException('You do not have permission to create tasks in this project');
    }

    // Validate assignee exists if provided
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

    // Log activity
    await this.logActivity(task.id, userId, 'CREATED', { title: task.title });

    if (dto.assigneeId) {
      await this.logActivity(task.id, userId, 'ASSIGNED', { assigneeId: dto.assigneeId });
    }

    this.logger.log(`Task created: ${task.id}`);
    return task;
  }

  async getTaskById(userId: string, taskId: string) {
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
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Check project access
    if (task.project.ownerId !== userId && task.assigneeId !== userId) {
      this.logger.warn(`Access denied to task ${taskId} for user ${userId}`);
      throw new ForbiddenException('You do not have access to this task');
    }

    return task;
  }

  async updateTask(userId: string, taskId: string, dto: UpdateTaskDto) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Permission: Owner or Assignee
    const isOwner = task.project.ownerId === userId;
    const isAssignee = task.assigneeId === userId;

    if (!isOwner && !isAssignee) {
      throw new ForbiddenException('Only the project owner or task assignee can update this task');
    }

    // Validate assignee exists if being changed
    if (dto.assigneeId && dto.assigneeId !== task.assigneeId) {
      await this.validateUserExists(dto.assigneeId);
    }

    // Validate status transition if status is being changed
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

    // Log activities
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

  async deleteTask(userId: string, taskId: string) {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: { project: true },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${taskId} not found`);
    }

    // Only project owner can delete tasks
    if (task.project.ownerId !== userId) {
      throw new ForbiddenException('Only the project owner can delete tasks');
    }

    this.logger.log(`Deleting task ${taskId}`);
    return this.prisma.task.delete({ where: { id: taskId } });
  }

  // ---------------- HELPERS ----------------

  private async validateUserExists(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      this.logger.warn(`User validation failed: ${userId}`);
      throw new BadRequestException(`User with ID ${userId} does not exist`);
    }
  }

  private validateStatusTransition(from: TaskStatus, to: TaskStatus): void {
    // Define allowed transitions
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      TODO: ['IN_PROGRESS'],
      IN_PROGRESS: ['TODO', 'REVIEW', 'DONE'],
      REVIEW: ['IN_PROGRESS', 'DONE'],
      DONE: ['REVIEW', 'IN_PROGRESS'], // Allow reopening
    };

    const allowed = validTransitions[from];
    if (!allowed || !allowed.includes(to)) {
      throw new BadRequestException(
        `Invalid status transition from ${from} to ${to}. Allowed transitions from ${from}: ${allowed?.join(', ') || 'none'}`,
      );
    }
  }

  private async logActivity(taskId: string, actorId: string, type: string, payload: any) {
    await this.prisma.taskActivity.create({
      data: {
        taskId,
        actorId,
        type,
        payload,
      },
    });
  }
}
