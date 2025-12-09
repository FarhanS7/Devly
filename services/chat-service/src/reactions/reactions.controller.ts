import {
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    Param,
    Post,
    UseGuards,
} from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AddReactionDto } from './dto/add-reaction.dto';
import { ReactionsService } from './reactions.service';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class ReactionsController {
  constructor(private readonly reactionsService: ReactionsService) {}

  @Post(':id/reactions')
  async addReaction(
    @Param('id') messageId: string,
    @Body() dto: AddReactionDto,
    @GetUser('sub') userId: string,
  ) {
    // Verify user can access this message
    const canAccess = await this.reactionsService.canAccessMessage(userId, messageId);
    if (!canAccess) {
      throw new ForbiddenException('You do not have access to this message');
    }

    return this.reactionsService.addReaction(userId, messageId, dto.emoji);
  }

  @Delete(':id/reactions/:emoji')
  async removeReaction(
    @Param('id') messageId: string,
    @Param('emoji') emoji: string,
    @GetUser('sub') userId: string,
  ) {
    // Verify user can access this message
    const canAccess = await this.reactionsService.canAccessMessage(userId, messageId);
    if (!canAccess) {
      throw new ForbiddenException('You do not have access to this message');
    }

    return this.reactionsService.removeReaction(userId, messageId, emoji);
  }

  @Get(':id/reactions')
  async getReactions(
    @Param('id') messageId: string,
    @GetUser('sub') userId: string,
  ) {
    // Verify user can access this message
    const canAccess = await this.reactionsService.canAccessMessage(userId, messageId);
    if (!canAccess) {
      throw new ForbiddenException('You do not have access to this message');
    }

    return this.reactionsService.getMessageReactions(messageId);
  }
}
