import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { NotificationProducer } from './notification.producer';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'notifications',
    }),
  ],
  providers: [NotificationProducer],
  exports: [NotificationProducer],
})
export class NotificationProducerModule {}
