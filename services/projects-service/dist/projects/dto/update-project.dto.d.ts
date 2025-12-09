import { ProjectPriority, ProjectStatus } from './create-project.dto';
export declare class UpdateProjectDto {
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    status?: ProjectStatus;
    priority?: ProjectPriority;
    tags?: string[];
    isArchived?: boolean;
}
