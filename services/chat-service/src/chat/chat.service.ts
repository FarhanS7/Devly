import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

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
}
