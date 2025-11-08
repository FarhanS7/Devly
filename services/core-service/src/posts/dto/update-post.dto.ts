import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdatePostDto {
  @ApiProperty({
    example: 'Updated my project details!',
    description: 'Updated text content of the post.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  content?: string;

  @ApiProperty({
    example: 'https://example.com/new-image.png',
    description: 'Optional updated image URL.',
    required: false,
  })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiProperty({
    example: 'console.log("Updated Code");',
    description: 'Optional updated code snippet.',
    required: false,
  })
  @IsOptional()
  @IsString()
  codeSnippet?: string;
}
