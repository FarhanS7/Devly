import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bull';

@Injectable()
export class NotificationProducer {
  private readonly logger = new Logger(NotificationProducer.name);

  constructor(@InjectQueue('notifications') private readonly queue: Queue) {}

  private enqueue(
    type: 'FOLLOW' | 'LIKE' | 'COMMENT' | 'MESSAGE_REACTION',
    payload: Record<string, any>,
  ): void {
    try {
      this.queue
        .add(
          'notify',
          { type, ...payload },
          { removeOnComplete: true, removeOnFail: true },
        )
        .then(() => {
          this.logger.debug(`📨 Queued ${type} notification`, payload);
        })
        .catch((err) => {
          this.logger.warn(
            `⚠️ Queue unavailable (skipped ${type}): ${err.message}`,
          );
        });
    } catch (err) {
      this.logger.warn(`⚠️ Queue failed (skipped ${type}): ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  sendReactionNotification(
    actorId: string,
    recipientId: string,
    messageId: string,
    emoji: string,
    actorName: string,
  ): void {
    if (actorId === recipientId) return; // Don't notify self

    this.enqueue('MESSAGE_REACTION', {
      actorId,
      recipientId,
      messageId,
      message: `${actorName} reacted to your message with ${emoji}`,
    });
  }
}
