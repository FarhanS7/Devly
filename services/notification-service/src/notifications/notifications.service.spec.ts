import { Test, TestingModule } from '@nestjs/testing';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from './notifications.service';

const mockPrismaService = {
  notification: {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createNotification', () => {
    it('should create a notification', async () => {
      const data = {
        type: NotificationType.LIKE,
        actorId: 'actor-123',
        recipientId: 'recipient-123',
        message: 'Liked your post',
        postId: 'post-123',
      };

      const expectedResult = { id: 'notif-1', ...data, seen: false, createdAt: new Date() };
      (prisma.notification.create as jest.Mock).mockResolvedValue(expectedResult);

      const result = await service.createNotification(data);

      expect(prisma.notification.create).toHaveBeenCalledWith({
        data: {
          type: data.type,
          actorId: data.actorId,
          recipientId: data.recipientId,
          message: data.message,
          postId: data.postId,
        },
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('getUserNotifications', () => {
    it('should return notifications for a user', async () => {
      const userId = 'user-123';
      const notifications = [{ id: '1', recipientId: userId }];
      (prisma.notification.findMany as jest.Mock).mockResolvedValue(notifications);

      const result = await service.getUserNotifications(userId);

      expect(prisma.notification.findMany).toHaveBeenCalledWith({
        where: { recipientId: userId },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(notifications);
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', async () => {
      const id = 'notif-1';
      const updated = { id, seen: true };
      (prisma.notification.update as jest.Mock).mockResolvedValue(updated);

      const result = await service.markAsRead(id);

      expect(prisma.notification.update).toHaveBeenCalledWith({
        where: { id },
        data: { seen: true },
      });
      expect(result).toEqual(updated);
    });
  });
});
