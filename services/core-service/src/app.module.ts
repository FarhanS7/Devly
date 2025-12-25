import { BullModule } from '@nestjs/bull';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

// import { PrismaModule } from '../../../shared/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { FollowsModule } from './follows/follows.module';
import { PostsModule } from './posts/posts.module';
import { UsersModule } from './users/users.module';

import { PrismaModule } from 'prisma/prisma.module';
import { CommentsModule } from './comments/comments.module';
import { LoggerMiddleware } from './common/logger/logger.middleware';
import { AppLogger } from './common/logger/logger.service';
import { NotificationProducer } from './common/queues/notification.producer';
import configuration, { validationSchema } from './config/configuration';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),

    //  Throttler (v5 syntax)
    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // 1 minute
        limit: 60, // 60 requests per minute per IP
      },
    ]),

    //  Redis Queue Setup (BullMQ)
    BullModule.forRoot({
      redis: process.env.REDIS_URL || {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
      },
    }),

    BullModule.registerQueue({
      name: 'notifications', // queue name for notification service
    }),

    //  Core modules
    PrismaModule,
    AuthModule,
    UsersModule,
    PostsModule,
    FollowsModule,
    CommentsModule,
  ],
  controllers: [HealthController],
  providers: [
    AppLogger,
    NotificationProducer,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // global rate limiting
    },
  ],
  exports: [AppLogger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
