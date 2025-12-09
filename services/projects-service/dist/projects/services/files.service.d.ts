import { PrismaService } from '../../prisma/prisma.service';
export declare class FilesService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    uploadFile(userId: string, projectId: string, fileData: {
        fileName: string;
        url: string;
        size: number;
        mimeType: string;
    }): Promise<{
        uploader: {
            id: string;
            name: string | null;
            handle: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        projectId: string;
        fileName: string;
        url: string;
        size: number;
        mimeType: string;
        uploadedBy: string;
    }>;
    getFiles(userId: string, projectId: string): Promise<({
        uploader: {
            id: string;
            name: string | null;
            handle: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        projectId: string;
        fileName: string;
        url: string;
        size: number;
        mimeType: string;
        uploadedBy: string;
    })[]>;
    deleteFile(userId: string, projectId: string, fileId: string): Promise<{
        success: boolean;
    }>;
    private verifyProjectAccess;
    private logActivity;
}
