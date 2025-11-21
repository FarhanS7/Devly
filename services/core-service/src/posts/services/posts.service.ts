import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationProducer } from '../../common/queues/notification.producer';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationProducer,
  ) {}

  // ---------------- CREATE ----------------
  async createPost(userId: string, dto: CreatePostDto) {
    if (!dto.content?.trim()) {
      throw new BadRequestException('Post content is required');
    }

    const post = await this.prisma.post.create({
      data: {
        content: dto.content,
        imageUrl: dto.imageUrl,
        codeSnippet: dto.codeSnippet,
        authorId: userId,
      },
      include: {
        author: {
          select: {
            id: true,
            handle: true,
            name: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { likes: true, comments: true },
        },
      },
    });

    // New post is obviously not liked yet by the author
    return { ...post, isLiked: false };
  }

  // ---------------- FEED ----------------
  async getFeed(
    params?: { cursor?: string; limit?: number },
    currentUserId?: string,
  ) {
    const limit = Math.min(Math.max(params?.limit ?? 10, 1), 50);
    const cursor = params?.cursor;

    const posts = await this.prisma.post.findMany({
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            handle: true,
            name: true,
            avatarUrl: true,
          },
        },
        _count: { select: { likes: true, comments: true } },
        ...(currentUserId && {
          likes: {
            where: { userId: currentUserId },
            select: { id: true },
          },
        }),
      },
    });

    let nextCursor: string | null = null;
    if (posts.length > limit) {
      const next = posts.pop();
      nextCursor = next!.id;
    }

    const items = posts.map((p: any) => {
      const { likes, ...rest } = p;
      return {
        ...rest,
        isLiked: !!(likes && likes.length),
      };
    });

    return { items, nextCursor };
  }

  // ---------------- SINGLE POST ----------------
  async getPostById(postId: string, currentUserId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            handle: true,
            name: true,
            avatarUrl: true,
          },
        },
        _count: { select: { likes: true, comments: true } },
        ...(currentUserId && {
          likes: {
            where: { userId: currentUserId },
            select: { id: true },
          },
        }),
      },
    });
    if (!post) throw new NotFoundException('Post not found');

    const { likes, ...rest } = post as any;
    return {
      ...rest,
      isLiked: !!(likes && likes.length),
    };
  }

  // ---------------- UPDATE ----------------
  async updatePost(userId: string, postId: string, dto: UpdatePostDto) {
    const existing = await this.prisma.post.findUnique({
      where: { id: postId },
    });
    if (!existing) throw new NotFoundException('Post not found');
    if (existing.authorId !== userId) {
      throw new ForbiddenException('Not your post');
    }

    const post = await this.prisma.post.update({
      where: { id: postId },
      data: dto,
      include: {
        author: {
          select: {
            id: true,
            handle: true,
            name: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: { likes: true, comments: true },
        },
        likes: {
          where: { userId },
          select: { id: true },
        },
      },
    });

    const { likes, ...rest } = post as any;
    return {
      ...rest,
      isLiked: !!(likes && likes.length),
    };
  }

  // ---------------- DELETE ----------------
  async deletePost(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('Not your post');

    await this.prisma.post.delete({ where: { id: postId } });
    return { success: true };
  }

  // ---------------- LIKE / UNLIKE + Notification ----------------
  async toggleLike(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });
    if (!post) throw new NotFoundException('Post not found');

    const existing = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await this.prisma.like.delete({ where: { id: existing.id } });
      return { liked: false };
    }

    await this.prisma.like.create({ data: { userId, postId } });

    if (post.authorId !== userId) {
      try {
        this.notifications.sendLikeNotification(userId, post.authorId, postId);
      } catch {
        // ignore Redis/queue errors
      }
    }

    return { liked: true };
  }

  // ---------------- POSTS BY HANDLE ----------------
  async getPostsByHandle(handle: string, currentUserId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { handle },
    });

    if (!user) throw new NotFoundException('User not found');

    const posts = await this.prisma.post.findMany({
      where: { authorId: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            handle: true,
            name: true,
            avatarUrl: true,
          },
        },
        _count: { select: { likes: true, comments: true } },
        ...(currentUserId && {
          likes: {
            where: { userId: currentUserId },
            select: { id: true },
          },
        }),
      },
    });

    return posts.map((p: any) => {
      const { likes, ...rest } = p;
      return {
        ...rest,
        isLiked: !!(likes && likes.length),
      };
    });
  }
}
