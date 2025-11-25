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
}
