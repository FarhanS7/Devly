import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({
    example: 'Awesome post! Loved the code snippet.',
    description: 'Text content of the comment.',
    maxLength: 300,
  })
  @IsString()
  @MaxLength(300)
  content: string;

  @ApiProperty({
    example: 'f1f4e9a3-8c8d-4b9b-9e3a-9e8c0a1a6d21',
    description: 'Optional parent comment id (for replies).',
    required: false,
  })
  @IsOptional()
  @IsString()
  parentId?: string;
}
