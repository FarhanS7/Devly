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
exports.TeamsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../auth/guards/jwt.guard");
const channels_service_1 = require("../channels/channels.service");
const create_channel_dto_1 = require("../channels/dto/create-channel.dto");
const add_member_dto_1 = require("./dto/add-member.dto");
const create_team_dto_1 = require("./dto/create-team.dto");
const update_role_dto_1 = require("./dto/update-role.dto");
const update_team_dto_1 = require("./dto/update-team.dto");
const teams_service_1 = require("./teams.service");
let TeamsController = class TeamsController {
    constructor(teamsService, channelsService) {
        this.teamsService = teamsService;
        this.channelsService = channelsService;
    }
    create(req, createTeamDto) {
        return this.teamsService.create(req.user.sub, createTeamDto);
    }
    findAll(req) {
        return this.teamsService.findUserTeams(req.user.sub);
    }
    findOne(id, req) {
        return this.teamsService.findOne(id, req.user.sub);
    }
    update(id, req, updateTeamDto) {
        return this.teamsService.update(id, req.user.sub, updateTeamDto);
    }
    remove(id, req) {
        return this.teamsService.remove(id, req.user.sub);
    }
    addMember(id, req, addMemberDto) {
        return this.teamsService.addMember(id, req.user.sub, addMemberDto);
    }
    removeMember(id, userId, req) {
        return this.teamsService.removeMember(id, req.user.sub, userId);
    }
    updateMemberRole(id, userId, req, updateRoleDto) {
        return this.teamsService.updateMemberRole(id, req.user.sub, userId, updateRoleDto);
    }
    createChannel(teamId, req, createChannelDto) {
        return this.channelsService.create(teamId, req.user.sub, createChannelDto);
    }
    getTeamChannels(teamId, req) {
        return this.channelsService.findTeamChannels(teamId, req.user.sub);
    }
};
exports.TeamsController = TeamsController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_team_dto_1.CreateTeamDto]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_team_dto_1.UpdateTeamDto]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)(':id/members'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, add_member_dto_1.AddTeamMemberDto]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "addMember", null);
__decorate([
    (0, common_1.Delete)(':id/members/:userId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Patch)(':id/members/:userId/role'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('userId')),
    __param(2, (0, common_1.Request)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, update_role_dto_1.UpdateMemberRoleDto]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "updateMemberRole", null);
__decorate([
    (0, common_1.Post)(':id/channels'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, create_channel_dto_1.CreateChannelDto]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "createChannel", null);
__decorate([
    (0, common_1.Get)(':id/channels'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TeamsController.prototype, "getTeamChannels", null);
exports.TeamsController = TeamsController = __decorate([
    (0, common_1.Controller)('teams'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [teams_service_1.TeamsService,
        channels_service_1.ChannelsService])
], TeamsController);
//# sourceMappingURL=teams.controller.js.map