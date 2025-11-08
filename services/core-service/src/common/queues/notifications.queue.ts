// src/common/queues/notifications.queue.ts
import { Queue } from 'bullmq';

export const notificationsQueue = new Queue('notifications', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: 6379,
  },
});
