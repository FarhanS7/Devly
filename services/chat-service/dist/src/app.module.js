"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const ioredis_1 = require("@nestjs-modules/ioredis");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const terminus_1 = require("@nestjs/terminus");
const auth_module_1 = require("./auth/auth.module");
const channels_module_1 = require("./channels/channels.module");
const chat_module_1 = require("./chat/chat.module");
const health_controller_1 = require("./health/health.controller");
const presence_module_1 = require("./presence/presence.module");
const prisma_module_1 = require("./prisma/prisma.module");
const reactions_module_1 = require("./reactions/reactions.module");
const teams_module_1 = require("./teams/teams.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            ioredis_1.RedisModule.forRootAsync({
                useFactory: (configService) => ({
                    type: 'single',
                    options: {
                        host: configService.get('REDIS_HOST', 'localhost'),
                        port: configService.get('REDIS_PORT', 6379),
                    },
                }),
                inject: [config_1.ConfigService],
            }),
            prisma_module_1.PrismaModule,
            presence_module_1.PresenceModule,
            auth_module_1.AuthModule,
            chat_module_1.ChatModule,
            teams_module_1.TeamsModule,
            channels_module_1.ChannelsModule,
            reactions_module_1.ReactionsModule,
            terminus_1.TerminusModule,
        ],
        controllers: [health_controller_1.HealthController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map