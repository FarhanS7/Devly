import { TeamRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddTeamMemberDto } from './dto/add-member.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateMemberRoleDto } from './dto/update-role.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
export declare class TeamsService {
    private prisma;
    constructor(prisma: PrismaService);
    private generateSlug;
    create(userId: string, createTeamDto: CreateTeamDto): Promise<{
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
    findUserTeams(userId: string): Promise<({
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
    findOne(teamId: string, userId: string): Promise<{
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
    update(teamId: string, userId: string, updateTeamDto: UpdateTeamDto): Promise<{
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
    remove(teamId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        avatarUrl: string | null;
        slug: string;
        description: string | null;
        ownerId: string;
    }>;
    addMember(teamId: string, userId: string, addMemberDto: AddTeamMemberDto): Promise<{
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
    removeMember(teamId: string, userId: string, targetUserId: string): Promise<{
        id: string;
        userId: string;
        teamId: string;
        joinedAt: Date;
        role: import(".prisma/client").$Enums.TeamRole;
    }>;
    updateMemberRole(teamId: string, userId: string, targetUserId: string, updateRoleDto: UpdateMemberRoleDto): Promise<{
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
    verifyMembership(teamId: string, userId: string): Promise<void>;
    verifyAdminOrOwner(teamId: string, userId: string): Promise<void>;
    verifyOwner(teamId: string, userId: string): Promise<void>;
    getMemberRole(teamId: string, userId: string): Promise<TeamRole | null>;
}
