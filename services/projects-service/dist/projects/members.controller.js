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
exports.MembersController = void 0;
const common_1 = require("@nestjs/common");
const get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
const jwt_guard_1 = require("../auth/guards/jwt.guard");
const member_dto_1 = require("./dto/member.dto");
const members_service_1 = require("./services/members.service");
let MembersController = class MembersController {
    membersService;
    constructor(membersService) {
        this.membersService = membersService;
    }
    addMember(userId, projectId, dto) {
        return this.membersService.addMember(userId, projectId, dto);
    }
    getMembers(userId, projectId) {
        return this.membersService.getMembers(userId, projectId);
    }
    updateMemberRole(userId, projectId, memberId, dto) {
        return this.membersService.updateMemberRole(userId, projectId, memberId, dto);
    }
    removeMember(userId, projectId, memberId) {
        return this.membersService.removeMember(userId, projectId, memberId);
    }
};
exports.MembersController = MembersController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, member_dto_1.AddMemberDto]),
    __metadata("design:returntype", void 0)
], MembersController.prototype, "addMember", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], MembersController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Patch)(':memberId'),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Param)('memberId')),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, member_dto_1.UpdateMemberRoleDto]),
    __metadata("design:returntype", void 0)
], MembersController.prototype, "updateMemberRole", null);
__decorate([
    (0, common_1.Delete)(':memberId'),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, common_1.Param)('projectId')),
    __param(2, (0, common_1.Param)('memberId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], MembersController.prototype, "removeMember", null);
exports.MembersController = MembersController = __decorate([
    (0, common_1.Controller)('projects/:projectId/members'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [members_service_1.MembersService])
], MembersController);
//# sourceMappingURL=members.controller.js.map