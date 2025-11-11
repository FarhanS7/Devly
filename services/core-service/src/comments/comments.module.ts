import { Module } from '@nestjs/common';
import { NotificationProducerModule } from '../notifications/notification.producer.module';
import { PrismaService } from '../prisma/prisma.service';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';

@Module({
  imports: [NotificationProducerModule],
  controllers: [CommentsController],
  providers: [CommentsService, PrismaService],
  exports: [CommentsService],
})
export class CommentsModule {}
