import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { FilesService } from './services/files.service';

@Controller('projects/:projectId/files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post()
  uploadFile(
    @GetUser('id') userId: string,
    @Param('projectId') projectId: string,
    @Body() dto: { fileName: string; url: string; size: number; mimeType: string },
  ) {
    return this.filesService.uploadFile(userId, projectId, dto);
  }

  @Get()
  getFiles(@GetUser('id') userId: string, @Param('projectId') projectId: string) {
    return this.filesService.getFiles(userId, projectId);
  }

  @Delete(':fileId')
  deleteFile(
    @GetUser('id') userId: string,
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
  ) {
    return this.filesService.deleteFile(userId, projectId, fileId);
  }
}
