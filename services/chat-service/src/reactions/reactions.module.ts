import { Module } from '@nestjs/common';
import { NotificationProducerModule } from '../common/queues/notification.producer.module';
import { PrismaModule } from '../prisma/prisma.module';
import { ReactionsController } from './reactions.controller';
import { ReactionsService } from './reactions.service';

@Module({
  imports: [PrismaModule, NotificationProducerModule],
  controllers: [ReactionsController],
  providers: [ReactionsService],
  exports: [ReactionsService],
})
export class ReactionsModule {}
