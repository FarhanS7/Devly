import { RedisModule } from '@nestjs-modules/ioredis';
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { AuthModule } from './auth/auth.module';
import { ChannelsModule } from './channels/channels.module';
import { ChatModule } from './chat/chat.module';
import { NotificationProducerModule } from './common/queues/notification.producer.module';
import { HealthController } from './health/health.controller';
import { PresenceModule } from './presence/presence.module';
import { PrismaModule } from './prisma/prisma.module';
import { ReactionsModule } from './reactions/reactions.module';
import { TeamsModule } from './teams/teams.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    RedisModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const url = configService.get('REDIS_URL');
        return {
          type: 'single',
          url: url ? url : undefined,
          options: url ? undefined : {
            host: configService.get('REDIS_HOST', 'localhost'),
            port: configService.get('REDIS_PORT', 6379),
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: configService.get('REDIS_URL') || {
          host: configService.get('REDIS_HOST', 'localhost'),
          port: configService.get('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    NotificationProducerModule,
    PrismaModule,
    PresenceModule,
    AuthModule,
    ChatModule,
    TeamsModule,
    ChannelsModule,
    ReactionsModule,
    TerminusModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
