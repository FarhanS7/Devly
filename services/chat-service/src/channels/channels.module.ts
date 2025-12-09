import { forwardRef, Module } from '@nestjs/common';
import { ChatModule } from '../chat/chat.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TeamsModule } from '../teams/teams.module';
import { ChannelsController } from './channels.controller';
import { ChannelsService } from './channels.service';
import { ThreadsController } from './threads.controller';

@Module({
  imports: [PrismaModule, TeamsModule, forwardRef(() => ChatModule)],
  controllers: [ChannelsController, ThreadsController],
  providers: [ChannelsService],
  exports: [ChannelsService],
})
export class ChannelsModule {}
