import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationProducer } from '../../common/queues/notification.producer';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
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

    return this.prisma.post.create({
      data: {
        content: dto.content,
        imageUrl: dto.imageUrl,
        codeSnippet: dto.codeSnippet,
        authorId: userId,
      },
    });
  }

  // ---------------- FEED ----------------
  async getFeed(params?: { cursor?: string; limit?: number }) {
    const limit = Math.min(Math.max(params?.limit ?? 10, 1), 50);
    const cursor = params?.cursor;

    const posts = await this.prisma.post.findMany({
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        author: { select: { id: true, handle: true, name: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });

    let nextCursor: string | null = null;
    if (posts.length > limit) {
      const next = posts.pop();
      nextCursor = next!.id;
    }

    return { items: posts, nextCursor };
  }

  // ---------------- SINGLE POST ----------------
  async getPostById(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: { id: true, handle: true, name: true } },
        comments: {
          orderBy: { createdAt: 'asc' },
          include: {
            user: { select: { id: true, handle: true, name: true } },
          },
        },
        _count: { select: { likes: true, comments: true } },
      },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  // ---------------- UPDATE ----------------
  async updatePost(userId: string, postId: string, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.authorId !== userId) throw new ForbiddenException('Not your post');

    return this.prisma.post.update({
      where: { id: postId },
      data: dto,
    });
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

    // Don’t notify if user liked their own post
    if (post.authorId !== userId) {
      await this.notifications.sendLikeNotification(
        userId,
        post.authorId,
        postId,
      );
    }

    return { liked: true };
  }

  // ---------------- COMMENT + Notification ----------------
  async addComment(userId: string, postId: string, dto: CreateCommentDto) {
    if (!dto.text?.trim()) {
      throw new BadRequestException('Comment text is required');
    }

    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    const comment = await this.prisma.comment.create({
      data: { text: dto.text, userId, postId },
      include: {
        user: { select: { id: true, handle: true, name: true } },
      },
    });

    // Don’t notify if user commented on their own post
    if (post.authorId !== userId) {
      await this.notifications.sendCommentNotification(
        userId,
        post.authorId,
        postId,
      );
    }

    return comment;
  }
}
