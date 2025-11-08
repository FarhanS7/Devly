import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { NotificationProducer } from '../common/queues/notification.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications', // must match consumer queue name
    }),
  ],
  providers: [NotificationProducer],
  exports: [NotificationProducer], //  make it available elsewhere
})
export class NotificationProducerModule {}
