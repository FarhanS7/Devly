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
exports.ReactionsController = void 0;
const common_1 = require("@nestjs/common");
const get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
const jwt_guard_1 = require("../auth/guards/jwt.guard");
const add_reaction_dto_1 = require("./dto/add-reaction.dto");
const reactions_service_1 = require("./reactions.service");
let ReactionsController = class ReactionsController {
    constructor(reactionsService) {
        this.reactionsService = reactionsService;
    }
    async addReaction(messageId, dto, userId) {
        const canAccess = await this.reactionsService.canAccessMessage(userId, messageId);
        if (!canAccess) {
            throw new common_1.ForbiddenException('You do not have access to this message');
        }
        return this.reactionsService.addReaction(userId, messageId, dto.emoji);
    }
    async removeReaction(messageId, emoji, userId) {
        const canAccess = await this.reactionsService.canAccessMessage(userId, messageId);
        if (!canAccess) {
            throw new common_1.ForbiddenException('You do not have access to this message');
        }
        return this.reactionsService.removeReaction(userId, messageId, emoji);
    }
    async getReactions(messageId, userId) {
        const canAccess = await this.reactionsService.canAccessMessage(userId, messageId);
        if (!canAccess) {
            throw new common_1.ForbiddenException('You do not have access to this message');
        }
        return this.reactionsService.getMessageReactions(messageId);
    }
};
exports.ReactionsController = ReactionsController;
__decorate([
    (0, common_1.Post)(':id/reactions'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, get_user_decorator_1.GetUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, add_reaction_dto_1.AddReactionDto, String]),
    __metadata("design:returntype", Promise)
], ReactionsController.prototype, "addReaction", null);
__decorate([
    (0, common_1.Delete)(':id/reactions/:emoji'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('emoji')),
    __param(2, (0, get_user_decorator_1.GetUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], ReactionsController.prototype, "removeReaction", null);
__decorate([
    (0, common_1.Get)(':id/reactions'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_user_decorator_1.GetUser)('sub')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReactionsController.prototype, "getReactions", null);
exports.ReactionsController = ReactionsController = __decorate([
    (0, common_1.Controller)('messages'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [reactions_service_1.ReactionsService])
], ReactionsController);
//# sourceMappingURL=reactions.controller.js.map