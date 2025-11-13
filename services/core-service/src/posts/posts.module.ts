import { Module } from '@nestjs/common';
import { CommentsModule } from '../comments/comments.module';
import { NotificationProducerModule } from '../notifications/notification.producer.module';
import { PrismaService } from '../prisma/prisma.service';
import { PostsController } from './posts.controller';
import { PostsService } from './services/posts.service';

@Module({
  imports: [NotificationProducerModule, CommentsModule], // <-- add CommentsModule
  controllers: [PostsController],
  providers: [PostsService, PrismaService],
  exports: [PostsService],
})
export class PostsModule {}
