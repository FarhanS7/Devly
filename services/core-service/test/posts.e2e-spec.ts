import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Posts E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let aliceToken: string;
  let bobToken: string;
  let post: any;

  jest.setTimeout(30000);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    await app.init();

    // Clean DB
    await prisma.comment.deleteMany({});
    await prisma.like.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.user.deleteMany({});

    // Create users
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'alice.posts@example.com',
        handle: 'alice_posts',
        password: 'password123',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'bob.posts@example.com',
        handle: 'bob_posts',
        password: 'password123',
      })
      .expect(201);

    const loginAlice = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'alice.posts@example.com', password: 'password123' })
      .expect(200);

    const loginBob = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'bob.posts@example.com', password: 'password123' })
      .expect(200);

    aliceToken = loginAlice.body.accessToken;
    bobToken = loginBob.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
  });

  it('CREATE → Alice creates a post', async () => {
    const res = await request(app.getHttpServer())
      .post('/posts/create')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ content: 'First test post from Alice' })
      .expect(201);

    post = res.body;
    expect(post.content).toBe('First test post from Alice');
  });

  it('LIKE → Bob likes Alice’s post', async () => {
    const res = await request(app.getHttpServer())
      .post(`/posts/${post.id}/like`)
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(201);

    expect(res.body.liked).toBe(true);
  });

  it('UNLIKE → Bob unlikes Alice’s post', async () => {
    const res = await request(app.getHttpServer())
      .post(`/posts/${post.id}/like`)
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(201);

    expect(res.body.liked).toBe(false);
  });

  it('COMMENT → Bob comments on Alice’s post', async () => {
    const res = await request(app.getHttpServer())
      .post(`/posts/${post.id}/comment`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ text: 'Awesome post!' })
      .expect(201);

    expect(res.body.content).toBe('Awesome post!');
  });

  it('UPDATE → Alice edits her post', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/posts/${post.id}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ content: 'Edited post content' })
      .expect(200);

    expect(res.body.content).toBe('Edited post content');
  });

  it('DELETE → Alice deletes her post', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/posts/${post.id}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});
