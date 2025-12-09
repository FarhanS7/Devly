import { ChannelsService } from '../channels/channels.service';
import { CreateChannelDto } from '../channels/dto/create-channel.dto';
import { AddTeamMemberDto } from './dto/add-member.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateMemberRoleDto } from './dto/update-role.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamsService } from './teams.service';
export declare class TeamsController {
    private readonly teamsService;
    private readonly channelsService;
    constructor(teamsService: TeamsService, channelsService: ChannelsService);
    create(req: any, createTeamDto: CreateTeamDto): Promise<{
        _count: {
            members: number;
            channels: number;
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
            userId: string;
            teamId: string;
            joinedAt: Date;
            role: import(".prisma/client").$Enums.TeamRole;
        })[];
        owner: {
            id: string;
            handle: string;
            name: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        avatarUrl: string | null;
        slug: string;
        description: string | null;
        ownerId: string;
    }>;
    findAll(req: any): Promise<({
        _count: {
            members: number;
            channels: number;
        };
        owner: {
            id: string;
            handle: string;
            name: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        avatarUrl: string | null;
        slug: string;
        description: string | null;
        ownerId: string;
    })[]>;
    findOne(id: string, req: any): Promise<{
        members: ({
            user: {
                id: string;
                email: string;
                handle: string;
                name: string;
                avatarUrl: string;
            };
        } & {
            id: string;
            userId: string;
            teamId: string;
            joinedAt: Date;
            role: import(".prisma/client").$Enums.TeamRole;
        })[];
        owner: {
            id: string;
            handle: string;
            name: string;
            avatarUrl: string;
        };
        channels: {
            type: import(".prisma/client").$Enums.ChannelType;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            name: string;
            teamId: string;
            slug: string;
            description: string | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        avatarUrl: string | null;
        slug: string;
        description: string | null;
        ownerId: string;
    }>;
    update(id: string, req: any, updateTeamDto: UpdateTeamDto): Promise<{
        _count: {
            members: number;
            channels: number;
        };
        owner: {
            id: string;
            handle: string;
            name: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        avatarUrl: string | null;
        slug: string;
        description: string | null;
        ownerId: string;
    }>;
    remove(id: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        avatarUrl: string | null;
        slug: string;
        description: string | null;
        ownerId: string;
    }>;
    addMember(id: string, req: any, addMemberDto: AddTeamMemberDto): Promise<{
        user: {
            id: string;
            email: string;
            handle: string;
            name: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        userId: string;
        teamId: string;
        joinedAt: Date;
        role: import(".prisma/client").$Enums.TeamRole;
    }>;
    removeMember(id: string, userId: string, req: any): Promise<{
        id: string;
        userId: string;
        teamId: string;
        joinedAt: Date;
        role: import(".prisma/client").$Enums.TeamRole;
    }>;
    updateMemberRole(id: string, userId: string, req: any, updateRoleDto: UpdateMemberRoleDto): Promise<{
        user: {
            id: string;
            handle: string;
            name: string;
            avatarUrl: string;
        };
    } & {
        id: string;
        userId: string;
        teamId: string;
        joinedAt: Date;
        role: import(".prisma/client").$Enums.TeamRole;
    }>;
    createChannel(teamId: string, req: any, createChannelDto: CreateChannelDto): Promise<{
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
    getTeamChannels(teamId: string, req: any): Promise<({
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
}
