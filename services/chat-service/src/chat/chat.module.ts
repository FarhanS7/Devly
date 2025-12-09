import { forwardRef, Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChannelsModule } from '../channels/channels.module';
import { PresenceModule } from '../presence/presence.module';
import { PrismaService } from '../prisma/prisma.service';
import { ReactionsModule } from '../reactions/reactions.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';

@Module({
  imports: [AuthModule, forwardRef(() => ChannelsModule), PresenceModule, ReactionsModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, PrismaService],
  exports: [ChatService],
})
export class ChatModule {}
