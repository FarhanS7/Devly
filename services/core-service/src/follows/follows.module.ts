import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FollowsController } from './follows.controllers';
import { FollowsService } from './follows.service';

@Module({
  controllers: [FollowsController],
  providers: [FollowsService, PrismaService],
  exports: [FollowsService],
})
export class FollowsModule {}
