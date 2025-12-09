"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EventsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventsService = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const projects_gateway_1 = require("../projects/projects.gateway");
let EventsService = EventsService_1 = class EventsService {
    httpService;
    gateway;
    logger = new common_1.Logger(EventsService_1.name);
    notificationServiceUrl;
    constructor(httpService, gateway) {
        this.httpService = httpService;
        this.gateway = gateway;
        this.notificationServiceUrl =
            process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003';
    }
    emitProjectCreated(payload) {
        this.gateway.emitToProject(payload.projectId, 'project:created', payload);
        this.logger.log(`Emitted project:created for ${payload.projectId}`);
    }
    emitProjectUpdated(payload) {
        this.gateway.emitToProject(payload.projectId, 'project:updated', payload);
        this.logger.log(`Emitted project:updated for ${payload.projectId}`);
    }
    emitProjectDeleted(payload) {
        this.gateway.emitToProject(payload.projectId, 'project:deleted', payload);
        this.logger.log(`Emitted project:deleted for ${payload.projectId}`);
    }
    emitTaskCreated(payload) {
        this.gateway.emitToProject(payload.projectId, 'task:created', payload);
        this.logger.log(`Emitted task:created for task ${payload.taskId}`);
    }
    emitTaskUpdated(payload) {
        this.gateway.emitToProject(payload.projectId, 'task:updated', payload);
        this.logger.log(`Emitted task:updated for task ${payload.taskId}`);
    }
    emitTaskDeleted(payload) {
        this.gateway.emitToProject(payload.projectId, 'task:deleted', payload);
        this.logger.log(`Emitted task:deleted for task ${payload.taskId}`);
    }
    async emitTaskAssigned(payload) {
        this.gateway.emitToProject(payload.projectId, 'task:assigned', payload);
        if (payload.assigneeId) {
            this.gateway.emitToUser(payload.assigneeId, 'task:assigned', payload);
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
    async emitTaskCompleted(payload) {
        this.gateway.emitToProject(payload.projectId, 'task:completed', payload);
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
    async emitMemberAdded(payload) {
        this.gateway.emitToProject(payload.projectId, 'member:added', payload);
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
    emitMemberRemoved(payload) {
        this.gateway.emitToProject(payload.projectId, 'member:removed', payload);
        this.logger.log(`Emitted member:removed for ${payload.memberId} from project ${payload.projectId}`);
    }
    emitMemberRoleUpdated(payload) {
        this.gateway.emitToProject(payload.projectId, 'member:roleUpdated', payload);
        this.logger.log(`Emitted member:roleUpdated for ${payload.memberId}`);
    }
    async sendNotification(data) {
        try {
            const url = `${this.notificationServiceUrl}/notifications`;
            await (0, rxjs_1.firstValueFrom)(this.httpService.post(url, {
                type: data.type,
                recipientId: data.recipientId,
                actorId: data.actorId,
                message: data.message,
                ...data.metadata,
            }));
            this.logger.log(`Notification sent to ${data.recipientId}: ${data.type}`);
        }
        catch (error) {
            this.logger.warn(`Failed to send notification to ${data.recipientId}: ${error.message}`);
        }
    }
};
exports.EventsService = EventsService;
exports.EventsService = EventsService = EventsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        projects_gateway_1.ProjectsGateway])
], EventsService);
//# sourceMappingURL=events.service.js.map