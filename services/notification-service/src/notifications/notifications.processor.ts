import { Process, Processor } from '@nestjs/bull';
import type { Job } from 'bull';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationsService } from './notifications.service';

@Processor('notifications')
export class NotificationsProcessor {
  constructor(
    private readonly notificationsService: NotificationsService,
    private readonly gateway: NotificationsGateway,
  ) {}

  @Process('notify')
  async handleNotification(job: Job) {
    const data = job.data;
    console.log('📥 Received notification job:', data);

    // 1) Persist to DB
    const saved = await this.notificationsService.createNotification({
      type: data.type,
      actorId: data.actorId,
      recipientId: data.recipientId,
      message: data.message,
      postId: data.postId,
    });

    // 2) Push to user in real-time
    this.gateway.emitToUser(saved.recipientId, 'notification', {
      id: saved.id,
      type: saved.type,
      message: saved.message,
      actorId: saved.actorId,
      postId: saved.postId ?? null,
      createdAt: saved.createdAt,
      seen: saved.seen,
    });

    console.log('Notification saved & pushed');
  }
}
