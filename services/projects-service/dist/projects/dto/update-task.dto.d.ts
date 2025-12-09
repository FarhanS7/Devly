import { TaskPriority, TaskStatus } from '@prisma/client';
export declare class UpdateTaskDto {
    title?: string;
    description?: string;
    priority?: TaskPriority;
    status?: TaskStatus;
    assigneeId?: string;
    deadline?: string;
    tags?: string[];
    attachments?: string[];
    parentTaskId?: string;
}
