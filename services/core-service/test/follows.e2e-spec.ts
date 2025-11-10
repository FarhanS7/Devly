// test/follows.e2e-spec.ts
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { clearDb } from './setup';

// 1) Hard mock the *module path used in your codebase* so Redis never initializes
jest.mock('../src/common/queues/notification.producer', () => {
  class MockNotificationProducer {
    async sendFollowNotification() {
      return;
    }
  }
  // If your code exports the module, returning a dummy class is fine too
  class NotificationProducerModule {}
  return {
    NotificationProducer: MockNotificationProducer,
    NotificationProducerModule,
  };
});

// 2) Import the class token so we can override by class as well (belt & suspenders)
import { NotificationProducer } from '../src/common/queues/notification.producer';

describe('Follows E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let aliceToken: string;
  let bobToken: string;
  let alice: any;
  let bob: any;

  // give slower boxes some breathing room
  jest.setTimeout(20000);

  beforeAll(async () => {
    // Ensure a clean DB for this suite
    await clearDb();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      // 3) Also override the provider by class token to be 100% sure
      .overrideProvider(NotificationProducer)
      .useValue({
        sendFollowNotification: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    await app.init();

    // --- Register users via the API so password hashing & auth flows are realistic ---
    const regAlice = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'alice.follow@example.com',
        handle: 'alice_follow',
        password: 'password123',
      })
      .expect(201);

    const regBob = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'bob.follow@example.com',
        handle: 'bob_follow',
        password: 'password123',
      })
      .expect(201);

    aliceToken = regAlice.body.accessToken;
    bobToken = regBob.body.accessToken;

    // Fetch users (IDs used in follow endpoints)
    alice = await prisma.user.findUnique({
      where: { email: 'alice.follow@example.com' },
    });
    bob = await prisma.user.findUnique({
      where: { email: 'bob.follow@example.com' },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('FOLLOW → Alice follows Bob', async () => {
    const res = await request(app.getHttpServer())
      .post(`/follows/${bob.id}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(201);

    expect(res.body.success).toBe(true);

    const relation = await prisma.follow.findFirst({
      where: { followerId: alice.id, followingId: bob.id },
    });
    expect(relation).toBeTruthy();
  });

  it('FOLLOW → should not allow following twice', async () => {
    await request(app.getHttpServer())
      .post(`/follows/${bob.id}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(400);
  });

  it('GET FOLLOWERS → Bob should have Alice as follower', async () => {
    const res = await request(app.getHttpServer())
      .get(`/follows/followers/${bob.id}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(200);

    expect(res.body[0].follower.handle).toBe('alice_follow');
  });

  it('GET FOLLOWING → Alice should be following Bob', async () => {
    const res = await request(app.getHttpServer())
      .get(`/follows/following/${alice.id}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);

    expect(res.body[0].following.handle).toBe('bob_follow');
  });

  it('GET COUNTS → correct follower/following counts', async () => {
    const resAlice = await request(app.getHttpServer())
      .get(`/follows/counts/${alice.id}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);

    expect(resAlice.body.followers).toBe(0);
    expect(resAlice.body.following).toBe(1);

    const resBob = await request(app.getHttpServer())
      .get(`/follows/counts/${bob.id}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(200);

    expect(resBob.body.followers).toBe(1);
    expect(resBob.body.following).toBe(0);
  });

  it('IS-FOLLOWING → should return true for Alice→Bob', async () => {
    const res = await request(app.getHttpServer())
      .get(`/follows/is-following/${bob.id}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);

    expect(res.body.isFollowing).toBe(true);
  });

  it('IS-MUTUAL → should return false initially', async () => {
    const res = await request(app.getHttpServer())
      .get(`/follows/is-mutual/${bob.id}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);

    expect(res.body.isMutual).toBe(false);
  });

  it('FOLLOW → Bob follows Alice (makes mutual)', async () => {
    await request(app.getHttpServer())
      .post(`/follows/${alice.id}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(201);

    const mutual = await request(app.getHttpServer())
      .get(`/follows/is-mutual/${bob.id}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);

    expect(mutual.body.isMutual).toBe(true);
  });

  it('UNFOLLOW → Alice unfollows Bob', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/follows/${bob.id}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);

    const check = await prisma.follow.findFirst({
      where: { followerId: alice.id, followingId: bob.id },
    });
    expect(check).toBeNull();
  });
});
