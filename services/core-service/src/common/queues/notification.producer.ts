import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import type { Queue } from 'bull';

/**
 * NotificationProducer
 * ---------------------
 * Unified producer responsible for sending all types of notification jobs
 * to the notification-service via Redis + BullMQ.
 */
@Injectable()
export class NotificationProducer {
  constructor(@InjectQueue('notifications') private readonly queue: Queue) {}

  /**
   * Generic queue method (used internally by all specialized ones)
   */
  private async enqueue(
    type: 'FOLLOW' | 'LIKE' | 'COMMENT',
    payload: Record<string, any>,
  ) {
    await this.queue.add(
      'notify',
      { type, ...payload },
      {
        removeOnComplete: true,
        removeOnFail: false,
      },
    );
    console.log(`📨 Queued ${type} notification`, payload);
  }

  /**
   * Called when a user follows another user.
   */
  async sendFollowNotification(
    followerId: string,
    targetId: string,
    followerHandle: string,
  ) {
    await this.enqueue('FOLLOW', {
      actorId: followerId,
      recipientId: targetId,
      message: `${followerHandle} started following you`,
    });
  }

  /**
   * Called when a user likes a post.
   */
  async sendLikeNotification(
    actorId: string,
    recipientId: string,
    postId: string,
  ) {
    await this.enqueue('LIKE', {
      actorId,
      recipientId,
      postId,
      message: `Your post received a like `,
    });
  }

  /**
   * Called when a user comments on a post.
   */
  async sendCommentNotification(
    actorId: string,
    recipientId: string,
    postId: string,
  ) {
    await this.enqueue('COMMENT', {
      actorId,
      recipientId,
      postId,
      message: `Someone commented on your post 💬`,
    });
  }
}
