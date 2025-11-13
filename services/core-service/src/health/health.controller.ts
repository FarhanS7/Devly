import { Controller, Get } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
// import { PrismaService } from '../../../../shared/prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async ok() {
    // lightweight probe that also validates DB connectivity
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
