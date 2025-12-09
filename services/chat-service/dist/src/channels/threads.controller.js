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
exports.ThreadsController = void 0;
const common_1 = require("@nestjs/common");
const get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
const jwt_guard_1 = require("../auth/guards/jwt.guard");
const chat_service_1 = require("../chat/chat.service");
const channels_service_1 = require("./channels.service");
let ThreadsController = class ThreadsController {
    constructor(chatService, channelsService) {
        this.chatService = chatService;
        this.channelsService = channelsService;
    }
    async getThreadReplies(messageId, skip, take, userId) {
        const message = await this.chatService.prisma.channelMessage.findUnique({
            where: { id: messageId },
            select: { channelId: true },
        });
        if (!message) {
            throw new common_1.ForbiddenException('Message not found');
        }
        const isMember = await this.channelsService.isMember(message.channelId, userId);
        if (!isMember) {
            throw new common_1.ForbiddenException('You do not have access to this message');
        }
        return this.chatService.getThreadReplies(messageId, { skip, take });
    }
    async getFullThread(messageId, userId) {
        const message = await this.chatService.prisma.channelMessage.findUnique({
            where: { id: messageId },
            select: { channelId: true },
        });
        if (!message) {
            throw new common_1.ForbiddenException('Message not found');
        }
        const isMember = await this.channelsService.isMember(message.channelId, userId);
        if (!isMember) {
            throw new common_1.ForbiddenException('You do not have access to this message');
        }
        return this.chatService.getFullThread(messageId);
    }
    async getThreadParticipants(messageId, userId) {
        const message = await this.chatService.prisma.channelMessage.findUnique({
            where: { id: messageId },
            select: { channelId: true },
        });
        if (!message) {
            throw new common_1.ForbiddenException('Message not found');
        }
        const isMember = await this.channelsService.isMember(message.channelId, userId);
        if (!isMember) {
            throw new common_1.ForbiddenException('You do not have access to this message');
        }
        return this.chatService.getThreadParticipants(messageId);
    }
    async getThreadSummary(messageId, userId) {
        const message = await this.chatService.prisma.channelMessage.findUnique({
            where: { id: messageId },
            select: { channelId: true },
        });
        if (!message) {
            throw new common_1.ForbiddenException('Message not found');
        }
        const isMember = await this.channelsService.isMember(message.channelId, userId);
        if (!isMember) {
            throw new common_1.ForbiddenException('You do not have access to this message');
        }
        return this.chatService.getThreadSummary(messageId);
    }
};
exports.ThreadsController = ThreadsController;
__decorate([
    (0, common_1.Get)(':id/replies'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('skip', new common_1.DefaultValuePipe(0), common_1.ParseIntPipe)),
    __param(2, (0, common_1.Query)('take', new common_1.DefaultValuePipe(50), common_1.ParseIntPipe)),
    __param(3, (0, get_user_decorator_1.GetUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number, Number, String]),
    __metadata("design:returntype", Promise)
], ThreadsController.prototype, "getThreadReplies", null);
__decorate([
    (0, common_1.Get)(':id/thread'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_user_decorator_1.GetUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ThreadsController.prototype, "getFullThread", null);
__decorate([
    (0, common_1.Get)(':id/participants'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_user_decorator_1.GetUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ThreadsController.prototype, "getThreadParticipants", null);
__decorate([
    (0, common_1.Get)(':id/summary'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_user_decorator_1.GetUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ThreadsController.prototype, "getThreadSummary", null);
exports.ThreadsController = ThreadsController = __decorate([
    (0, common_1.Controller)('messages'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        channels_service_1.ChannelsService])
], ThreadsController);
//# sourceMappingURL=threads.controller.js.map