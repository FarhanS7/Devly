import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class FollowDto {
  @ApiProperty({
    example: '7c1dc8e3-973f-4314-8b36-b18a7e0a6f46',
    description: 'The ID of the user to follow or unfollow.',
  })
  @IsString()
  targetUserId: string;
}
