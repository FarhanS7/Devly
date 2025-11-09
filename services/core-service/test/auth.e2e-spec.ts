import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '@shared/prisma/prisma.service';
import 'reflect-metadata';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { clearDb } from './setup';

describe('Auth E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const alice = {
    email: 'alice.test@example.com',
    handle: 'alice_test',
    password: 'password123',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    await clearDb();
  });

  afterAll(async () => {
    await app.close();
  });

  it('REGISTER → returns access & refresh tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(alice)
      .expect(201);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('LOGIN → returns access & refresh tokens', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: alice.email, password: alice.password })
      .expect(200);

    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  it('REFRESH → swaps refresh token for a new pair', async () => {
    // login to get refresh
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: alice.email, password: alice.password })
      .expect(200);

    const { accessToken, refreshToken } = login.body;

    const res = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.refreshToken).toBeTruthy();
    expect(res.body.refreshToken).not.toBe(refreshToken); // rotated
  });

  it('LOGOUT → requires auth & invalidates given refresh token', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: alice.email, password: alice.password })
      .expect(200);

    const { accessToken, refreshToken } = login.body;

    // protected by JwtAuthGuard → send Authorization header
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(200);

    // refresh should now fail
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(401);
  });

  it('LOGOUT-ALL → invalidates all tokens for user', async () => {
    const login1 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: alice.email, password: alice.password })
      .expect(200);

    const login2 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: alice.email, password: alice.password })
      .expect(200);

    const { accessToken: a1, refreshToken: r1 } = login1.body;
    const { accessToken: a2, refreshToken: r2 } = login2.body;

    // logout-all uses JwtAuthGuard, needs access token
    await request(app.getHttpServer())
      .post('/auth/logout-all')
      .set('Authorization', `Bearer ${a1}`)
      .send()
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: r1 })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: r2 })
      .expect(401);
  });
});
