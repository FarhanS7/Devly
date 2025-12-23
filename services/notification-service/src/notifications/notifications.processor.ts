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
    console.log('💾 Saving notification to DB...');
    const saved = await this.notificationsService.createNotification({
      type: data.type,
      actorId: data.actorId,
      recipientId: data.recipientId,
      message: data.message,
      postId: data.postId,
      messageId: data.messageId,
    });
    console.log('✅ Notification saved:', saved.id);

    // 2) Push to user in real-time
    console.log(`📣 Emitting to user:${saved.recipientId}`);
    this.gateway.emitToUser(saved.recipientId, 'notification', {
      id: saved.id,
      type: saved.type,
      message: saved.message,
      actorId: saved.actorId,
      postId: saved.postId ?? null,
      messageId: saved.messageId ?? null,
      createdAt: saved.createdAt,
      seen: saved.seen,
    });

    console.log('Notification saved & pushed');
  }
}
