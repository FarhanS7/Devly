import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class LikePostDto {
  @ApiProperty({
    example: 'c2f98443-1e8a-4e3f-bb4c-efb43a0b9b2e',
    description: 'ID of the post being liked.',
  })
  @IsString()
  postId: string;
}
