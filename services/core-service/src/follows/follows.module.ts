import { Module } from '@nestjs/common';
import { NotificationProducerModule } from '../notifications/notification.producer.module';
import { PrismaService } from '../prisma/prisma.service';
import { FollowsController } from './follows.controllers';
import { FollowsService } from './follows.service';

@Module({
  imports: [NotificationProducerModule],
  controllers: [FollowsController],
  providers: [FollowsService, PrismaService],
  exports: [FollowsService],
})
export class FollowsModule {}
