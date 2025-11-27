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
exports.ChatGateway = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const ws_jwt_guard_1 = require("../auth/guards/ws-jwt.guard");
const chat_service_1 = require("./chat.service");
let ChatGateway = class ChatGateway {
    constructor(chatService) {
        this.chatService = chatService;
        this.onlineUsers = new Map();
    }
    handleConnection(client) {
        const userId = client.user?.sub;
        if (userId) {
            this.onlineUsers.set(userId, client.id);
            this.server.emit('userOnline', { userId });
            console.log(`User ${userId} connected (${client.id})`);
        }
        else {
            console.log(`Client connected: ${client.id}`);
        }
    }
    handleDisconnect(client) {
        const userId = client.user?.sub;
        if (userId) {
            this.onlineUsers.delete(userId);
            this.server.emit('userOffline', { userId });
            console.log(`User ${userId} disconnected (${client.id})`);
        }
        else {
            console.log(`Client disconnected: ${client.id}`);
        }
    }
    async handleJoinRoom(client, payload) {
        const userId = client.user.sub;
        const canJoin = await this.chatService.isParticipant(userId, payload.conversationId);
        if (canJoin) {
            client.join(payload.conversationId);
            console.log(`User ${userId} joined room ${payload.conversationId}`);
        }
        else {
            console.warn(`User ${userId} tried to join room ${payload.conversationId} but is not a participant`);
        }
    }
    async handleSendMessage(client, payload) {
        const userId = client.user.sub;
        const message = await this.chatService.saveMessage(userId, payload);
        this.server.to(payload.conversationId).emit('newMessage', message);
    }
    async handleMarkRead(client, payload) {
        const userId = client.user.sub;
        await this.chatService.markRead(userId, payload.conversationId, payload.messageId);
        client.to(payload.conversationId).emit('messageRead', {
            userId: userId,
            messageId: payload.messageId,
            conversationId: payload.conversationId,
        });
    }
    handleTyping(client, payload) {
        const userId = client.user.sub;
        client.to(payload.conversationId).emit('userTyping', {
            userId,
            conversationId: payload.conversationId,
        });
    }
    handleStopTyping(client, payload) {
        const userId = client.user.sub;
        client.to(payload.conversationId).emit('userStoppedTyping', {
            userId,
            conversationId: payload.conversationId,
        });
    }
};
exports.ChatGateway = ChatGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], ChatGateway.prototype, "server", void 0);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleConnection", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('joinRoom'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinRoom", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('sendMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendMessage", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('markRead'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleMarkRead", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('typing'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleTyping", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('stopTyping'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleStopTyping", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map