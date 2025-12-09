import { IsNotEmpty, IsString } from 'class-validator';

export class AddChannelMemberDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
