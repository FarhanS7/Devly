import { PrismaService } from '../../prisma/prisma.service';
export declare class StatsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getProjectStats(userId: string, projectId: string): Promise<{
        totalTasks: number;
        completedTasks: number;
        tasksByStatus: {
            TODO: number;
            IN_PROGRESS: number;
            REVIEW: number;
            DONE: number;
        };
        tasksByPriority: {
            LOW: number;
            MEDIUM: number;
            HIGH: number;
            URGENT: number;
        };
        overdueTasks: number;
        upcomingDeadlines: {
            id: string;
            priority: import("@prisma/client").$Enums.TaskPriority;
            title: string;
            deadline: Date | null;
        }[];
        completionRate: number;
    }>;
    private verifyProjectAccess;
}
