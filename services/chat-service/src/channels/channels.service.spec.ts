import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ChannelType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TeamsService } from '../teams/teams.service';
import { ChannelsService } from './channels.service';

describe('ChannelsService', () => {
  let service: ChannelsService;
  let prisma: PrismaService;
  let teamsService: TeamsService;

  const mockPrismaService = {
    channel: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    channelMember: {
      create: jest.fn(),
      createMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    teamMember: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    channelMessage: {
      findMany: jest.fn(),
    },
  };

  const mockTeamsService = {
    verifyAdminOrOwner: jest.fn(),
    verifyMembership: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChannelsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TeamsService,
          useValue: mockTeamsService,
        },
      ],
    }).compile();

    service = module.get<ChannelsService>(ChannelsService);
    prisma = module.get<PrismaService>(PrismaService);
    teamsService = module.get<TeamsService>(TeamsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const teamId = 'team-1';
    const userId = 'user-1';
    const createDto = {
      name: 'General Channel',
      description: 'General discussion',
      type: ChannelType.PUBLIC,
    };

    it('should create a public channel and add all team members', async () => {
      const channel = {
        id: 'channel-1',
        teamId,
        name: 'General Channel',
        slug: 'general-channel',
        description: 'General discussion',
        type: ChannelType.PUBLIC,
        createdAt: new Date(),
        _count: { members: 0, messages: 0 },
      };

      const teamMembers = [
        { userId: 'user-1' },
        { userId: 'user-2' },
        { userId: 'user-3' },
      ];

      mockTeamsService.verifyAdminOrOwner.mockResolvedValue(undefined);
      mockPrismaService.channel.findUnique.mockResolvedValue(null);
      mockPrismaService.channel.create.mockResolvedValue(channel);
      mockPrismaService.teamMember.findMany.mockResolvedValue(teamMembers);
      mockPrismaService.channelMember.createMany.mockResolvedValue({ count: 3 });

      // Mock findOne to return full channel data
      jest.spyOn(service, 'findOne').mockResolvedValue({
        ...channel,
        team: { id: teamId, name: 'Team', slug: 'team' },
        members: [],
      } as any);

      const result = await service.create(teamId, userId, createDto);

      expect(mockTeamsService.verifyAdminOrOwner).toHaveBeenCalledWith(teamId, userId);
      expect(mockPrismaService.channel.create).toHaveBeenCalled();
      expect(mockPrismaService.teamMember.findMany).toHaveBeenCalledWith({
        where: { teamId },
        select: { userId: true },
      });
      expect(mockPrismaService.channelMember.createMany).toHaveBeenCalled();
    });

    it('should create a private channel and add only the creator', async () => {
      const privateDto = { ...createDto, type: ChannelType.PRIVATE };
      const channel = {
        id: 'channel-1',
        teamId,
        name: 'Private Channel',
        slug: 'private-channel',
        type: ChannelType.PRIVATE,
        createdAt: new Date(),
        _count: { members: 0, messages: 0 },
      };

      mockTeamsService.verifyAdminOrOwner.mockResolvedValue(undefined);
      mockPrismaService.channel.findUnique.mockResolvedValue(null);
      mockPrismaService.channel.create.mockResolvedValue(channel);
      mockPrismaService.channelMember.create.mockResolvedValue({
        channelId: channel.id,
        userId,
        joinedAt: new Date(),
      });

      jest.spyOn(service, 'findOne').mockResolvedValue({
        ...channel,
        team: { id: teamId, name: 'Team', slug: 'team' },
        members: [],
      } as any);

      await service.create(teamId, userId, privateDto);

      expect(mockPrismaService.channelMember.create).toHaveBeenCalledWith({
        data: {
          channelId: channel.id,
          userId,
        },
      });
    });

    it('should throw BadRequestException if channel name already exists', async () => {
      mockTeamsService.verifyAdminOrOwner.mockResolvedValue(undefined);
      mockPrismaService.channel.findUnique.mockResolvedValue({
        id: 'existing-channel',
        slug: 'general-channel',
      });

      await expect(service.create(teamId, userId, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw if user is not admin or owner', async () => {
      mockTeamsService.verifyAdminOrOwner.mockRejectedValue(
        new ForbiddenException('Not authorized'),
      );

      await expect(service.create(teamId, userId, createDto)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('findTeamChannels', () => {
    it('should return all public and user\'s private channels', async () => {
      const teamId = 'team-1';
      const userId = 'user-1';
      const channels = [
        { id: 'ch-1', name: 'General', type: ChannelType.PUBLIC },
        { id: 'ch-2', name: 'Private', type: ChannelType.PRIVATE },
      ];

      mockTeamsService.verifyMembership.mockResolvedValue(undefined);
      mockPrismaService.channel.findMany.mockResolvedValue(channels);

      const result = await service.findTeamChannels(teamId, userId);

      expect(mockTeamsService.verifyMembership).toHaveBeenCalledWith(teamId, userId);
      expect(result).toEqual(channels);
    });
  });

  describe('findOne', () => {
    it('should return channel details if user is a member', async () => {
      const channelId = 'channel-1';
      const userId = 'user-1';
      const channel = {
        id: channelId,
        name: 'General',
        team: { id: 'team-1', name: 'Team', slug: 'team' },
        members: [],
        _count: { messages: 10 },
      };

      mockPrismaService.channel.findUnique.mockResolvedValue(channel);
      jest.spyOn(service, 'verifyMembership').mockResolvedValue(undefined);

      const result = await service.findOne(channelId, userId);

      expect(result).toEqual(channel);
    });

    it('should throw NotFoundException if channel does not exist', async () => {
      mockPrismaService.channel.findUnique.mockResolvedValue(null);

      await expect(service.findOne('non-existent', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update channel details', async () => {
      const channelId = 'channel-1';
      const userId = 'user-1';
      const updateDto = { name: 'Updated Name', description: 'Updated description' };

      mockPrismaService.channel.findUnique.mockResolvedValue({
        id: channelId,
        teamId: 'team-1',
        slug: 'old-slug',
      });
      mockTeamsService.verifyAdminOrOwner.mockResolvedValue(undefined);
      mockPrismaService.channel.update.mockResolvedValue({
        id: channelId,
        ...updateDto,
        slug: 'updated-name',
      });

      await service.update(channelId, userId, updateDto);

      expect(mockTeamsService.verifyAdminOrOwner).toHaveBeenCalled();
      expect(mockPrismaService.channel.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if channel does not exist', async () => {
      mockPrismaService.channel.findUnique.mockResolvedValue(null);

      await expect(service.update('non-existent', 'user-1', {})).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a channel', async () => {
      const channelId = 'channel-1';
      const userId = 'user-1';

      mockPrismaService.channel.findUnique.mockResolvedValue({
        id: channelId,
        teamId: 'team-1',
      });
      mockTeamsService.verifyAdminOrOwner.mockResolvedValue(undefined);
      mockPrismaService.channel.delete.mockResolvedValue({ id: channelId });

      await service.remove(channelId, userId);

      expect(mockPrismaService.channel.delete).toHaveBeenCalledWith({
        where: { id: channelId },
      });
    });
  });

  describe('addMember', () => {
    it('should add member to channel', async () => {
      const channelId = 'channel-1';
      const userId = 'admin-1';
      const addMemberDto = { userId: 'user-2' };

      mockPrismaService.channel.findUnique.mockResolvedValue({
        teamId: 'team-1',
        type: ChannelType.PUBLIC,
      });
      mockTeamsService.verifyMembership.mockResolvedValue(undefined);
      mockPrismaService.teamMember.findUnique.mockResolvedValue({ userId: 'user-2' });
      mockPrismaService.channelMember.findUnique.mockResolvedValue(null);
      mockPrismaService.channelMember.create.mockResolvedValue({
        channelId,
        userId: 'user-2',
        user: { id: 'user-2', name: 'User 2', handle: 'user2', avatarUrl: null },
      });

      const result = await service.addMember(channelId, userId, addMemberDto);

      expect(result).toBeDefined();
      expect(result.userId).toBe('user-2');
    });

    it('should throw BadRequestException if user already a member', async () => {
      const channelId = 'channel-1';
      const userId = 'admin-1';
      const addMemberDto = { userId: 'user-2' };

      mockPrismaService.channel.findUnique.mockResolvedValue({
        teamId: 'team-1',
        type: ChannelType.PUBLIC,
      });
      mockTeamsService.verifyMembership.mockResolvedValue(undefined);
      mockPrismaService.teamMember.findUnique.mockResolvedValue({ userId: 'user-2' });
      mockPrismaService.channelMember.findUnique.mockResolvedValue({
        channelId,
        userId: 'user-2',
      });

      await expect(service.addMember(channelId, userId, addMemberDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('removeMember', () => {
    it('should allow user to leave channel', async () => {
      const channelId = 'channel-1';
      const userId = 'user-1';

      mockPrismaService.channel.findUnique.mockResolvedValue({
        teamId: 'team-1',
      });
      mockPrismaService.channelMember.findUnique.mockResolvedValue({
        channelId,
        userId,
      });
      mockPrismaService.channelMember.delete.mockResolvedValue({});

      await service.removeMember(channelId, userId, userId);

      expect(mockPrismaService.channelMember.delete).toHaveBeenCalled();
    });

    it('should allow admin to remove any member', async () => {
      const channelId = 'channel-1';
      const adminId = 'admin-1';
      const targetUserId = 'user-2';

      mockPrismaService.channel.findUnique.mockResolvedValue({
        teamId: 'team-1',
      });
      mockTeamsService.verifyAdminOrOwner.mockResolvedValue(undefined);
      mockPrismaService.channelMember.findUnique.mockResolvedValue({
        channelId,
        userId: targetUserId,
      });
      mockPrismaService.channelMember.delete.mockResolvedValue({});

      await service.removeMember(channelId, adminId, targetUserId);

      expect(mockTeamsService.verifyAdminOrOwner).toHaveBeenCalled();
    });
  });

  describe('getMessages', () => {
    it('should return paginated messages for a channel', async () => {
      const channelId = 'channel-1';
      const userId = 'user-1';
      const messages = [
        {
          id: 'msg-1',
          content: 'Hello',
          sender: { id: 'user-1', name: 'User 1', handle: 'user1', avatarUrl: null },
          _count: { replies: 0, reactions: 0 },
        },
      ];

      jest.spyOn(service, 'verifyMembership').mockResolvedValue(undefined);
      mockPrismaService.channelMessage.findMany.mockResolvedValue(messages);

      const result = await service.getMessages(channelId, userId, { limit: 50 });

      expect(result.messages).toHaveLength(1);
      expect(result.nextCursor).toBeNull();
    });

    it('should return nextCursor when there are more messages', async () => {
      const channelId = 'channel-1';
      const userId = 'user-1';
      const messages = Array.from({ length: 51 }, (_, i) => ({
        id: `msg-${i}`,
        content: `Message ${i}`,
        sender: { id: 'user-1', name: 'User', handle: 'user', avatarUrl: null },
        _count: { replies: 0, reactions: 0 },
      }));

      jest.spyOn(service, 'verifyMembership').mockResolvedValue(undefined);
      mockPrismaService.channelMessage.findMany.mockResolvedValue(messages);

      const result = await service.getMessages(channelId, userId, { limit: 50 });

      expect(result.messages).toHaveLength(50);
      expect(result.nextCursor).toBeDefined();
    });
  });

  describe('verifyMembership', () => {
    it('should not throw if user is a member', async () => {
      mockPrismaService.channelMember.findUnique.mockResolvedValue({
        channelId: 'channel-1',
        userId: 'user-1',
      });

      await expect(service.verifyMembership('channel-1', 'user-1')).resolves.not.toThrow();
    });

    it('should throw ForbiddenException if user is not a member', async () => {
      mockPrismaService.channelMember.findUnique.mockResolvedValue(null);

      await expect(service.verifyMembership('channel-1', 'user-1')).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('isMember', () => {
    it('should return true if user is a member', async () => {
      mockPrismaService.channelMember.findUnique.mockResolvedValue({
        channelId: 'channel-1',
        userId: 'user-1',
      });

      const result = await service.isMember('channel-1', 'user-1');

      expect(result).toBe(true);
    });

    it('should return false if user is not a member', async () => {
      mockPrismaService.channelMember.findUnique.mockResolvedValue(null);

      const result = await service.isMember('channel-1', 'user-1');

      expect(result).toBe(false);
    });
  });
});
