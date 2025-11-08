import { Processor, WorkerHost } from '@nestjs/bullmq';
import { NotificationType } from '@prisma/client';
import { Job } from 'bullmq';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Processor('notifications')
export class NotificationsProcessor extends WorkerHost {
  constructor(
    private readonly notifications: NotificationsService,
    private readonly gateway: NotificationsGateway,
  ) {
    super();
  }

  async process(job: Job) {
    const { type, actorId, recipientId, message, postId } = job.data;

    // Save in DB
    const saved = await this.notifications.createNotification({
      type: type as NotificationType,
      actorId,
      recipientId,
      message,
      postId,
    });

    // Push via WebSocket
    await this.gateway.pushToUser(recipientId, saved);
    console.log(`📨 Sent ${type} notification to user ${recipientId}`);
  }
}
