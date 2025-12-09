import { HttpService } from '@nestjs/axios';
import { ProjectsGateway } from '../projects/projects.gateway';
export type ProjectEventPayload = Record<string, any>;
export type TaskEventPayload = Record<string, any>;
export type MemberEventPayload = Record<string, any>;
export type NotificationType = 'TASK_ASSIGNED' | 'TASK_COMPLETED' | 'PROJECT_INVITE' | 'PROJECT_UPDATE' | 'SYSTEM';
export declare class EventsService {
    private readonly httpService;
    private gateway;
    private readonly logger;
    private readonly notificationServiceUrl;
    constructor(httpService: HttpService, gateway: ProjectsGateway);
    emitProjectCreated(payload: ProjectEventPayload): void;
    emitProjectUpdated(payload: ProjectEventPayload): void;
    emitProjectDeleted(payload: ProjectEventPayload): void;
    emitTaskCreated(payload: TaskEventPayload): void;
    emitTaskUpdated(payload: TaskEventPayload): void;
    emitTaskDeleted(payload: TaskEventPayload): void;
    emitTaskAssigned(payload: TaskEventPayload): Promise<void>;
    emitTaskCompleted(payload: TaskEventPayload): Promise<void>;
    emitMemberAdded(payload: MemberEventPayload): Promise<void>;
    emitMemberRemoved(payload: MemberEventPayload): void;
    emitMemberRoleUpdated(payload: MemberEventPayload): void;
    private sendNotification;
}
