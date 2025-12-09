export declare enum ProjectStatus {
    NOT_STARTED = "NOT_STARTED",
    IN_PROGRESS = "IN_PROGRESS",
    ON_HOLD = "ON_HOLD",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED"
}
export declare enum ProjectPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH"
}
export declare class CreateProjectDto {
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    status?: ProjectStatus;
    priority?: ProjectPriority;
    tags?: string[];
}
