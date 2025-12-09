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
const channels_service_1 = require("../channels/channels.service");
const presence_service_1 = require("../presence/presence.service");
const reactions_service_1 = require("../reactions/reactions.service");
const chat_service_1 = require("./chat.service");
let ChatGateway = class ChatGateway {
    constructor(chatService, channelsService, presenceService, reactionsService) {
        this.chatService = chatService;
        this.channelsService = channelsService;
        this.presenceService = presenceService;
        this.reactionsService = reactionsService;
    }
    async handleConnection(client) {
        const userId = client.user?.sub;
        if (userId) {
            await this.presenceService.setUserOnline(userId, client.id);
            this.server.emit('userOnline', { userId });
            console.log(`User ${userId} connected (${client.id})`);
        }
        else {
            console.log(`Client connected: ${client.id}`);
        }
    }
    async handleDisconnect(client) {
        const userId = client.user?.sub;
        if (userId) {
            await this.presenceService.setUserOffline(userId);
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
    async handleJoinChannel(client, payload) {
        const userId = client.user.sub;
        const isMember = await this.channelsService.isMember(payload.channelId, userId);
        if (isMember) {
            client.join(payload.channelId);
            console.log(`User ${userId} joined channel ${payload.channelId}`);
            client.to(payload.channelId).emit('channelMemberJoined', {
                userId,
                channelId: payload.channelId,
            });
        }
        else {
            console.warn(`User ${userId} tried to join channel ${payload.channelId} but is not a member`);
            client.emit('error', { message: 'You are not a member of this channel' });
        }
    }
    handleLeaveChannel(client, payload) {
        const userId = client.user.sub;
        client.leave(payload.channelId);
        console.log(`User ${userId} left channel ${payload.channelId}`);
        client.to(payload.channelId).emit('channelMemberLeft', {
            userId,
            channelId: payload.channelId,
        });
    }
    async handleSendChannelMessage(client, payload) {
        const userId = client.user.sub;
        try {
            const isMember = await this.channelsService.isMember(payload.channelId, userId);
            if (!isMember) {
                client.emit('error', { message: 'You are not a member of this channel' });
                return;
            }
            const message = await this.chatService.saveChannelMessage(userId, payload);
            this.server.to(payload.channelId).emit('channelMessageCreated', message);
        }
        catch (error) {
            console.error('Error sending channel message:', error);
            client.emit('error', { message: 'Failed to send message' });
        }
    }
    async handleTypingChannel(client, payload) {
        const userId = client.user.sub;
        await this.presenceService.startTyping(userId, payload.channelId);
        client.to(payload.channelId).emit('userTypingChannel', {
            userId,
            channelId: payload.channelId,
        });
    }
    async handleStopTypingChannel(client, payload) {
        const userId = client.user.sub;
        await this.presenceService.stopTyping(userId, payload.channelId);
        client.to(payload.channelId).emit('userStoppedTypingChannel', {
            userId,
            channelId: payload.channelId,
        });
    }
    async handleAddReaction(client, payload) {
        const userId = client.user.sub;
        try {
            const canAccess = await this.reactionsService.canAccessMessage(userId, payload.messageId);
            if (!canAccess) {
                client.emit('error', { message: 'You do not have access to this message' });
                return;
            }
            const reaction = await this.reactionsService.addReaction(userId, payload.messageId, payload.emoji);
            this.server.to(reaction.channelId).emit('reactionAdded', {
                messageId: payload.messageId,
                userId,
                emoji: payload.emoji,
                user: reaction.user,
            });
        }
        catch (error) {
            console.error('Error adding reaction:', error);
            client.emit('error', { message: error.message || 'Failed to add reaction' });
        }
    }
    async handleRemoveReaction(client, payload) {
        const userId = client.user.sub;
        try {
            const canAccess = await this.reactionsService.canAccessMessage(userId, payload.messageId);
            if (!canAccess) {
                client.emit('error', { message: 'You do not have access to this message' });
                return;
            }
            const result = await this.reactionsService.removeReaction(userId, payload.messageId, payload.emoji);
            this.server.to(result.channelId).emit('reactionRemoved', {
                messageId: payload.messageId,
                userId,
                emoji: payload.emoji,
            });
        }
        catch (error) {
            console.error('Error removing reaction:', error);
            client.emit('error', { message: error.message || 'Failed to remove reaction' });
        }
    }
    async handleToggleReaction(client, payload) {
        const userId = client.user.sub;
        try {
            const canAccess = await this.reactionsService.canAccessMessage(userId, payload.messageId);
            if (!canAccess) {
                client.emit('error', { message: 'You do not have access to this message' });
                return;
            }
            const result = await this.reactionsService.toggleReaction(userId, payload.messageId, payload.emoji);
            const eventName = 'user' in result ? 'reactionAdded' : 'reactionRemoved';
            this.server.to(result.channelId).emit(eventName, {
                messageId: payload.messageId,
                userId,
                emoji: payload.emoji,
                user: 'user' in result ? result.user : undefined,
            });
        }
        catch (error) {
            console.error('Error toggling reaction:', error);
            client.emit('error', { message: error.message || 'Failed to toggle reaction' });
        }
    }
    async handleJoinThread(client, payload) {
        const userId = client.user.sub;
        try {
            const message = await this.chatService.prisma.channelMessage.findUnique({
                where: { id: payload.messageId },
                select: { channelId: true },
            });
            if (!message) {
                client.emit('error', { message: 'Message not found' });
                return;
            }
            const isMember = await this.channelsService.isMember(message.channelId, userId);
            if (!isMember) {
                client.emit('error', { message: 'You do not have access to this thread' });
                return;
            }
            const threadRoom = `thread:${payload.messageId}`;
            client.join(threadRoom);
            console.log(`User ${userId} joined thread ${payload.messageId}`);
            client.emit('threadJoined', { messageId: payload.messageId });
        }
        catch (error) {
            console.error('Error joining thread:', error);
            client.emit('error', { message: 'Failed to join thread' });
        }
    }
    handleLeaveThread(client, payload) {
        const userId = client.user.sub;
        const threadRoom = `thread:${payload.messageId}`;
        client.leave(threadRoom);
        console.log(`User ${userId} left thread ${payload.messageId}`);
        client.emit('threadLeft', { messageId: payload.messageId });
    }
    async handleSendThreadReply(client, payload) {
        const userId = client.user.sub;
        try {
            const parentMessage = await this.chatService.prisma.channelMessage.findUnique({
                where: { id: payload.messageId },
                select: { channelId: true },
            });
            if (!parentMessage) {
                client.emit('error', { message: 'Parent message not found' });
                return;
            }
            const isMember = await this.channelsService.isMember(parentMessage.channelId, userId);
            if (!isMember) {
                client.emit('error', { message: 'You do not have access to this channel' });
                return;
            }
            const reply = await this.chatService.saveChannelMessage(userId, {
                channelId: parentMessage.channelId,
                content: payload.content,
                attachmentUrl: payload.attachmentUrl,
                parentId: payload.messageId,
            });
            this.server.to(parentMessage.channelId).emit('channelMessageCreated', reply);
            const threadRoom = `thread:${payload.messageId}`;
            this.server.to(threadRoom).emit('threadReplyAdded', {
                parentMessageId: payload.messageId,
                reply,
            });
        }
        catch (error) {
            console.error('Error sending thread reply:', error);
            client.emit('error', { message: 'Failed to send reply' });
        }
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
    __metadata("design:returntype", Promise)
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
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('joinChannel'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinChannel", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('leaveChannel'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleLeaveChannel", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('sendChannelMessage'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendChannelMessage", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('typingChannel'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleTypingChannel", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('stopTypingChannel'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleStopTypingChannel", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('addReaction'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleAddReaction", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('removeReaction'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleRemoveReaction", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('toggleReaction'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleToggleReaction", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('joinThread'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleJoinThread", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('leaveThread'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatGateway.prototype, "handleLeaveThread", null);
__decorate([
    (0, common_1.UseGuards)(ws_jwt_guard_1.WsJwtGuard),
    (0, websockets_1.SubscribeMessage)('sendThreadReply'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ChatGateway.prototype, "handleSendThreadReply", null);
exports.ChatGateway = ChatGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        channels_service_1.ChannelsService,
        presence_service_1.PresenceService,
        reactions_service_1.ReactionsService])
], ChatGateway);
//# sourceMappingURL=chat.gateway.js.map