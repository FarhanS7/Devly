import { StatsService } from './services/stats.service';
export declare class StatsController {
    private readonly statsService;
    constructor(statsService: StatsService);
    getStats(userId: string, projectId: string): Promise<{
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
}
