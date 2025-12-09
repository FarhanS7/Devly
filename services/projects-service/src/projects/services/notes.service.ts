import { ForbiddenException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateNoteDto, UpdateNoteDto } from '../dto/note.dto';

@Injectable()
export class NotesService {
  private readonly logger = new Logger(NotesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createNote(userId: string, projectId: string, dto: CreateNoteDto) {
    await this.verifyProjectAccess(userId, projectId);

    this.logger.log(`Creating note in project ${projectId}: ${dto.title}`);

    const note = await this.prisma.projectNote.create({
      data: {
        projectId,
        title: dto.title,
        content: dto.content || {},
        createdBy: userId,
      },
      include: {
        author: { select: { id: true, name: true, handle: true, avatarUrl: true } },
      },
    });

    await this.logActivity(projectId, userId, 'NOTE_CREATED', { noteId: note.id, title: dto.title });

    return note;
  }

  async getNotes(userId: string, projectId: string) {
    await this.verifyProjectAccess(userId, projectId);

    return this.prisma.projectNote.findMany({
      where: { projectId },
      include: {
        author: { select: { id: true, name: true, handle: true, avatarUrl: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getNote(userId: string, projectId: string, noteId: string) {
    await this.verifyProjectAccess(userId, projectId);

    const note = await this.prisma.projectNote.findUnique({
      where: { id: noteId },
      include: {
        author: { select: { id: true, name: true, handle: true, avatarUrl: true } },
      },
    });

    if (!note || note.projectId !== projectId) {
      throw new NotFoundException('Note not found');
    }

    return note;
  }

  async updateNote(userId: string, projectId: string, noteId: string, dto: UpdateNoteDto) {
    await this.verifyProjectAccess(userId, projectId, true); // Require editor

    const note = await this.prisma.projectNote.findUnique({ where: { id: noteId } });
    if (!note || note.projectId !== projectId) {
      throw new NotFoundException('Note not found');
    }

    this.logger.log(`Updating note ${noteId}`);

    const updated = await this.prisma.projectNote.update({
      where: { id: noteId },
      data: dto,
      include: {
        author: { select: { id: true, name: true, handle: true, avatarUrl: true } },
      },
    });

    await this.logActivity(projectId, userId, 'NOTE_UPDATED', { noteId });

    return updated;
  }

  async deleteNote(userId: string, projectId: string, noteId: string) {
    await this.verifyProjectAccess(userId, projectId, true);

    const note = await this.prisma.projectNote.findUnique({ where: { id: noteId } });
    if (!note || note.projectId !== projectId) {
      throw new NotFoundException('Note not found');
    }

    this.logger.log(`Deleting note ${noteId}`);

    await this.prisma.projectNote.delete({ where: { id: noteId } });

    await this.logActivity(projectId, userId, 'NOTE_DELETED', { noteId });

    return { success: true };
  }

  // Helpers
  private async verifyProjectAccess(userId: string, projectId: string, requireEditor = false) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.ownerId === userId) return project;

    const member = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
    });

    if (!member) {
      throw new ForbiddenException('You do not have access to this project');
    }

    if (requireEditor && member.role === 'VIEWER') {
      throw new ForbiddenException('Viewers cannot edit notes');
    }

    return project;
  }

  private async logActivity(projectId: string, userId: string, action: string, metadata: any) {
    await this.prisma.activityLog.create({
      data: { projectId, userId, action, metadata },
    });
  }
}
