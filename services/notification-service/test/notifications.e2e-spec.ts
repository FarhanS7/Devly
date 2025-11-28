import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { JwtAuthGuard } from '../../core-service/src/auth/guards/jwt.guard';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

// Mock BullModule to avoid Redis connection
jest.mock('@nestjs/bullmq', () => ({
  BullModule: {
    forRoot: jest.fn().mockReturnValue({ module: class {}, providers: [], exports: [] }),
    registerQueue: jest.fn().mockReturnValue({ module: class {}, providers: [], exports: [] }),
  },
}));

describe('NotificationsController (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  const mockUser = { sub: 'user-123', email: 'test@example.com' };
  const mockNotifications = [
    { id: '1', recipientId: 'user-123', message: 'Hello', seen: false, createdAt: new Date().toISOString() },
  ];

  const mockPrismaService = {
    notification: {
      findMany: jest.fn().mockResolvedValue(mockNotifications),
      update: jest.fn().mockResolvedValue({ ...mockNotifications[0], seen: true }),
    },
  };

  const mockJwtGuard = {
    canActivate: (context: any) => {
      const req = context.switchToHttp().getRequest();
      req.user = mockUser;
      return true;
    },
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrismaService)
      .overrideGuard(JwtAuthGuard)
      .useValue(mockJwtGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prismaService = moduleFixture.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/notifications (GET)', () => {
    return request(app.getHttpServer())
      .get('/notifications')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual(mockNotifications);
        expect(prismaService.notification.findMany).toHaveBeenCalledWith({
          where: { recipientId: mockUser.sub },
          orderBy: { createdAt: 'desc' },
        });
      });
  });

  it('/notifications/:id/read (PATCH)', () => {
    return request(app.getHttpServer())
      .patch('/notifications/1/read')
      .expect(200)
      .expect((res) => {
        expect(res.body.seen).toBe(true);
        expect(prismaService.notification.update).toHaveBeenCalledWith({
          where: { id: '1' },
          data: { seen: true },
        });
      });
  });
});
