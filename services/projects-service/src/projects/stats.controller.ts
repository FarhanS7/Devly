import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { StatsService } from './services/stats.service';

@Controller('projects/:projectId/stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  getStats(@GetUser('id') userId: string, @Param('projectId') projectId: string) {
    return this.statsService.getProjectStats(userId, projectId);
  }
}
