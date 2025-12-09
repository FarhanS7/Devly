import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { ActivityService } from './services/activity.service';

@Controller('projects/:projectId/activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  getActivity(
    @GetUser('id') userId: string,
    @Param('projectId') projectId: string,
    @Query('limit') limit?: string,
  ) {
    return this.activityService.getProjectActivity(
      userId,
      projectId,
      limit ? parseInt(limit, 10) : undefined,
    );
  }
}
