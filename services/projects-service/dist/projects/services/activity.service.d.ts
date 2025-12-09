import { PrismaService } from '../../prisma/prisma.service';
export declare class ActivityService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getProjectActivity(userId: string, projectId: string, limit?: number): Promise<({
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
    logActivity(projectId: string, userId: string, action: string, metadata: any): Promise<void>;
    private verifyProjectAccess;
}
