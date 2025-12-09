import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
    Request,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { ChannelsService } from './channels.service';
import { AddChannelMemberDto } from './dto/add-member.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';

@Controller('channels')
@UseGuards(JwtAuthGuard)
export class ChannelsController {
  constructor(private readonly channelsService: ChannelsService) {}

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.channelsService.findOne(id, req.user.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateChannelDto: UpdateChannelDto,
  ) {
    return this.channelsService.update(id, req.user.sub, updateChannelDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.channelsService.remove(id, req.user.sub);
  }

  // ===============================================
  // CHANNEL MEMBERS
  // ===============================================

  @Post(':id/members')
  addMember(
    @Param('id') id: string,
    @Request() req: any,
    @Body() addMemberDto: AddChannelMemberDto,
  ) {
    return this.channelsService.addMember(id, req.user.sub, addMemberDto);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.channelsService.removeMember(id, req.user.sub, userId);
  }

  // ===============================================
  // MESSAGES
  // ===============================================

  @Get(':id/messages')
  getMessages(
    @Param('id') id: string,
    @Request() req: any,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    return this.channelsService.getMessages(id, req.user.sub, {
      limit: limit ? parseInt(limit, 10) : undefined,
      cursor,
    });
  }
}
