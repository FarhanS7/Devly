import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';
import { NotesService } from './services/notes.service';
export declare class NotesController {
    private readonly notesService;
    constructor(notesService: NotesService);
    createNote(userId: string, projectId: string, dto: CreateNoteDto): Promise<{
        author: {
            id: string;
            name: string | null;
            handle: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        title: string;
        content: import("@prisma/client/runtime/library").JsonValue;
        createdBy: string;
    }>;
    getNotes(userId: string, projectId: string): Promise<({
        author: {
            id: string;
            name: string | null;
            handle: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        title: string;
        content: import("@prisma/client/runtime/library").JsonValue;
        createdBy: string;
    })[]>;
    getNote(userId: string, projectId: string, noteId: string): Promise<{
        author: {
            id: string;
            name: string | null;
            handle: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        title: string;
        content: import("@prisma/client/runtime/library").JsonValue;
        createdBy: string;
    }>;
    updateNote(userId: string, projectId: string, noteId: string, dto: UpdateNoteDto): Promise<{
        author: {
            id: string;
            name: string | null;
            handle: string;
            avatarUrl: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        projectId: string;
        title: string;
        content: import("@prisma/client/runtime/library").JsonValue;
        createdBy: string;
    }>;
    deleteNote(userId: string, projectId: string, noteId: string): Promise<{
        success: boolean;
    }>;
}
