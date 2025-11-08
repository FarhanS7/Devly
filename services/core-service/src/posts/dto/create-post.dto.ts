import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    example: 'Just deployed my new project 🚀',
    description: 'Main content or text of the post.',
    maxLength: 500,
  })
  @IsString()
  @MaxLength(500)
  content: string;

  @ApiProperty({
    example: 'https://example.com/image.png',
    description: 'Optional image attached to the post.',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    example: 'console.log("Hello World!");',
    description: 'Optional code snippet shared in the post.',
    required: false,
  })
  @IsOptional()
  @IsString()
  codeSnippet?: string;
}
