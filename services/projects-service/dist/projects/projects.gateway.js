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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsGateway = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const ws_jwt_guard_1 = require("../auth/guards/ws-jwt.guard");
let ProjectsGateway = class ProjectsGateway {
    server;
    socketUser = new Map();
    handleConnection(client) {
        console.log(`[Projects WS] Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        const userId = this.socketUser.get(client.id);
        if (userId) {
            this.socketUser.delete(client.id);
        }
        console.log(`[Projects WS] Client disconnected: ${client.id}`);
    }
    handleJoinProject(client, payload) {
        const userId = client.user?.sub;
        if (!userId)
            return;
        const room = `project:${payload.projectId}`;
        client.join(room);
        this.socketUser.set(client.id, userId);
        console.log(`[Projects WS] User ${userId} joined project room ${payload.projectId}`);
        client.emit('joinedProject', { projectId: payload.projectId });
    }
    handleLeaveProject(client, payload) {
        const userId = client.user?.sub;
        const room = `project:${payload.projectId}`;
        client.leave(room);
        console.log(`[Projects WS] User ${userId} left project room ${payload.projectId}`);
        client.emit('leftProject', { projectId: payload.projectId });
    }
    emitToProject(projectId, event, payload) {
        const room = `project:${projectId}`;
        this.server.to(room).emit(event, payload);
    }
    emitToUser(userId, event, payload) {
        const room = `user:${userId}`;
        this.server.to(room).emit(event, payload);
    }
    handleSubscribeNotifications(client) {
        const userId = client.user?.sub;
        if (!userId)
            return;
        const room = `user:${userId}`;
        client.join(room);
        console.log(`[Projects WS] User ${userId} subscribed to notifications`);
        client.emit('subscribedNotifications', { userId });
    }
};
exports.ProjectsGateway = ProjectsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ProjectsGateway.prototype, "server", void 0);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('joinProject'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProjectsGateway.prototype, "handleJoinProject", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('leaveProject'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProjectsGateway.prototype, "handleLeaveProject", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('subscribeNotifications'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProjectsGateway.prototype, "handleSubscribeNotifications", null);
exports.ProjectsGateway = ProjectsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
        namespace: '/ws/projects',
    })
], ProjectsGateway);
//# sourceMappingURL=projects.gateway.js.map