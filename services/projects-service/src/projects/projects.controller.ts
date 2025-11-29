import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { ProjectsService } from './services/projects.service';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  // ---------------- PROJECTS ----------------

  @Post()
  createProject(@GetUser('id') userId: string, @Body() dto: CreateProjectDto) {
    return this.projectsService.createProject(userId, dto);
  }

  @Get()
  getMyProjects(
    @GetUser('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    return this.projectsService.getMyProjects(userId, {
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get(':id')
  getProjectById(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.projectsService.getProjectById(userId, id);
  }

  @Patch(':id')
  updateProject(
    @GetUser('id') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.updateProject(userId, id, dto);
  }

  @Delete(':id')
  deleteProject(@GetUser('id') userId: string, @Param('id') id: string) {
    return this.projectsService.deleteProject(userId, id);
  }

  // ---------------- TASKS ----------------

  @Post(':projectId/tasks')
  createTask(
    @GetUser('id') userId: string,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.projectsService.createTask(userId, projectId, dto);
  }

  @Get('/tasks/assigned')
  getAssignedTasks(
    @GetUser('id') userId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.projectsService.getAssignedTasks(userId, {
      cursor,
      limit: limit ? parseInt(limit, 10) : undefined,
      status: status as any,
    });
  }

  @Get('/tasks/:taskId')
  getTaskById(@GetUser('id') userId: string, @Param('taskId') taskId: string) {
    return this.projectsService.getTaskById(userId, taskId);
  }

  @Patch('/tasks/:taskId')
  updateTask(
    @GetUser('id') userId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.projectsService.updateTask(userId, taskId, dto);
  }

  @Delete('/tasks/:taskId')
  deleteTask(@GetUser('id') userId: string, @Param('taskId') taskId: string) {
    return this.projectsService.deleteTask(userId, taskId);
  }
}
