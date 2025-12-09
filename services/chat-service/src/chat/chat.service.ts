import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(public prisma: PrismaService) {}

  async saveMessage(senderId: string, payload: { conversationId: string; content?: string; attachmentUrl?: string }) {
    return this.prisma.message.create({
      data: {
        senderId,
        conversationId: payload.conversationId,
        content: payload.content,
        attachmentUrl: payload.attachmentUrl,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true, handle: true },
        },
      },
    });
  }

  async isParticipant(userId: string, conversationId: string): Promise<boolean> {
    const count = await this.prisma.conversationParticipant.count({
      where: {
        userId,
        conversationId,
      },
    });
    return count > 0;
  }

  async getUserConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true, handle: true },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getMessages(conversationId: string, userId: string) {
    // Verify participation
    const isPart = await this.isParticipant(userId, conversationId);
    if (!isPart) throw new Error('Not a participant');

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true, handle: true },
        },
      },
    });
  }

  async markRead(userId: string, conversationId: string, messageId: string) {
    return this.prisma.conversationParticipant.update({
      where: {
        conversationId_userId: {
          conversationId,
          userId,
        },
      },
      data: {
        lastReadMessageId: messageId,
      },
    });
  }

  /**
   * Find existing conversation between two users, or create a new one
   */
  async findOrCreateConversation(userId1: string, userId2: string) {
    // Find existing conversation where both users are participants
    const existingConversation = await this.prisma.conversation.findFirst({
      where: {
        participants: {
          every: {
            userId: {
              in: [userId1, userId2],
            },
          },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true, handle: true },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: { id: true, name: true, avatarUrl: true, handle: true },
            },
          },
        },
      },
    });

    // Check if conversation has exactly 2 participants and both are our users
    if (existingConversation && existingConversation.participants.length === 2) {
      const participantIds = existingConversation.participants.map(p => p.userId).sort();
      const expectedIds = [userId1, userId2].sort();
      if (participantIds[0] === expectedIds[0] && participantIds[1] === expectedIds[1]) {
        return existingConversation;
      }
    }

    // Create new conversation
    const newConversation = await this.prisma.conversation.create({
      data: {
        participants: {
          create: [
            { userId: userId1 },
            { userId: userId2 },
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, avatarUrl: true, handle: true },
            },
          },
        },
        messages: true,
      },
    });

    return newConversation;
  }

  /**
   * Get total unread message count for a user across all conversations
   */
  async getUnreadCount(userId: string): Promise<number> {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          where: { userId },
          select: { lastReadMessageId: true },
        },
        messages: {
          select: { id: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    let totalUnread = 0;
    for (const conv of conversations) {
      const lastReadId = conv.participants[0]?.lastReadMessageId;
      if (!lastReadId) {
        // Never read anything, count all messages
        totalUnread += conv.messages.length;
      } else {
        // Count messages after last read
        const lastReadIndex = conv.messages.findIndex(m => m.id === lastReadId);
        if (lastReadIndex !== -1) {
          totalUnread += lastReadIndex; // Messages before this index are unread
        }
      }
    }

    return totalUnread;
  }

  /**
   * Get unread count for a specific conversation
   */
  async getConversationUnreadCount(conversationId: string, userId: string): Promise<number> {
    const participant = await this.prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId },
      },
      select: { lastReadMessageId: true },
    });

    if (!participant) return 0;

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    if (!participant.lastReadMessageId) {
      return messages.length;
    }

    const lastReadIndex = messages.findIndex(m => m.id === participant.lastReadMessageId);
    return lastReadIndex === -1 ? 0 : lastReadIndex;
  }

  /**
   * Save a channel message (for Teams & Channels feature)
   */
  async saveChannelMessage(
    senderId: string,
    payload: {
      channelId: string;
      content?: string;
      attachmentUrl?: string;
      parentId?: string;
    },
  ) {
    return this.prisma.channelMessage.create({
      data: {
        senderId,
        channelId: payload.channelId,
        content: payload.content,
        attachmentUrl: payload.attachmentUrl,
        parentId: payload.parentId,
      },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true, handle: true },
        },
        parent: payload.parentId
          ? {
              select: {
                id: true,
                content: true,
                sender: {
                  select: { id: true, name: true, handle: true },
                },
              },
            }
          : undefined,
        _count: { select: { replies: true, reactions: true } },
      },
    });
  }

  //===============================================
  // THREAD METHODS
  //===============================================

  /**
   * Get all replies to a message (thread)
   */
  async getThreadReplies(messageId: string, options: { skip?: number; take?: number } = {}) {
    const { skip = 0, take = 50 } = options;

    const replies = await this.prisma.channelMessage.findMany({
      where: { parentId: messageId },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true, handle: true },
        },
        _count: { select: { replies: true, reactions: true } },
      },
      orderBy: { createdAt: 'asc' },
      skip,
      take,
    });

    const total = await this.prisma.channelMessage.count({
      where: { parentId: messageId },
    });

    return { replies, total, hasMore: skip + take < total };
  }

  /**
   * Get full thread (parent message + all replies)
   */
  async getFullThread(messageId: string) {
    // Get parent message
    const parent = await this.prisma.channelMessage.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true, handle: true },
        },
        _count: { select: { replies: true, reactions: true } },
      },
    });

    if (!parent) {
      return null;
    }

    // Get all replies
    const replies = await this.prisma.channelMessage.findMany({
      where: { parentId: messageId },
      include: {
        sender: {
          select: { id: true, name: true, avatarUrl: true, handle: true },
        },
        _count: { select: { replies: true, reactions: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    return {
      parent,
      replies,
      replyCount: replies.length,
    };
  }

  /**
   * Get unique participants in a thread
   */
  async getThreadParticipants(messageId: string) {
    const messages = await this.prisma.channelMessage.findMany({
      where: {
        OR: [{ id: messageId }, { parentId: messageId }],
      },
      select: {
        sender: {
          select: { id: true, name: true, avatarUrl: true, handle: true },
        },
      },
    });

    // Deduplicate by user ID
    const uniqueUsers = new Map();
    messages.forEach((msg) => {
      if (!uniqueUsers.has(msg.sender.id)) {
        uniqueUsers.set(msg.sender.id, msg.sender);
      }
    });

    return Array.from(uniqueUsers.values());
  }

  /**
   * Get thread summary
   */
  async getThreadSummary(messageId: string) {
    const thread = await this.getFullThread(messageId);
    if (!thread) {
      return null;
    }

    const participants = await this.getThreadParticipants(messageId);
    const latestReply = thread.replies[thread.replies.length - 1];

    return {
      messageId,
      replyCount: thread.replyCount,
      participants,
      latestReply: latestReply
        ? {
            id: latestReply.id,
            content: latestReply.content,
            sender: latestReply.sender,
            createdAt: latestReply.createdAt,
          }
        : null,
    };
  }
}
