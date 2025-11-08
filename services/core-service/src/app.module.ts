import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from '@shared/prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { PostsModule } from './posts/posts.module';
import { UsersModule } from './users/users.module';

import { LoggerMiddleware } from './common/logger/logger.middleware';
import { AppLogger } from './common/logger/logger.service';
import configuration, { validationSchema } from './config/configuration';
import { FollowsModule } from './follows/follows.module';
import { HealthController } from './health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),

    //  Updated for Throttler v5+ syntax
    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // in milliseconds (1 minute)
        limit: 60, // max requests per window per IP
      },
    ]),

    PrismaModule,
    AuthModule,
    UsersModule,
    PostsModule,
    FollowsModule,
  ],
  controllers: [HealthController],
  providers: [
    AppLogger,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // Global guard
    },
  ],
  exports: [AppLogger],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
