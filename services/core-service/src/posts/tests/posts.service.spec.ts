import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PostsService } from '../services/posts.service';

describe('PostsService', () => {
  let service: PostsService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      post: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      like: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      comment: {
        create: jest.fn(),
      },
    };

    service = new PostsService(prisma as PrismaService);
  });

  it('should create a post', async () => {
    prisma.post.create.mockResolvedValue({ id: 'p1', content: 'hello' });
    const result = await service.createPost('u1', { content: 'hello' });
    expect(result.id).toBe('p1');
    expect(prisma.post.create).toHaveBeenCalled();
  });

  it('should get feed with next cursor', async () => {
    prisma.post.findMany.mockResolvedValue([
      { id: 'p1', content: 'a' },
      { id: 'p2', content: 'b' },
    ]);
    const res = await service.getFeed({ limit: 1 });
    expect(res.items.length).toBe(1);
    expect(res.nextCursor).toBe('p2');
  });

  it('should throw NotFound if post missing on getPostById', async () => {
    prisma.post.findUnique.mockResolvedValue(null);
    await expect(service.getPostById('x')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('should update post if user owns it', async () => {
    prisma.post.findUnique.mockResolvedValue({ authorId: 'u1' });
    prisma.post.update.mockResolvedValue({ id: 'p1', content: 'new' });

    const res = await service.updatePost('u1', 'p1', { content: 'new' });
    expect(res.content).toBe('new');
  });

  it('should block update if not author', async () => {
    prisma.post.findUnique.mockResolvedValue({ authorId: 'u2' });
    await expect(
      service.updatePost('u1', 'p1', { content: 'x' }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('should toggle like on and off', async () => {
    prisma.post.findUnique.mockResolvedValue({ id: 'p1' });

    // like not found → create
    prisma.like.findUnique.mockResolvedValueOnce(null);
    prisma.like.count.mockResolvedValue(1);
    const liked = await service.toggleLike('u1', 'p1');
    expect(liked.liked).toBe(true);

    // like exists → delete
    prisma.like.findUnique.mockResolvedValueOnce({ id: 'l1' });
    prisma.like.count.mockResolvedValue(0);
    const unliked = await service.toggleLike('u1', 'p1');
    expect(unliked.liked).toBe(false);
  });

  it('should add comment', async () => {
    prisma.post.findUnique.mockResolvedValue({ id: 'p1' });
    prisma.comment.create.mockResolvedValue({ id: 'c1', text: 'nice' });

    const res = await service.addComment('u1', 'p1', { text: 'nice' });
    expect(res.id).toBe('c1');
  });
});
