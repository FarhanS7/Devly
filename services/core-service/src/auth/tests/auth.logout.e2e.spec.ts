import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../app.module';

describe('Auth Logout (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;
  let refreshToken: string;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = mod.createNestApplication();
    await app.init();

    // register
    const reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'lo@out.com', handle: 'logoutter', password: 'pass1234' })
      .expect(201);

    accessToken = reg.body.accessToken;
    refreshToken = reg.body.refreshToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/logout should revoke one token', async () => {
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ refreshToken })
      .expect(201)
      .expect(({ body }) => expect(body.success).toBe(true));
  });

  it('POST /auth/logout-all should revoke all tokens for current user', async () => {
    await request(app.getHttpServer())
      .post('/auth/logout-all')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201)
      .expect(({ body }) => expect(body.success).toBe(true));
  });
});
