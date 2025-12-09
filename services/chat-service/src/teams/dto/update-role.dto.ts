import { TeamRole } from '@prisma/client';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsEnum(TeamRole)
  @IsNotEmpty()
  role: TeamRole;
}
