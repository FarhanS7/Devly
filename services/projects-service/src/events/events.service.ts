import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { ProjectsGateway } from '../projects/projects.gateway';

export type ProjectEventPayload = Record<string, any>;
export type TaskEventPayload = Record<string, any>;
export type MemberEventPayload = Record<string, any>;

// Notification types that match notification-service schema
export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'PROJECT_INVITE'
  | 'PROJECT_UPDATE'
  | 'SYSTEM';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private readonly notificationServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private gateway: ProjectsGateway,
  ) {
    this.notificationServiceUrl =
      process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003';
  }

  // ===============================================
  // PROJECT EVENTS
  // ===============================================

  emitProjectCreated(payload: ProjectEventPayload) {
    this.gateway.emitToProject(payload.projectId, 'project:created', payload);
    this.logger.log(`Emitted project:created for ${payload.projectId}`);
  }

  emitProjectUpdated(payload: ProjectEventPayload) {
    this.gateway.emitToProject(payload.projectId, 'project:updated', payload);
    this.logger.log(`Emitted project:updated for ${payload.projectId}`);
  }

  emitProjectDeleted(payload: ProjectEventPayload) {
    this.gateway.emitToProject(payload.projectId, 'project:deleted', payload);
    this.logger.log(`Emitted project:deleted for ${payload.projectId}`);
  }

  // ===============================================
  // TASK EVENTS
  // ===============================================

  emitTaskCreated(payload: TaskEventPayload) {
    this.gateway.emitToProject(payload.projectId, 'task:created', payload);
    this.logger.log(`Emitted task:created for task ${payload.taskId}`);
  }

  emitTaskUpdated(payload: TaskEventPayload) {
    this.gateway.emitToProject(payload.projectId, 'task:updated', payload);
    this.logger.log(`Emitted task:updated for task ${payload.taskId}`);
  }

  emitTaskDeleted(payload: TaskEventPayload) {
    this.gateway.emitToProject(payload.projectId, 'task:deleted', payload);
    this.logger.log(`Emitted task:deleted for task ${payload.taskId}`);
  }

  async emitTaskAssigned(payload: TaskEventPayload) {
    // Emit WebSocket event to project room
    this.gateway.emitToProject(payload.projectId, 'task:assigned', payload);

    // Also emit to the specific assignee's personal room
    if (payload.assigneeId) {
      this.gateway.emitToUser(payload.assigneeId, 'task:assigned', payload);

      // Send notification to notification-service
      await this.sendNotification({
        type: 'TASK_ASSIGNED',
        recipientId: payload.assigneeId,
        actorId: payload.actorId,
        message: `You have been assigned to task: ${payload.taskTitle || payload.taskId}`,
        metadata: {
          projectId: payload.projectId,
          taskId: payload.taskId,
        },
      });
    }

    this.logger.log(`Emitted task:assigned for task ${payload.taskId} to ${payload.assigneeId}`);
  }

  async emitTaskCompleted(payload: TaskEventPayload) {
    this.gateway.emitToProject(payload.projectId, 'task:completed', payload);

    // Notify the task creator if different from actor
    if (payload.creatorId && payload.creatorId !== payload.actorId) {
      await this.sendNotification({
        type: 'TASK_COMPLETED',
        recipientId: payload.creatorId,
        actorId: payload.actorId,
        message: `Task completed: ${payload.taskTitle || payload.taskId}`,
        metadata: {
          projectId: payload.projectId,
          taskId: payload.taskId,
        },
      });
    }

    this.logger.log(`Emitted task:completed for task ${payload.taskId}`);
  }

  // ===============================================
  // MEMBER EVENTS
  // ===============================================

  async emitMemberAdded(payload: MemberEventPayload) {
    this.gateway.emitToProject(payload.projectId, 'member:added', payload);

    // Send invitation notification to the new member
    await this.sendNotification({
      type: 'PROJECT_INVITE',
      recipientId: payload.memberId,
      actorId: payload.actorId,
      message: `You have been added to project: ${payload.projectName || payload.projectId}`,
      metadata: {
        projectId: payload.projectId,
        role: payload.role,
      },
    });

    this.logger.log(`Emitted member:added for ${payload.memberId} to project ${payload.projectId}`);
  }

  emitMemberRemoved(payload: MemberEventPayload) {
    this.gateway.emitToProject(payload.projectId, 'member:removed', payload);
    this.logger.log(`Emitted member:removed for ${payload.memberId} from project ${payload.projectId}`);
  }

  emitMemberRoleUpdated(payload: MemberEventPayload) {
    this.gateway.emitToProject(payload.projectId, 'member:roleUpdated', payload);
    this.logger.log(`Emitted member:roleUpdated for ${payload.memberId}`);
  }

  // ===============================================
  // NOTIFICATION SERVICE INTEGRATION
  // ===============================================

  private async sendNotification(data: {
    type: NotificationType;
    recipientId: string;
    actorId: string;
    message: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const url = `${this.notificationServiceUrl}/notifications`;
      await firstValueFrom(
        this.httpService.post(url, {
          type: data.type,
          recipientId: data.recipientId,
          actorId: data.actorId,
          message: data.message,
          ...data.metadata,
        }),
      );
      this.logger.log(`Notification sent to ${data.recipientId}: ${data.type}`);
    } catch (error) {
      // Log but don't throw - notifications shouldn't block main operations
      this.logger.warn(
        `Failed to send notification to ${data.recipientId}: ${error.message}`,
      );
    }
  }
}
