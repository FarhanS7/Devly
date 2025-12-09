import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { ChannelType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TeamsService } from '../teams/teams.service';
import { AddChannelMemberDto } from './dto/add-member.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Injectable()
export class ChannelsService {
  constructor(
    private prisma: PrismaService,
    private teamsService: TeamsService,
  ) {}

  // Helper to generate slug from channel name
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  //===============================================
  // CHANNEL CRUD
  //===============================================

  async create(teamId: string, userId: string, createChannelDto: CreateChannelDto) {
    // Verify user is admin or owner of team
    await this.teamsService.verifyAdminOrOwner(teamId, userId);

    const slug = this.generateSlug(createChannelDto.name);

    // Check if slug already exists in this team
    const existing = await this.prisma.channel.findUnique({
      where: {
        teamId_slug: {
          teamId,
          slug,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Channel with this name already exists in this team');
    }

    const channelType = createChannelDto.type || ChannelType.PUBLIC;

    // Create channel
    const channel = await this.prisma.channel.create({
      data: {
        teamId,
        name: createChannelDto.name,
        slug,
        description: createChannelDto.description,
        type: channelType,
      },
      include: {
        _count: { select: { members: true, messages: true } },
      },
    });

    // If PUBLIC, auto-add all team members
    // If PRIVATE, only add creator
    if (channelType === ChannelType.PUBLIC) {
      const teamMembers = await this.prisma.teamMember.findMany({
        where: { teamId },
        select: { userId: true },
      });

      await this.prisma.channelMember.createMany({
        data: teamMembers.map((member) => ({
          channelId: channel.id,
          userId: member.userId,
        })),
      });
    } else {
      // Private channel - only add creator
      await this.prisma.channelMember.create({
        data: {
          channelId: channel.id,
          userId,
        },
      });
    }

    return this.findOne(channel.id, userId);
  }

  async findTeamChannels(teamId: string, userId: string) {
    // Verify user is team member
    await this.teamsService.verifyMembership(teamId, userId);

    return this.prisma.channel.findMany({
      where: {
        teamId,
        OR: [
          { type: ChannelType.PUBLIC },
          {
            AND: [
              { type: ChannelType.PRIVATE },
              { members: { some: { userId } } },
            ],
          },
        ],
      },
      include: {
        _count: { select: { members: true, messages: true } },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(channelId: string, userId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        team: {
          select: { id: true, name: true, slug: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, handle: true, avatarUrl: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        _count: { select: { messages: true } },
      },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Verify user has access to this channel
    await this.verifyMembership(channelId, userId);

    return channel;
  }

  async update(channelId: string, userId: string, updateChannelDto: UpdateChannelDto) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { teamId: true, slug: true },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Only team admin or owner can update channel
    await this.teamsService.verifyAdminOrOwner(channel.teamId, userId);

    const data: any = { ...updateChannelDto };

    // Regenerate slug if name is being updated
    if (updateChannelDto.name) {
      const newSlug = this.generateSlug(updateChannelDto.name);
      const existing = await this.prisma.channel.findUnique({
        where: {
          teamId_slug: {
            teamId: channel.teamId,
            slug: newSlug,
          },
        },
      });
      if (existing && existing.id !== channelId) {
        throw new BadRequestException('Channel with this name already exists');
      }
      data.slug = newSlug;
    }

    return this.prisma.channel.update({
      where: { id: channelId },
      data,
      include: {
        _count: { select: { members: true, messages: true } },
      },
    });
  }

  async remove(channelId: string, userId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { teamId: true },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Only team admin or owner can delete channel
    await this.teamsService.verifyAdminOrOwner(channel.teamId, userId);

    return this.prisma.channel.delete({ where: { id: channelId } });
  }

  //===============================================
  // CHANNEL MEMBERS
  //===============================================

  async addMember(channelId: string, userId: string, addMemberDto: AddChannelMemberDto) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { teamId: true, type: true },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Only team admin or owner can add members to private channels
    if (channel.type === ChannelType.PRIVATE) {
      await this.teamsService.verifyAdminOrOwner(channel.teamId, userId);
    } else {
      // For public channels, any team member can join
      await this.teamsService.verifyMembership(channel.teamId, userId);
    }

    // Check if target user is a team member
    const teamMember = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId: channel.teamId,
          userId: addMemberDto.userId,
        },
      },
    });

    if (!teamMember) {
      throw new BadRequestException('User must be a team member first');
    }

    // Check if already a channel member
    const existing = await this.prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId: addMemberDto.userId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('User is already a channel member');
    }

    const member = await this.prisma.channelMember.create({
      data: {
        channelId,
        userId: addMemberDto.userId,
      },
      include: {
        user: {
          select: { id: true, name: true, handle: true, avatarUrl: true },
        },
      },
    });

    return member;
  }

  async removeMember(channelId: string, userId: string, targetUserId: string) {
    const channel = await this.prisma.channel.findUnique({
      where: { id: channelId },
      select: { teamId: true },
    });

    if (!channel) {
      throw new NotFoundException('Channel not found');
    }

    // Admin/owner can remove anyone, or user can leave themselves
    const isSelfLeave = userId === targetUserId;
    if (!isSelfLeave) {
      await this.teamsService.verifyAdminOrOwner(channel.teamId, userId);
    }

    const member = await this.prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId: targetUserId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this channel');
    }

    return this.prisma.channelMember.delete({
      where: {
        channelId_userId: {
          channelId,
          userId: targetUserId,
        },
      },
    });
  }

  async getMessages(channelId: string, userId: string, options?: { limit?: number; cursor?: string }) {
    // Verify user has access to channel
    await this.verifyMembership(channelId, userId);

    const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);
    const cursor = options?.cursor;

    const messages = await this.prisma.channelMessage.findMany({
      take: limit + 1,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      where: { channelId, parentId: null }, // Only top-level messages (not thread replies)
      orderBy: { createdAt: 'desc' },
      include: {
        sender: {
          select: { id: true, name: true, handle: true, avatarUrl: true },
        },
        _count: { select: { replies: true, reactions: true } },
      },
    });

    let nextCursor: string | null = null;
    if (messages.length > limit) {
      const next = messages.pop();
      nextCursor = next!.id;
    }

    return { messages: messages.reverse(), nextCursor };
  }

  //===============================================
  // PERMISSION HELPERS
  //===============================================

  async verifyMembership(channelId: string, userId: string): Promise<void> {
    const member = await this.prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this channel');
    }
  }

  async isMember(channelId: string, userId: string): Promise<boolean> {
    const member = await this.prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    return !!member;
  }
}
