import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCommentDto {
  @ApiProperty({
    example: 'Small edit to fix a typo.',
    description: 'Updated text content of the comment.',
    required: false,
    maxLength: 300,
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  content?: string;
}
