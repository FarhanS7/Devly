import { CreateProjectDto } from './dto/create-project.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ProjectsService } from './services/projects.service';
export declare class ProjectsController {
    private readonly projectsService;
    constructor(projectsService: ProjectsService);
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
    getMyProjects(userId: string, cursor?: string, limit?: string): Promise<{
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
    getProjectById(userId: string, id: string): Promise<{
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
    updateProject(userId: string, id: string, dto: UpdateProjectDto): Promise<{
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        ownerId: string;
    }>;
    deleteProject(userId: string, id: string): Promise<{
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
    getAssignedTasks(userId: string, cursor?: string, limit?: string, status?: string): Promise<{
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
}
