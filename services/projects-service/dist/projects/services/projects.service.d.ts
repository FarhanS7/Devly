import { TaskStatus } from '@prisma/client';
import { EventsService } from '../../events/events.service';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { CreateTaskDto } from '../dto/create-task.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { UpdateTaskDto } from '../dto/update-task.dto';
export declare class ProjectsService {
    private readonly prisma;
    private readonly eventsService;
    private readonly logger;
    constructor(prisma: PrismaService, eventsService: EventsService);
    createProject(userId: string, dto: CreateProjectDto): Promise<{
        owner: {
            id: string;
            name: string | null;
            handle: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        name: string;
        description: string | null;
        startDate: Date | null;
        endDate: Date | null;
        status: import("@prisma/client").$Enums.ProjectStatus;
        priority: import("@prisma/client").$Enums.ProjectPriority;
        tags: string[];
        isArchived: boolean;
        ownerId: string;
        createdAt: Date;
        updatedAt: Date;
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
            id: string;
            name: string;
            description: string | null;
            startDate: Date | null;
            endDate: Date | null;
            status: import("@prisma/client").$Enums.ProjectStatus;
            priority: import("@prisma/client").$Enums.ProjectPriority;
            tags: string[];
            isArchived: boolean;
            ownerId: string;
            createdAt: Date;
            updatedAt: Date;
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
                id: string;
                name: string;
            };
            creator: {
                id: string;
                name: string | null;
                handle: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            description: string | null;
            status: import("@prisma/client").$Enums.TaskStatus;
            priority: import("@prisma/client").$Enums.TaskPriority;
            tags: string[];
            createdAt: Date;
            updatedAt: Date;
            projectId: string;
            assigneeId: string | null;
            creatorId: string;
            title: string;
            deadline: Date | null;
            attachments: string[];
            parentTaskId: string | null;
        })[];
        nextCursor: string | null;
    }>;
    getProjectById(userId: string, projectId: string): Promise<{
        owner: {
            id: string;
            name: string | null;
            handle: string;
            avatarUrl: string | null;
        };
        tasks: ({
            assignee: {
                id: string;
                name: string | null;
                handle: string;
                avatarUrl: string | null;
            } | null;
        } & {
            id: string;
            description: string | null;
            status: import("@prisma/client").$Enums.TaskStatus;
            priority: import("@prisma/client").$Enums.TaskPriority;
            tags: string[];
            createdAt: Date;
            updatedAt: Date;
            projectId: string;
            assigneeId: string | null;
            creatorId: string;
            title: string;
            deadline: Date | null;
            attachments: string[];
            parentTaskId: string | null;
        })[];
    } & {
        id: string;
        name: string;
        description: string | null;
        startDate: Date | null;
        endDate: Date | null;
        status: import("@prisma/client").$Enums.ProjectStatus;
        priority: import("@prisma/client").$Enums.ProjectPriority;
        tags: string[];
        isArchived: boolean;
        ownerId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateProject(userId: string, projectId: string, dto: UpdateProjectDto): Promise<{
        id: string;
        name: string;
        description: string | null;
        startDate: Date | null;
        endDate: Date | null;
        status: import("@prisma/client").$Enums.ProjectStatus;
        priority: import("@prisma/client").$Enums.ProjectPriority;
        tags: string[];
        isArchived: boolean;
        ownerId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteProject(userId: string, projectId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        startDate: Date | null;
        endDate: Date | null;
        status: import("@prisma/client").$Enums.ProjectStatus;
        priority: import("@prisma/client").$Enums.ProjectPriority;
        tags: string[];
        isArchived: boolean;
        ownerId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    createTask(userId: string, projectId: string, dto: CreateTaskDto): Promise<{
        assignee: {
            id: string;
            name: string | null;
            handle: string;
            avatarUrl: string | null;
        } | null;
    } & {
        id: string;
        description: string | null;
        status: import("@prisma/client").$Enums.TaskStatus;
        priority: import("@prisma/client").$Enums.TaskPriority;
        tags: string[];
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        assigneeId: string | null;
        creatorId: string;
        title: string;
        deadline: Date | null;
        attachments: string[];
        parentTaskId: string | null;
    }>;
    getTaskById(userId: string, taskId: string): Promise<{
        project: {
            id: string;
            name: string;
            description: string | null;
            startDate: Date | null;
            endDate: Date | null;
            status: import("@prisma/client").$Enums.ProjectStatus;
            priority: import("@prisma/client").$Enums.ProjectPriority;
            tags: string[];
            isArchived: boolean;
            ownerId: string;
            createdAt: Date;
            updatedAt: Date;
        };
        activities: ({
            actor: {
                id: string;
                name: string | null;
                handle: string;
                avatarUrl: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            taskId: string;
            actorId: string;
            type: string;
            payload: import("@prisma/client/runtime/library").JsonValue | null;
        })[];
        creator: {
            id: string;
            name: string | null;
            handle: string;
            avatarUrl: string | null;
        };
        assignee: {
            id: string;
            name: string | null;
            handle: string;
            avatarUrl: string | null;
        } | null;
    } & {
        id: string;
        description: string | null;
        status: import("@prisma/client").$Enums.TaskStatus;
        priority: import("@prisma/client").$Enums.TaskPriority;
        tags: string[];
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        assigneeId: string | null;
        creatorId: string;
        title: string;
        deadline: Date | null;
        attachments: string[];
        parentTaskId: string | null;
    }>;
    updateTask(userId: string, taskId: string, dto: UpdateTaskDto): Promise<{
        assignee: {
            id: string;
            name: string | null;
            handle: string;
            avatarUrl: string | null;
        } | null;
    } & {
        id: string;
        description: string | null;
        status: import("@prisma/client").$Enums.TaskStatus;
        priority: import("@prisma/client").$Enums.TaskPriority;
        tags: string[];
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        assigneeId: string | null;
        creatorId: string;
        title: string;
        deadline: Date | null;
        attachments: string[];
        parentTaskId: string | null;
    }>;
    deleteTask(userId: string, taskId: string): Promise<{
        id: string;
        description: string | null;
        status: import("@prisma/client").$Enums.TaskStatus;
        priority: import("@prisma/client").$Enums.TaskPriority;
        tags: string[];
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        assigneeId: string | null;
        creatorId: string;
        title: string;
        deadline: Date | null;
        attachments: string[];
        parentTaskId: string | null;
    }>;
    private validateUserExists;
    private validateStatusTransition;
    private logActivity;
    archiveProject(userId: string, projectId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        startDate: Date | null;
        endDate: Date | null;
        status: import("@prisma/client").$Enums.ProjectStatus;
        priority: import("@prisma/client").$Enums.ProjectPriority;
        tags: string[];
        isArchived: boolean;
        ownerId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    unarchiveProject(userId: string, projectId: string): Promise<{
        id: string;
        name: string;
        description: string | null;
        startDate: Date | null;
        endDate: Date | null;
        status: import("@prisma/client").$Enums.ProjectStatus;
        priority: import("@prisma/client").$Enums.ProjectPriority;
        tags: string[];
        isArchived: boolean;
        ownerId: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    exportProject(userId: string, projectId: string, format: string): Promise<{
        format: string;
        data: string;
        filename: string;
    } | {
        format: string;
        data: {
            owner: {
                id: string;
                name: string | null;
                handle: string;
            };
            tasks: ({
                creator: {
                    id: string;
                    name: string | null;
                    handle: string;
                };
                assignee: {
                    id: string;
                    name: string | null;
                    handle: string;
                } | null;
            } & {
                id: string;
                description: string | null;
                status: import("@prisma/client").$Enums.TaskStatus;
                priority: import("@prisma/client").$Enums.TaskPriority;
                tags: string[];
                createdAt: Date;
                updatedAt: Date;
                projectId: string;
                assigneeId: string | null;
                creatorId: string;
                title: string;
                deadline: Date | null;
                attachments: string[];
                parentTaskId: string | null;
            })[];
        } & {
            id: string;
            name: string;
            description: string | null;
            startDate: Date | null;
            endDate: Date | null;
            status: import("@prisma/client").$Enums.ProjectStatus;
            priority: import("@prisma/client").$Enums.ProjectPriority;
            tags: string[];
            isArchived: boolean;
            ownerId: string;
            createdAt: Date;
            updatedAt: Date;
        };
        filename: string;
    }>;
    getSubtasks(userId: string, projectId: string, taskId: string): Promise<({
        assignee: {
            id: string;
            name: string | null;
            handle: string;
            avatarUrl: string | null;
        } | null;
    } & {
        id: string;
        description: string | null;
        status: import("@prisma/client").$Enums.TaskStatus;
        priority: import("@prisma/client").$Enums.TaskPriority;
        tags: string[];
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        assigneeId: string | null;
        creatorId: string;
        title: string;
        deadline: Date | null;
        attachments: string[];
        parentTaskId: string | null;
    })[]>;
}
