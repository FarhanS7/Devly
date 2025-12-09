import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { TeamRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AddTeamMemberDto } from './dto/add-member.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateMemberRoleDto } from './dto/update-role.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  // Helper to generate slug from team name
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  //===============================================
  // TEAM CRUD
  //===============================================

  async create(userId: string, createTeamDto: CreateTeamDto) {
    const slug = this.generateSlug(createTeamDto.name);

    // Check if slug already exists
    const existing = await this.prisma.team.findUnique({ where: { slug } });
    if (existing) {
      throw new BadRequestException('Team with this name already exists');
    }

    // Create team with owner as first member
    const team = await this.prisma.team.create({
      data: {
        ...createTeamDto,
        slug,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: TeamRole.OWNER,
          },
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, handle: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, handle: true, avatarUrl: true },
            },
          },
        },
        _count: { select: { channels: true, members: true } },
      },
    });

    return team;
  }

  async findUserTeams(userId: string) {
    return this.prisma.team.findMany({
      where: {
        members: {
          some: { userId },
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, handle: true, avatarUrl: true },
        },
        _count: { select: { channels: true, members: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(teamId: string, userId: string) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        owner: {
          select: { id: true, name: true, handle: true, avatarUrl: true },
        },
        members: {
          include: {
            user: {
              select: { id: true, name: true, handle: true, avatarUrl: true, email: true },
            },
          },
          orderBy: { joinedAt: 'asc' },
        },
        channels: {
          where: {
            OR: [
              { type: 'PUBLIC' },
              {
                AND: [
                  { type: 'PRIVATE' },
                  { members: { some: { userId } } },
                ],
              },
            ],
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    // Check if user is a member
    await this.verifyMembership(teamId, userId);

    return team;
  }

  async update(teamId: string, userId: string, updateTeamDto: UpdateTeamDto) {
    // Only owner or admin can update team
    await this.verifyAdminOrOwner(teamId, userId);

    const data: any = { ...updateTeamDto };

    // Regenerate slug if name is being updated
    if (updateTeamDto.name) {
      const newSlug = this.generateSlug(updateTeamDto.name);
      const existing = await this.prisma.team.findUnique({
        where: { slug: newSlug },
      });
      if (existing && existing.id !== teamId) {
        throw new BadRequestException('Team with this name already exists');
      }
      data.slug = newSlug;
    }

    return this.prisma.team.update({
      where: { id: teamId },
      data,
      include: {
        owner: {
          select: { id: true, name: true, handle: true, avatarUrl: true },
        },
        _count: { select: { channels: true, members: true } },
      },
    });
  }

  async remove(teamId: string, userId: string) {
    // Only owner can delete team
    await this.verifyOwner(teamId, userId);

    return this.prisma.team.delete({ where: { id: teamId } });
  }

  //===============================================
  // TEAM MEMBERS
  //===============================================

  async addMember(teamId: string, userId: string, addMemberDto: AddTeamMemberDto) {
    // Only admin or owner can add members
    await this.verifyAdminOrOwner(teamId, userId);

    // Check if user already a member
    const existing = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: addMemberDto.userId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('User is already a team member');
    }

    // Verify target user exists
    const targetUser = await this.prisma.user.findUnique({
      where: { id: addMemberDto.userId },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const member = await this.prisma.teamMember.create({
      data: {
        teamId,
        userId: addMemberDto.userId,
        role: addMemberDto.role || TeamRole.MEMBER,
      },
      include: {
        user: {
          select: { id: true, name: true, handle: true, avatarUrl: true, email: true },
        },
      },
    });

    return member;
  }

  async removeMember(teamId: string, userId: string, targetUserId: string) {
    // Only admin or owner can remove members
    await this.verifyAdminOrOwner(teamId, userId);

    const member = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Cannot remove owner
    if (member.role === TeamRole.OWNER) {
      throw new BadRequestException('Cannot remove team owner');
    }

    return this.prisma.teamMember.delete({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
    });
  }

  async updateMemberRole(
    teamId: string,
    userId: string,
    targetUserId: string,
    updateRoleDto: UpdateMemberRoleDto,
  ) {
    // Only owner can update roles
    await this.verifyOwner(teamId, userId);

    const member = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Cannot change owner role
    if (member.role === TeamRole.OWNER || updateRoleDto.role === TeamRole.OWNER) {
      throw new BadRequestException('Cannot modify owner role');
    }

    return this.prisma.teamMember.update({
      where: {
        teamId_userId: {
          teamId,
          userId: targetUserId,
        },
      },
      data: { role: updateRoleDto.role },
      include: {
        user: {
          select: { id: true, name: true, handle: true, avatarUrl: true },
        },
      },
    });
  }

  //===============================================
  // PERMISSION HELPERS
  //===============================================

  async verifyMembership(teamId: string, userId: string): Promise<void> {
    const member = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this team');
    }
  }

  async verifyAdminOrOwner(teamId: string, userId: string): Promise<void> {
    const member = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
    });

    if (!member || (member.role !== TeamRole.OWNER && member.role !== TeamRole.ADMIN)) {
      throw new ForbiddenException('Only team admins or owner can perform this action');
    }
  }

  async verifyOwner(teamId: string, userId: string): Promise<void> {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      select: { ownerId: true },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (team.ownerId !== userId) {
      throw new ForbiddenException('Only team owner can perform this action');
    }
  }

  async getMemberRole(teamId: string, userId: string): Promise<TeamRole | null> {
    const member = await this.prisma.teamMember.findUnique({
      where: {
        teamId_userId: {
          teamId,
          userId,
        },
      },
      select: { role: true },
    });

    return member?.role || null;
  }
}
