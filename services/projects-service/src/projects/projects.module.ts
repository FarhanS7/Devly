import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PrismaService } from '../prisma/prisma.service';

// Controllers
import { ActivityController } from './activity.controller';
import { FilesController } from './files.controller';
import { MembersController } from './members.controller';
import { NotesController } from './notes.controller';
import { ProjectsController } from './projects.controller';
import { StatsController } from './stats.controller';

// Services
import { ActivityService } from './services/activity.service';
import { FilesService } from './services/files.service';
import { MembersService } from './services/members.service';
import { NotesService } from './services/notes.service';
import { ProjectsService } from './services/projects.service';
import { StatsService } from './services/stats.service';

// WebSocket & Events
import { EventsService } from '../events/events.service';
import { ProjectsGateway } from './projects.gateway';

@Module({
  imports: [HttpModule, AuthModule],
  controllers: [
    ProjectsController,
    MembersController,
    NotesController,
    FilesController,
    ActivityController,
    StatsController,
  ],
  providers: [
    PrismaService,
    ProjectsService,
    MembersService,
    NotesService,
    FilesService,
    ActivityService,
    StatsService,
    ProjectsGateway,
    EventsService,
  ],
  exports: [ProjectsService, EventsService],
})
export class ProjectsModule {}

