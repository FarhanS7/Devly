import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import supertest from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

describe('Posts E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let postId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get(PrismaService);
    await prisma.comment.deleteMany();
    await prisma.like.deleteMany();
    await prisma.post.deleteMany();
    await prisma.user.deleteMany();

    // Register and login a user
    const regRes = await supertest(app.getHttpServer())
      .post('/auth/register')
      .send({ email: 'post@e2e.com', handle: 'poster', password: '123456' })
      .expect(201);

    token = regRes.body.accessToken;
  });

  afterAll(async () => {
    await prisma.$disconnect();
    await app.close();
  });

  it('POST /posts/create → should create a post', async () => {
    const res = await supertest(app.getHttpServer())
      .post('/posts/create')
      .set('Authorization', `Bearer ${token}`)
      .send({ content: 'My first post' })
      .expect(201);
    expect(res.body.content).toBe('My first post');
    postId = res.body.id;
  });

  it('GET /posts/feed → should return feed', async () => {
    const res = await supertest(app.getHttpServer())
      .get('/posts/feed')
      .expect(200);
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it('POST /posts/:id/like → should toggle like', async () => {
    const res = await supertest(app.getHttpServer())
      .post(`/posts/${postId}/like`)
      .set('Authorization', `Bearer ${token}`)
      .expect(201);
    expect(res.body).toHaveProperty('liked');
  });

  it('POST /posts/:id/comment → should add comment', async () => {
    const res = await supertest(app.getHttpServer())
      .post(`/posts/${postId}/comment`)
      .set('Authorization', `Bearer ${token}`)
      .send({ text: 'Great post!' })
      .expect(201);
    expect(res.body.text).toBe('Great post!');
  });
});
