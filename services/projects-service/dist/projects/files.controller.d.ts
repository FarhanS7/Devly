import { FilesService } from './services/files.service';
export declare class FilesController {
    private readonly filesService;
    constructor(filesService: FilesService);
    uploadFile(userId: string, projectId: string, dto: {
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
}
