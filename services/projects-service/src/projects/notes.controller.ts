import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';
import { NotesService } from './services/notes.service';

@Controller('projects/:projectId/notes')
@UseGuards(JwtAuthGuard)
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  createNote(
    @GetUser('id') userId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateNoteDto,
  ) {
    return this.notesService.createNote(userId, projectId, dto);
  }

  @Get()
  getNotes(@GetUser('id') userId: string, @Param('projectId') projectId: string) {
    return this.notesService.getNotes(userId, projectId);
  }

  @Get(':noteId')
  getNote(
    @GetUser('id') userId: string,
    @Param('projectId') projectId: string,
    @Param('noteId') noteId: string,
  ) {
    return this.notesService.getNote(userId, projectId, noteId);
  }

  @Patch(':noteId')
  updateNote(
    @GetUser('id') userId: string,
    @Param('projectId') projectId: string,
    @Param('noteId') noteId: string,
    @Body() dto: UpdateNoteDto,
  ) {
    return this.notesService.updateNote(userId, projectId, noteId, dto);
  }

  @Delete(':noteId')
  deleteNote(
    @GetUser('id') userId: string,
    @Param('projectId') projectId: string,
    @Param('noteId') noteId: string,
  ) {
    return this.notesService.deleteNote(userId, projectId, noteId);
  }
}
