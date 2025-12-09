import {
    Controller,
    DefaultValuePipe,
    ForbiddenException,
    Get,
    Param,
    ParseIntPipe,
    Query,
    UseGuards
} from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { ChatService } from '../chat/chat.service';
import { ChannelsService } from './channels.service';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class ThreadsController {
  constructor(
    private readonly chatService: ChatService,
    private readonly channelsService: ChannelsService,
  ) {}

  @Get(':id/replies')
  async getThreadReplies(
    @Param('id') messageId: string,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
    @Query('take', new DefaultValuePipe(50), ParseIntPipe) take: number,
    @GetUser('sub') userId: string,
  ) {
    // Verify user can access the message
    const message = await this.chatService.prisma.channelMessage.findUnique({
      where: { id: messageId },
      select: { channelId: true },
    });

    if (!message) {
      throw new ForbiddenException('Message not found');
    }

    const isMember = await this.channelsService.isMember(message.channelId, userId);
    if (!isMember) {
      throw new ForbiddenException('You do not have access to this message');
    }

    return this.chatService.getThreadReplies(messageId, { skip, take });
  }

  @Get(':id/thread')
  async getFullThread(
    @Param('id') messageId: string,
    @GetUser('sub') userId: string,
  ) {
    // Verify user can access the message
    const message = await this.chatService.prisma.channelMessage.findUnique({
      where: { id: messageId },
      select: { channelId: true },
    });

    if (!message) {
      throw new ForbiddenException('Message not found');
    }

    const isMember = await this.channelsService.isMember(message.channelId, userId);
    if (!isMember) {
      throw new ForbiddenException('You do not have access to this message');
    }

    return this.chatService.getFullThread(messageId);
  }

  @Get(':id/participants')
  async getThreadParticipants(
    @Param('id') messageId: string,
    @GetUser('sub') userId: string,
  ) {
    // Verify user can access the message
    const message = await this.chatService.prisma.channelMessage.findUnique({
      where: { id: messageId },
      select: { channelId: true },
    });

    if (!message) {
      throw new ForbiddenException('Message not found');
    }

    const isMember = await this.channelsService.isMember(message.channelId, userId);
    if (!isMember) {
      throw new ForbiddenException('You do not have access to this message');
    }

    return this.chatService.getThreadParticipants(messageId);
  }

  @Get(':id/summary')
  async getThreadSummary(
    @Param('id') messageId: string,
    @GetUser('sub') userId: string,
  ) {
    // Verify user can access the message
    const message = await this.chatService.prisma.channelMessage.findUnique({
      where: { id: messageId },
      select: { channelId: true },
    });

    if (!message) {
      throw new ForbiddenException('Message not found');
    }

    const isMember = await this.channelsService.isMember(message.channelId, userId);
    if (!isMember) {
      throw new ForbiddenException('You do not have access to this message');
    }

    return this.chatService.getThreadSummary(messageId);
  }
}
