import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReactionsService {
  private readonly logger = new Logger(ReactionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Add a reaction to a message
   */
  async addReaction(userId: string, messageId: string, emoji: string) {
    try {
      // Check if message exists
      const message = await this.prisma.channelMessage.findUnique({
        where: { id: messageId },
        select: { id: true, channelId: true },
      });

      if (!message) {
        throw new NotFoundException('Message not found');
      }

      // Create reaction (will throw if duplicate due to unique constraint)
      const reaction = await this.prisma.messageReaction.create({
        data: {
          messageId,
          userId,
          emoji,
        },
        include: {
          user: {
            select: { id: true, name: true, handle: true, avatarUrl: true },
          },
        },
      });

      this.logger.log(`User ${userId} added reaction ${emoji} to message ${messageId}`);
      return { ...reaction, channelId: message.channelId };
    } catch (error) {
      if (error.code === 'P2002') {
        // Unique constraint violation
        throw new ConflictException('You have already reacted with this emoji');
      }
      throw error;
    }
  }

  /**
   * Remove a reaction from a message
   */
  async removeReaction(userId: string, messageId: string, emoji: string) {
    // Check if message exists
    const message = await this.prisma.channelMessage.findUnique({
      where: { id: messageId },
      select: { id: true, channelId: true },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Find and delete the reaction
    const reaction = await this.prisma.messageReaction.findFirst({
      where: {
        messageId,
        userId,
        emoji,
      },
    });

    if (!reaction) {
      throw new NotFoundException('Reaction not found');
    }

    await this.prisma.messageReaction.delete({
      where: { id: reaction.id },
    });

    this.logger.log(`User ${userId} removed reaction ${emoji} from message ${messageId}`);
    return { messageId, userId, emoji, channelId: message.channelId };
  }

  /**
   * Toggle a reaction (add if not exists, remove if exists)
   */
  async toggleReaction(userId: string, messageId: string, emoji: string) {
    const existing = await this.prisma.messageReaction.findFirst({
      where: {
        messageId,
        userId,
        emoji,
      },
    });

    if (existing) {
      return this.removeReaction(userId, messageId, emoji);
    } else {
      return this.addReaction(userId, messageId, emoji);
    }
  }

  /**
   * Get all reactions for a message
   */
  async getMessageReactions(messageId: string) {
    const reactions = await this.prisma.messageReaction.findMany({
      where: { messageId },
      include: {
        user: {
          select: { id: true, name: true, handle: true, avatarUrl: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by emoji
    const grouped = reactions.reduce((acc, reaction) => {
      if (!acc[reaction.emoji]) {
        acc[reaction.emoji] = {
          emoji: reaction.emoji,
          count: 0,
          users: [],
        };
      }
      acc[reaction.emoji].count++;
      acc[reaction.emoji].users.push(reaction.user);
      return acc;
    }, {} as Record<string, { emoji: string; count: number; users: any[] }>);

    return Object.values(grouped);
  }

  /**
   * Get reaction summary for a message (count by emoji)
   */
  async getReactionSummary(messageId: string) {
    const reactions = await this.prisma.messageReaction.groupBy({
      by: ['emoji'],
      where: { messageId },
      _count: { emoji: true },
    });

    return reactions.map((r) => ({
      emoji: r.emoji,
      count: r._count.emoji,
    }));
  }

  /**
   * Check if user can access the message's channel
   */
  async canAccessMessage(userId: string, messageId: string): Promise<boolean> {
    const message = await this.prisma.channelMessage.findUnique({
      where: { id: messageId },
      select: {
        channel: {
          select: {
            members: {
              where: { userId },
              select: { id: true },
            },
          },
        },
      },
    });

    return message?.channel?.members?.length > 0;
  }
}
