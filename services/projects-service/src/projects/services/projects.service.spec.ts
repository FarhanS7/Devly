import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectsService } from './projects.service';

// Define local enums to bypass broken @prisma/client
enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
}

enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

jest.mock('@prisma/client', () => ({
  TaskStatus: {
    TODO: 'TODO',
    IN_PROGRESS: 'IN_PROGRESS',
    REVIEW: 'REVIEW',
    DONE: 'DONE',
  },
  TaskPriority: {
    LOW: 'LOW',
    MEDIUM: 'MEDIUM',
    HIGH: 'HIGH',
    URGENT: 'URGENT',
  },
}));

const mockPrismaService = {
  project: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  task: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
  },
  taskActivity: {
    create: jest.fn(),
  },
};

describe('ProjectsService', () => {
  let service: ProjectsService;
  let prisma: typeof mockPrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProjectsService>(ProjectsService);
    prisma = mockPrismaService;
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createProject', () => {
    it('should create a project', async () => {
      const userId = 'user-1';
      const  dto = { name: 'My Project', description: 'Test project' };
      const expectedResult = { id: 'proj-1', ...dto, ownerId: userId };

      prisma.project.create.mockResolvedValue(expectedResult);

      const result = await service.createProject(userId, dto);

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: { ...dto, ownerId: userId },
        include: { owner: { select: { id: true, name: true, handle: true, avatarUrl: true } } },
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getMyProjects', () => {
    it('should return paginated projects', async () => {
      const userId = 'user-1';
      const projects = [
        { id: 'proj-1', name: 'Project 1', _count: { tasks: 5 } },
        { id: 'proj-2', name: 'Project 2', _count: { tasks: 3 } },
      ];

      prisma.project.findMany.mockResolvedValue(projects);

      const result = await service.getMyProjects(userId);

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBeNull();
    });

    it('should return nextCursor when there are more items', async () => {
      const userId = 'user-1';
      const projects = Array.from({ length: 21 }, (_, i) => ({
        id: `proj-${i}`,
        name: `Project ${i}`,
      }));

      prisma.project.findMany.mockResolvedValue(projects);

      const result = await service.getMyProjects(userId, { limit: 20 });

      expect(result.items).toHaveLength(20);
      expect(result.nextCursor).toBe('proj-19');
    });
  });

  describe('getAssignedTasks', () => {
    it('should return paginated assigned tasks', async () => {
      const userId = 'user-1';
      const tasks = [
        { id: 'task-1', title: 'Task 1', project: { id: 'p1', name: 'P1' } },
        { id: 'task-2', title: 'Task 2', project: { id: 'p2', name: 'P2' } },
      ];

      prisma.task.findMany.mockResolvedValue(tasks);

      const result = await service.getAssignedTasks(userId);

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBeNull();
      expect(prisma.task.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ assigneeId: userId }) }),
      );
    });
  });

  describe('getProjectById', () => {
    it('should return project if user is owner', async () => {
      const userId = 'user-1';
      const projectId = 'proj-1';
      const project = { id: projectId, ownerId: userId, tasks: [] };

      prisma.project.findUnique.mockResolvedValue(project);

      const result = await service.getProjectById(userId, projectId);

      expect(result).toEqual(project);
    });

    it('should throw NotFoundException if project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(service.getProjectById('user-1', 'proj-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      const project = { id: 'proj-1', ownerId: 'user-2' };
      prisma.project.findUnique.mockResolvedValue(project);

      await expect(service.getProjectById('user-1', 'proj-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('createTask', () => {
    it('should create a task and log activity', async () => {
      const userId = 'user-1';
      const projectId = 'proj-1';
      const dto = { title: 'New Task', priority: TaskPriority.HIGH };
      const project = { id: projectId, ownerId: userId };
      const task = { id: 'task-1', ...dto, projectId, creatorId: userId };

      prisma.project.findUnique.mockResolvedValue(project);
      prisma.task.create.mockResolvedValue(task);

      const result = await service.createTask(userId, projectId, dto);

      expect(prisma.task.create).toHaveBeenCalled();
      expect(prisma.taskActivity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: 'CREATED' }),
      });
      expect(result).toEqual(task);
    });

    it('should throw NotFoundException if project does not exist', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      await expect(service.createTask('user-1', 'proj-1', { title: 'Task' })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should validate assignee exists', async () => {
      const userId = 'user-1';
      const projectId = 'proj-1';
      const dto = { title: 'Task', assigneeId: 'user-999' };
      const project = { id: projectId, ownerId: userId };

      prisma.project.findUnique.mockResolvedValue(project);
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.createTask(userId, projectId, dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateTask', () => {
    it('should update task and log status change', async () => {
      const userId = 'user-1';
      const taskId = 'task-1';
      const task = {
        id: taskId,
        status: TaskStatus.TODO,
        project: { ownerId: userId },
        assigneeId: null,
        priority: TaskPriority.MEDIUM,
      };
      const dto = { status: TaskStatus.IN_PROGRESS };

      prisma.task.findUnique.mockResolvedValue(task);
      prisma.task.update.mockResolvedValue({ ...task, ...dto });

      await service.updateTask(userId, taskId, dto);

      expect(prisma.task.update).toHaveBeenCalled();
      expect(prisma.taskActivity.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ type: 'STATUS_CHANGED' }),
      });
    });

    it('should throw error for invalid status transition', async () => {
      const task = {
        id: 'task-1',
        status: TaskStatus.TODO,
        project: { ownerId: 'user-1' },
        assigneeId: null,
      };
      const dto = { status: TaskStatus.DONE }; // Invalid: TODO -> DONE

      prisma.task.findUnique.mockResolvedValue(task);

      await expect(service.updateTask('user-1', 'task-1', dto)).rejects.toThrow(BadRequestException);
    });

    it('should allow owner or assignee to update', async () => {
      const task = {
        id: 'task-1',
        status: TaskStatus.IN_PROGRESS,
        project: { ownerId: 'owner-1' },
        assigneeId: 'assignee-1',
        priority: TaskPriority.MEDIUM,
      };

      prisma.task.findUnique.mockResolvedValue(task);
      prisma.task.update.mockResolvedValue(task);

      // Assignee can update
      await expect(service.updateTask('assignee-1', 'task-1', { status: TaskStatus.DONE })).resolves.toBeDefined();
    });

    it('should deny access to non-owner/non-assignee', async () => {
      const task = {
        id: 'task-1',
        project: { ownerId: 'owner-1' },
        assigneeId: 'assignee-1',
      };

      prisma.task.findUnique.mockResolvedValue(task);

      await expect(service.updateTask('other-user', 'task-1', {})).rejects.toThrow(ForbiddenException);
    });
  });

  describe('deleteTask', () => {
    it('should allow owner to delete task', async () => {
      const task = { id: 'task-1', project: { ownerId: 'user-1' } };

      prisma.task.findUnique.mockResolvedValue(task);
      prisma.task.delete.mockResolvedValue(task);

      await service.deleteTask('user-1', 'task-1');

      expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id: 'task-1' } });
    });

    it('should deny non-owner from deleting', async () => {
      const task = { id: 'task-1', project: { ownerId: 'user-1' } };

      prisma.task.findUnique.mockResolvedValue(task);

      await expect(service.deleteTask('user-2', 'task-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
