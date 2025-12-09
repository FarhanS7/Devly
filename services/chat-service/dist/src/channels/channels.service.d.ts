import { PrismaService } from '../prisma/prisma.service';
import { TeamsService } from '../teams/teams.service';
import { AddChannelMemberDto } from './dto/add-member.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
export declare class ChannelsService {
    private prisma;
    private teamsService;
    constructor(prisma: PrismaService, teamsService: TeamsService);
    private generateSlug;
    create(teamId: string, userId: string, createChannelDto: CreateChannelDto): Promise<{
        team: {
            id: string;
            name: string;
            slug: string;
        };
        _count: {
            messages: number;
        };
        members: ({
            user: {
                id: string;
                handle: string;
                name: string;
                avatarUrl: string;
            };
        } & {
            id: string;
            channelId: string;
            userId: string;
            joinedAt: Date;
            lastReadMessageId: string | null;
        })[];
    } & {
        type: import(".prisma/client").$Enums.ChannelType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        teamId: string;
        slug: string;
        description: string | null;
    }>;
    findTeamChannels(teamId: string, userId: string): Promise<({
        _count: {
            messages: number;
            members: number;
        };
    } & {
        type: import(".prisma/client").$Enums.ChannelType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        teamId: string;
        slug: string;
        description: string | null;
    })[]>;
    findOne(channelId: string, userId: string): Promise<{
        team: {
            id: string;
            name: string;
            slug: string;
        };
        _count: {
            messages: number;
        };
        members: ({
            user: {
                id: string;
                handle: string;
                name: string;
                avatarUrl: string;
            };
        } & {
            id: string;
            channelId: string;
            userId: string;
            joinedAt: Date;
            lastReadMessageId: string | null;
        })[];
    } & {
        type: import(".prisma/client").$Enums.ChannelType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        teamId: string;
        slug: string;
        description: string | null;
    }>;
    update(channelId: string, userId: string, updateChannelDto: UpdateChannelDto): Promise<{
        _count: {
            messages: number;
            members: number;
        };
    } & {
        type: import(".prisma/client").$Enums.ChannelType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        teamId: string;
        slug: string;
        description: string | null;
    }>;
    remove(channelId: string, userId: string): Promise<{
        type: import(".prisma/client").$Enums.ChannelType;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        teamId: string;
        slug: string;
        description: string | null;
    }>;
    addMember(channelId: string, userId: string, addMemberDto: AddChannelMemberDto): Promise<{
        user: {
            id: string;
            handle: string;
            name: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        channelId: string;
        userId: string;
        joinedAt: Date;
        lastReadMessageId: string | null;
    }>;
    removeMember(channelId: string, userId: string, targetUserId: string): Promise<{
        id: string;
        channelId: string;
        userId: string;
        joinedAt: Date;
        lastReadMessageId: string | null;
    }>;
    getMessages(channelId: string, userId: string, options?: {
        limit?: number;
        cursor?: string;
    }): Promise<{
        messages: ({
            sender: {
                id: string;
                handle: string;
                name: string;
                avatarUrl: string;
            };
            _count: {
                replies: number;
                reactions: number;
            };
        } & {
            id: string;
            channelId: string;
            senderId: string;
            content: string | null;
            attachmentUrl: string | null;
            createdAt: Date;
            updatedAt: Date;
            parentId: string | null;
        })[];
        nextCursor: string;
    }>;
    verifyMembership(channelId: string, userId: string): Promise<void>;
    isMember(channelId: string, userId: string): Promise<boolean>;
}
