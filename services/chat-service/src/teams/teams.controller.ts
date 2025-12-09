import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Request,
    UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { ChannelsService } from '../channels/channels.service';
import { CreateChannelDto } from '../channels/dto/create-channel.dto';
import { AddTeamMemberDto } from './dto/add-member.dto';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateMemberRoleDto } from './dto/update-role.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { TeamsService } from './teams.service';

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(
    private readonly teamsService: TeamsService,
    private readonly channelsService: ChannelsService,
  ) {}

  @Post()
  create(@Request() req: any, @Body() createTeamDto: CreateTeamDto) {
    return this.teamsService.create(req.user.sub, createTeamDto);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.teamsService.findUserTeams(req.user.sub);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.teamsService.findOne(id, req.user.sub);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() updateTeamDto: UpdateTeamDto,
  ) {
    return this.teamsService.update(id, req.user.sub, updateTeamDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: any) {
    return this.teamsService.remove(id, req.user.sub);
  }

  // ===============================================
  // TEAM MEMBERS
  // ===============================================

  @Post(':id/members')
  addMember(
    @Param('id') id: string,
    @Request() req: any,
    @Body() addMemberDto: AddTeamMemberDto,
  ) {
    return this.teamsService.addMember(id, req.user.sub, addMemberDto);
  }

  @Delete(':id/members/:userId')
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req: any,
  ) {
    return this.teamsService.removeMember(id, req.user.sub, userId);
  }

  @Patch(':id/members/:userId/role')
  updateMemberRole(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Request() req: any,
    @Body() updateRoleDto: UpdateMemberRoleDto,
  ) {
    return this.teamsService.updateMemberRole(id, req.user.sub, userId, updateRoleDto);
  }

  // ===============================================
  // TEAM CHANNELS
  // ===============================================

  @Post(':id/channels')
  createChannel(
    @Param('id') teamId: string,
    @Request() req: any,
    @Body() createChannelDto: CreateChannelDto,
  ) {
    return this.channelsService.create(teamId, req.user.sub, createChannelDto);
  }

  @Get(':id/channels')
  getTeamChannels(@Param('id') teamId: string, @Request() req: any) {
    return this.channelsService.findTeamChannels(teamId, req.user.sub);
  }
}

