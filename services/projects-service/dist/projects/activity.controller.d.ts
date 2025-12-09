import { ActivityService } from './services/activity.service';
export declare class ActivityController {
    private readonly activityService;
    constructor(activityService: ActivityService);
    getActivity(userId: string, projectId: string, limit?: string): Promise<({
        actor: {
            id: string;
            name: string | null;
            handle: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        projectId: string;
        userId: string;
        action: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
}
