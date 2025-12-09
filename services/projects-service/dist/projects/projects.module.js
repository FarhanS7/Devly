"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsModule = void 0;
const axios_1 = require("@nestjs/axios");
const common_1 = require("@nestjs/common");
const auth_module_1 = require("../auth/auth.module");
const prisma_service_1 = require("../prisma/prisma.service");
const activity_controller_1 = require("./activity.controller");
const files_controller_1 = require("./files.controller");
const members_controller_1 = require("./members.controller");
const notes_controller_1 = require("./notes.controller");
const projects_controller_1 = require("./projects.controller");
const stats_controller_1 = require("./stats.controller");
const activity_service_1 = require("./services/activity.service");
const files_service_1 = require("./services/files.service");
const members_service_1 = require("./services/members.service");
const notes_service_1 = require("./services/notes.service");
const projects_service_1 = require("./services/projects.service");
const stats_service_1 = require("./services/stats.service");
const events_service_1 = require("../events/events.service");
const projects_gateway_1 = require("./projects.gateway");
let ProjectsModule = class ProjectsModule {
};
exports.ProjectsModule = ProjectsModule;
exports.ProjectsModule = ProjectsModule = __decorate([
    (0, common_1.Module)({
        imports: [axios_1.HttpModule, auth_module_1.AuthModule],
        controllers: [
            projects_controller_1.ProjectsController,
            members_controller_1.MembersController,
            notes_controller_1.NotesController,
            files_controller_1.FilesController,
            activity_controller_1.ActivityController,
            stats_controller_1.StatsController,
        ],
        providers: [
            prisma_service_1.PrismaService,
            projects_service_1.ProjectsService,
            members_service_1.MembersService,
            notes_service_1.NotesService,
            files_service_1.FilesService,
            activity_service_1.ActivityService,
            stats_service_1.StatsService,
            projects_gateway_1.ProjectsGateway,
            events_service_1.EventsService,
        ],
        exports: [projects_service_1.ProjectsService, events_service_1.EventsService],
    })
], ProjectsModule);
//# sourceMappingURL=projects.module.js.map