import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCommentDto } from '../dto/create-comment.dto';
import { CreatePostDto } from '../dto/create-post.dto';
import { UpdatePostDto } from '../dto/update-post.dto';

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  // Common select projections to avoid overfetching
  private postSelect = {
    id: true,
    content: true,
    imageUrl: true,
    codeSnippet: true,
    createdAt: true,
    updatedAt: true,
    author: {
      select: {
        id: true,
        handle: true,
        name: true,
      },
    },
  } as const;

  private postSelectWithCounts = {
    ...this.postSelect,
    _count: {
      select: { likes: true, comments: true },
    },
  } as const;

  private postSelectDeep = {
    ...this.postSelectWithCounts,
    comments: {
      orderBy: { createdAt: 'desc' },
      take: 5, // small preview; full thread could be separate endpoint later
      select: {
        id: true,
        text: true,
        createdAt: true,
        user: { select: { id: true, handle: true, name: true } },
      },
    },
  } as const;

  async createPost(userId: string, dto: CreatePostDto) {
    const post = await this.prisma.post.create({
      data: {
        content: dto.content,
        imageUrl: dto.imageUrl,
        codeSnippet: dto.codeSnippet,
        author: { connect: { id: userId } }, //  connect existing user
      },
      select: {
        id: true,
        content: true,
        imageUrl: true,
        codeSnippet: true,
        createdAt: true,
        updatedAt: true,
        author: {
          select: {
            id: true,
            handle: true,
            name: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    return post;
  }

  /**
   * Cursor-based pagination for feed
   * @param cursor last seen post id (optional)
   * @param limit page size (default 10)
   */
  async getFeed(params: { cursor?: string | null; limit?: number } = {}) {
    const limit = Math.min(Math.max(params.limit ?? 10, 1), 50);
    const cursor = params.cursor ?? null;

    const items = await this.prisma.post.findMany({
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: this.postSelectWithCounts,
    });

    let nextCursor: string | null = null;
    if (items.length > limit) {
      const next = items.pop(); // remove the extra record
      nextCursor = next?.id ?? null;
    }

    return { items, nextCursor };
  }

  async getPostById(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: this.postSelectDeep,
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async updatePost(userId: string, postId: string, dto: UpdatePostDto) {
    const own = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    if (!own) throw new NotFoundException('Post not found');
    if (own.authorId !== userId) throw new ForbiddenException('Not your post');

    const updated = await this.prisma.post.update({
      where: { id: postId },
      data: { ...dto },
      select: this.postSelectWithCounts,
    });
    return updated;
  }

  async deletePost(userId: string, postId: string) {
    const own = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true },
    });
    if (!own) throw new NotFoundException('Post not found');
    if (own.authorId !== userId) throw new ForbiddenException('Not your post');

    // If you prefer cascading deletes in DB, define onDelete in schema.
    await this.prisma.post.delete({ where: { id: postId } });
    return { id: postId, deleted: true };
  }

  async toggleLike(userId: string, postId: string) {
    // ensure post exists (optional but nice error)
    const exists = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Post not found');

    const uniqueKey = { userId_postId: { userId, postId } } as const;

    const like = await this.prisma.like.findUnique({
      where: uniqueKey,
      select: { id: true },
    });

    if (like) {
      await this.prisma.like.delete({ where: uniqueKey });
      const count = await this.prisma.like.count({ where: { postId } });
      return { liked: false, count };
    }

    await this.prisma.like.create({ data: { userId, postId } });
    const count = await this.prisma.like.count({ where: { postId } });
    return { liked: true, count };
  }

  async addComment(userId: string, postId: string, dto: CreateCommentDto) {
    // Optional guard: ensure post exists
    const exists = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!exists) throw new NotFoundException('Post not found');

    const comment = await this.prisma.comment.create({
      data: { text: dto.text, userId, postId },
      select: {
        id: true,
        text: true,
        createdAt: true,
        user: { select: { id: true, handle: true, name: true } },
      },
    });
    return comment;
  }
}
