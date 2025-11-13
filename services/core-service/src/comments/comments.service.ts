import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NotificationProducer } from '../common/queues/notification.producer';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

type GetCommentsParams = {
  postId: string;
  cursor?: string;
  limit?: number;
  depth?: number;
};

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationProducer,
  ) {}

  // ---------------- CREATE ----------------
  async create(userId: string, postId: string, dto: CreateCommentDto) {
    if (!dto.content?.trim()) throw new BadRequestException('Content required');

    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    if (dto.parentId) {
      const parent = await this.prisma.comment.findUnique({
        where: { id: dto.parentId },
        select: { id: true, postId: true },
      });
      if (!parent) throw new NotFoundException('Parent comment not found');
      if (parent.postId !== postId)
        throw new BadRequestException(
          'Parent comment belongs to a different post',
        );
    }

    const created = await this.prisma.comment.create({
      data: {
        content: dto.content,
        authorId: userId,
        postId,
        parentId: dto.parentId || null,
      },
      include: {
        author: { select: { id: true, handle: true, name: true } },
      },
    });

    // --- Notify post author or parent author ---
    try {
      if (!dto.parentId && post.authorId !== userId) {
        await this.notifications.sendCommentNotification(
          userId,
          post.authorId,
          postId,
        );
      } else if (dto.parentId) {
        const parentAuthor = await this.prisma.comment.findUnique({
          where: { id: dto.parentId },
          select: { authorId: true },
        });
        if (parentAuthor && parentAuthor.authorId !== userId) {
          await this.notifications.sendCommentNotification(
            userId,
            parentAuthor.authorId,
            postId,
          );
        }
      }
    } catch {
      // ignore queue errors in dev/test
    }

    return created;
  }

  // ---------------- GET COMMENTS ----------------
  async getForPost(params: GetCommentsParams) {
    const limit = Math.min(Math.max(params.limit ?? 10, 1), 50);

    const flat = await this.prisma.comment.findMany({
      where: { postId: params.postId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: limit + 1,
      ...(params.cursor ? { skip: 1, cursor: { id: params.cursor } } : {}),
      include: {
        author: { select: { id: true, handle: true, name: true } },
      },
    });

    let nextCursor: string | null = null;
    if (flat.length > limit) {
      const next = flat.pop();
      nextCursor = next!.id;
    }

    // Mask deleted comments
    const masked = flat.map((c) =>
      c.isDeleted ? { ...c, content: '[deleted]' } : c,
    );

    const depth = Math.max(params.depth ?? 2, 1);
    const tree = this.buildTree(masked, depth);

    return { items: tree, nextCursor };
  }

  // ---------------- GET THREAD ----------------
  async getThread(commentId: string, depth = 3) {
    const root = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: { select: { id: true, handle: true, name: true } },
      },
    });
    if (!root) throw new NotFoundException('Comment not found');

    const flat = await this.prisma.comment.findMany({
      where: { postId: root.postId },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      include: {
        author: { select: { id: true, handle: true, name: true } },
      },
    });

    const map = new Map(flat.map((c) => [c.id, c]));
    const collect = (node: any, level: number): any => {
      const self = node.isDeleted ? { ...node, content: '[deleted]' } : node;
      if (level >= depth) return { ...self, replies: [] };

      const replies = flat
        .filter((c) => c.parentId === node.id)
        .map((child) => collect(child, level + 1));

      return { ...self, replies };
    };

    return collect(map.get(commentId), 1);
  }

  // ---------------- UPDATE ----------------
  async update(userId: string, commentId: string, dto: UpdateCommentDto) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId)
      throw new ForbiddenException('Not your comment');
    if (comment.isDeleted)
      throw new BadRequestException('Cannot edit a deleted comment');
    if (!dto.content?.trim()) throw new BadRequestException('Content required');

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { content: dto.content },
      include: {
        author: { select: { id: true, handle: true, name: true } },
      },
    });
  }

  // ---------------- SOFT DELETE ----------------
  async softDelete(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.authorId !== userId)
      throw new ForbiddenException('Not your comment');
    if (comment.isDeleted) return { success: true };

    await this.prisma.comment.update({
      where: { id: commentId },
      data: { isDeleted: true, deletedAt: new Date() },
    });

    return { success: true };
  }

  // ---------------- Helpers ----------------
  private buildTree(items: any[], maxDepth: number) {
    const byParent = new Map<string | null, any[]>();
    items.forEach((c) => {
      const key = c.parentId ?? null;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(c);
    });

    const attach = (parentId: string | null, level: number): any[] => {
      const nodes = byParent.get(parentId) ?? [];
      if (level >= maxDepth) return nodes.map((n) => ({ ...n, replies: [] }));
      return nodes.map((n) => ({
        ...n,
        replies: attach(n.id, level + 1),
      }));
    };

    return attach(null, 1);
  }
}
