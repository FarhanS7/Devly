import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AddMemberDto, UpdateMemberRoleDto } from './dto/member.dto';
import { MembersService } from './services/members.service';

@Controller('projects/:projectId/members')
@UseGuards(JwtAuthGuard)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Post()
  addMember(
    @GetUser('id') userId: string,
    @Param('projectId') projectId: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.membersService.addMember(userId, projectId, dto);
  }

  @Get()
  getMembers(@GetUser('id') userId: string, @Param('projectId') projectId: string) {
    return this.membersService.getMembers(userId, projectId);
  }

  @Patch(':memberId')
  updateMemberRole(
    @GetUser('id') userId: string,
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.membersService.updateMemberRole(userId, projectId, memberId, dto);
  }

  @Delete(':memberId')
  removeMember(
    @GetUser('id') userId: string,
    @Param('projectId') projectId: string,
    @Param('memberId') memberId: string,
  ) {
    return this.membersService.removeMember(userId, projectId, memberId);
  }
}
