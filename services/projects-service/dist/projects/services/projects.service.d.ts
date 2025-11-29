import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
export declare class ProjectsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    createProject(userId: string, dto: CreateProjectDto): Promise<{
        owner: {
            name: string | null;
            id: string;
            handle: string;
            avatarUrl: string | null;
        };
    } & {
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    }>;
    getMyProjects(userId: string, options?: {
        cursor?: string;
        limit?: number;
    }): Promise<{
        items: ({
            _count: {
                tasks: number;
            };
        } & {
            name: string;
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            ownerId: string;
        })[];
        nextCursor: string | null;
    }>;
    getAssignedTasks(userId: string, options?: {
        cursor?: string;
        limit?: number;
        status?: TaskStatus;
    }): Promise<{
        items: ({
            project: {
                name: string;
                id: string;
            };
            creator: {
                name: string | null;
                id: string;
                handle: string;
                avatarUrl: string | null;
            };
        } & {
            description: string | null;
            title: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            status: import("@prisma/client").$Enums.TaskStatus;
            assigneeId: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            projectId: string;
            creatorId: string;
        })[];
        nextCursor: string | null;
    }>;
    getProjectById(userId: string, projectId: string): Promise<{
        owner: {
            name: string | null;
            id: string;
            handle: string;
            avatarUrl: string | null;
        };
        tasks: ({
            assignee: {
                name: string | null;
                id: string;
                handle: string;
                avatarUrl: string | null;
            } | null;
        } & {
            description: string | null;
            title: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            status: import("@prisma/client").$Enums.TaskStatus;
            assigneeId: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            projectId: string;
            creatorId: string;
        })[];
    } & {
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    }>;
    updateProject(userId: string, projectId: string, dto: UpdateProjectDto): Promise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    }>;
    deleteProject(userId: string, projectId: string): Promise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    }>;
    createTask(userId: string, projectId: string, dto: CreateTaskDto): Promise<{
        assignee: {
            name: string | null;
            id: string;
            handle: string;
            avatarUrl: string | null;
        } | null;
    } & {
        description: string | null;
        title: string;
        priority: import("@prisma/client").$Enums.TaskPriority;
        status: import("@prisma/client").$Enums.TaskStatus;
        assigneeId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        creatorId: string;
    }>;
    getTaskById(userId: string, taskId: string): Promise<{
        project: {
            name: string;
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            ownerId: string;
        };
        creator: {
            name: string | null;
            id: string;
            handle: string;
            avatarUrl: string | null;
        };
        assignee: {
            name: string | null;
            id: string;
            handle: string;
            avatarUrl: string | null;
        } | null;
        activities: ({
            actor: {
                name: string | null;
                id: string;
                handle: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            type: string;
            payload: import("@prisma/client/runtime/library").JsonValue | null;
            taskId: string;
            actorId: string;
        })[];
    } & {
        description: string | null;
        title: string;
        priority: import("@prisma/client").$Enums.TaskPriority;
        status: import("@prisma/client").$Enums.TaskStatus;
        assigneeId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        creatorId: string;
    }>;
    updateTask(userId: string, taskId: string, dto: UpdateTaskDto): Promise<{
        assignee: {
            name: string | null;
            id: string;
            handle: string;
            avatarUrl: string | null;
        } | null;
    } & {
        description: string | null;
        title: string;
        priority: import("@prisma/client").$Enums.TaskPriority;
        status: import("@prisma/client").$Enums.TaskStatus;
        assigneeId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        creatorId: string;
    }>;
    deleteTask(userId: string, taskId: string): Promise<{
        description: string | null;
        title: string;
        priority: import("@prisma/client").$Enums.TaskPriority;
        status: import("@prisma/client").$Enums.TaskStatus;
        assigneeId: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        creatorId: string;
    }>;
    private validateUserExists;
    private validateStatusTransition;
    private logActivity;
}
