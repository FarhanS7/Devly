// import { Injectable } from '@nestjs/common';
// import { NotificationType, Prisma } from '@prisma/client';
// import { PrismaService } from '../prisma/prisma.service';

// @Injectable()
// export class NotificationsService {
//   constructor(private readonly prisma: PrismaService) {}

//   async createNotification(data: {
//     type: string;
//     actorId: string;
//     recipientId: string;
//     message: string;
//     postId?: string;
//   }) {
//     const payload: Prisma.NotificationCreateInput = {
//       type: data.type as NotificationType,
//       actor: { connect: { id: data.actorId } },
//       recipient: { connect: { id: data.recipientId } },
//       message: data.message,
//       post: data.postId ? { connect: { id: data.postId } } : undefined,
//     };

//     return this.prisma.notification.create({ data: payload });
//   }

//   async markAsRead(id: string) {
//     return this.prisma.notification.update({
//       where: { id },
//       data: { seen: true },
//     });
//   }

//   async getForUser(userId: string) {
//     return this.prisma.notification.findMany({
//       where: { recipientId: userId },
//       orderBy: { createdAt: 'desc' },
//     });
//   }
// }
import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async createNotification(data: {
    type: NotificationType;
    actorId: string;
    recipientId: string;
    message: string;
    postId?: string;
    messageId?: string;
  }) {
    return this.prisma.notification.create({
      data: {
        type: data.type,
        actorId: data.actorId,
        recipientId: data.recipientId,
        message: data.message,
        postId: data.postId,
        messageId: data.messageId,
      },
    });
  }

  async markAsRead(id: string) {
    return this.prisma.notification.update({
      where: { id },
      data: { seen: true },
    });
  }

  async getUserNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
