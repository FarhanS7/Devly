import { TeamRole } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class AddTeamMemberDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(TeamRole)
  role?: TeamRole;
}
