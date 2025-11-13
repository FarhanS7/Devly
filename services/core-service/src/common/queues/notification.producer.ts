import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import type { Queue } from 'bull';

/**
 * NotificationProducer
 * ---------------------
 * Unified producer responsible for sending all types of notification jobs
 * to the notification-service via Redis + BullMQ.
 * Now fire-and-forget safe — won't hang if Redis is unavailable (e.g., in tests).
 */
@Injectable()
export class NotificationProducer {
  private readonly logger = new Logger(NotificationProducer.name);

  constructor(@InjectQueue('notifications') private readonly queue: Queue) {}

  /**
   * Generic queue method (used internally by all specialized ones)
   */
  private enqueue(
    type: 'FOLLOW' | 'LIKE' | 'COMMENT',
    payload: Record<string, any>,
  ): void {
    // Fire-and-forget + swallow connection errors (tests, local without Redis)
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
      if (err instanceof Error) {
        this.logger.warn(`⚠️ Queue failed (skipped ${type}): ${err.message}`);
      } else {
        this.logger.warn(`⚠️ Queue failed (skipped ${type}): ${String(err)}`);
      }

      // this.logger.warn(`⚠️ Queue failed (skipped ${type}): ${err.message}`);
    }
  }

  /**
   * Called when a user follows another user.
   */
  sendFollowNotification(
    followerId: string,
    targetId: string,
    followerHandle: string,
  ): void {
    this.enqueue('FOLLOW', {
      actorId: followerId,
      recipientId: targetId,
      message: `${followerHandle} started following you`,
    });
  }

  /**
   * Called when a user likes a post.
   */
  sendLikeNotification(
    actorId: string,
    recipientId: string,
    postId: string,
  ): void {
    this.enqueue('LIKE', {
      actorId,
      recipientId,
      postId,
      message: `Your post received a like`,
    });
  }

  /**
   * Called when a user comments on a post.
   */
  // sendCommentNotification(
  //   actorId: string,
  //   recipientId: string,
  //   postId: string,
  // ): void {
  //   this.enqueue('COMMENT', {
  //     actorId,
  //     recipientId,
  //     postId,
  //     message: `Someone commented on your post 💬`,
  //   });
  // }
  async sendCommentNotification(
    actorId: string,
    recipientId: string,
    postId: string,
  ) {
    return this.enqueue('COMMENT', {
      actorId,
      recipientId,
      postId,
      message: `Someone commented on your post 💬`,
    });
  }
}
