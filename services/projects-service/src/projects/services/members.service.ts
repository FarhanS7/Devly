import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EventsService } from '../../events/events.service';
import { PrismaService } from '../../prisma/prisma.service';
import { AddMemberDto, UpdateMemberRoleDto } from '../dto/member.dto';

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  async addMember(userId: string, projectId: string, dto: AddMemberDto) {
    // Verify project exists and user is owner
    await this.verifyProjectOwner(userId, projectId);

    // Check if user is already a member
    const existing = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: dto.userId } },
    });

    if (existing) {
      throw new ForbiddenException('User is already a member of this project');
    }

    this.logger.log(`Adding member ${dto.userId} to project ${projectId}`);

    const member = await this.prisma.projectMember.create({
      data: {
        projectId,
        userId: dto.userId,
        role: dto.role || 'VIEWER',
      },
      include: {
        user: { select: { id: true, name: true, handle: true, avatarUrl: true } },
      },
    });

    // Log activity
    await this.logActivity(projectId, userId, 'MEMBER_ADDED', { memberId: dto.userId, role: dto.role });

    // Emit real-time event and notification
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    await this.eventsService.emitMemberAdded({
      projectId,
      projectName: project?.name,
      memberId: dto.userId,
      memberName: member.user?.name,
      actorId: userId,
      role: dto.role || 'VIEWER',
    });

    return member;
  }

  async getMembers(userId: string, projectId: string) {
    await this.verifyProjectAccess(userId, projectId);

    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, name: true, handle: true, avatarUrl: true } },
      },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async updateMemberRole(userId: string, projectId: string, memberId: string, dto: UpdateMemberRoleDto) {
    await this.verifyProjectOwner(userId, projectId);

    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: memberId } },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    // Cannot change owner's role
    if (member.role === 'OWNER') {
      throw new ForbiddenException('Cannot change the owner role');
    }

    this.logger.log(`Updating member ${memberId} role to ${dto.role}`);

    const updated = await this.prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId: memberId } },
      data: { role: dto.role },
      include: {
        user: { select: { id: true, name: true, handle: true, avatarUrl: true } },
      },
    });

    await this.logActivity(projectId, userId, 'MEMBER_ROLE_CHANGED', { memberId, newRole: dto.role });

    // Emit real-time event
    this.eventsService.emitMemberRoleUpdated({
      projectId,
      memberId,
      memberName: updated.user?.name,
      actorId: userId,
      role: dto.role,
    });

    return updated;
  }

  async removeMember(userId: string, projectId: string, memberId: string) {
    await this.verifyProjectOwner(userId, projectId);

    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: memberId } },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === 'OWNER') {
      throw new ForbiddenException('Cannot remove the project owner');
    }

    this.logger.log(`Removing member ${memberId} from project ${projectId}`);

    await this.prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId: memberId } },
    });

    await this.logActivity(projectId, userId, 'MEMBER_REMOVED', { memberId });

    // Emit real-time event
    this.eventsService.emitMemberRemoved({
      projectId,
      memberId,
      actorId: userId,
    });

    return { success: true };
  }

  // Helpers
  private async verifyProjectOwner(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.ownerId !== userId) {
      throw new ForbiddenException('Only the project owner can perform this action');
    }
    return project;
  }

  private async verifyProjectAccess(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    
    // Owner always has access
    if (project.ownerId === userId) return project;

    // Check if user is a member
    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!member) {
      throw new ForbiddenException('You do not have access to this project');
    }

    return project;
  }

  private async logActivity(projectId: string, userId: string, action: string, metadata: any) {
    await this.prisma.activityLog.create({
      data: { projectId, userId, action, metadata },
    });
  }
}
