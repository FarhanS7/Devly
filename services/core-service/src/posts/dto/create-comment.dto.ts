import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: 'Awesome post! Loved the code snippet.',
    description: 'Text content of the comment.',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  text: string;
}
