import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { CryptoService } from '../../auth/services/crypto.service';
import { TokenService } from '../../auth/services/token.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('Users E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let tokenService: TokenService;
  let cryptoService: CryptoService;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get(PrismaService);
    tokenService = app.get(TokenService);
    cryptoService = app.get(CryptoService);

    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();

    // create test user manually
    const passwordHash = await cryptoService.hashPassword('password123');
    const user = await prisma.user.create({
      data: {
        email: 'e2e@example.com',
        handle: 'testuser',
        passwordHash,
      },
    });

    accessToken = tokenService.generateAccessToken({
      sub: user.id,
      email: user.email,
    });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  it('GET /users/profile → should return user profile', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/profile')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.email).toBe('e2e@example.com');
    expect(res.body.handle).toBe('testuser');
  });

  it('PATCH /users/update → should update bio', async () => {
    const res = await request(app.getHttpServer())
      .patch('/users/update')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ bio: 'Updated bio', location: 'Dhaka' })
      .expect(200);

    expect(res.body.bio).toBe('Updated bio');
  });

  it('GET /users/:handle → should get public profile', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/testuser')
      .expect(200);

    expect(res.body.handle).toBe('testuser');
  });

  it('GET /users/profile → should fail without JWT', async () => {
    await request(app.getHttpServer()).get('/users/profile').expect(401);
  });
});
