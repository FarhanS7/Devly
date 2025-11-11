import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Comments E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let aliceToken: string;
  let bobToken: string;
  let post: any;
  let rootComment: any;
  let reply: any;

  jest.setTimeout(30000);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    prisma = moduleRef.get(PrismaService);
    await app.init();

    // Clean up
    await prisma.comment.deleteMany({});
    await prisma.post.deleteMany({});
    await prisma.user.deleteMany({});

    // Create users
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'alice.comments@example.com',
        handle: 'alice_comments',
        password: 'password123',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: 'bob.comments@example.com',
        handle: 'bob_comments',
        password: 'password123',
      })
      .expect(201);

    const loginAlice = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'alice.comments@example.com', password: 'password123' })
      .expect(200);

    const loginBob = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'bob.comments@example.com', password: 'password123' })
      .expect(200);

    aliceToken = loginAlice.body.accessToken;
    bobToken = loginBob.body.accessToken;

    const alice = await prisma.user.findUnique({
      where: { email: 'alice.comments@example.com' },
    });

    // Alice creates a post
    post = await prisma.post.create({
      data: {
        content: 'My first post about testing comments',
        authorId: alice.id,
      },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('CREATE → Alice creates a root comment', async () => {
    const res = await request(app.getHttpServer())
      .post(`/comments/${post.id}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ content: 'Hello from Alice' })
      .expect(201);

    expect(res.body.content).toBe('Hello from Alice');
    rootComment = res.body;
  });

  it('REPLY → Bob replies to Alice', async () => {
    const res = await request(app.getHttpServer())
      .post(`/comments/${post.id}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({
        content: 'Nice comment Alice!',
        parentId: rootComment.id,
      })
      .expect(201);

    expect(res.body.parentId).toBe(rootComment.id);
    reply = res.body;
  });

  it('GET POST COMMENTS → returns nested tree', async () => {
    const res = await request(app.getHttpServer())
      .get(`/comments/post/${post.id}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);

    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items[0].replies.length).toBeGreaterThan(0);
  });

  it('UPDATE → Bob edits his reply', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/comments/${reply.id}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ content: 'Edited reply from Bob' })
      .expect(200);

    expect(res.body.content).toBe('Edited reply from Bob');
  });

  it('SOFT DELETE → Bob deletes his reply', async () => {
    await request(app.getHttpServer())
      .delete(`/comments/${reply.id}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .expect(200);

    const tree = await request(app.getHttpServer())
      .get(`/comments/post/${post.id}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);

    const deleted = tree.body.items[0].replies.find(
      (r: any) => r.id === reply.id,
    );
    expect(deleted.content).toBe('[deleted]');
  });

  it('PAGINATION → limits results and returns nextCursor', async () => {
    for (let i = 0; i < 3; i++) {
      await request(app.getHttpServer())
        .post(`/comments/${post.id}`)
        .set('Authorization', `Bearer ${aliceToken}`)
        .send({ content: `Extra root comment ${i}` })
        .expect(201);
    }

    const res = await request(app.getHttpServer())
      .get(`/comments/post/${post.id}?limit=2`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);

    expect(res.body.items.length).toBeLessThanOrEqual(2);
    expect(res.body.nextCursor).toBeDefined();
  });
});
