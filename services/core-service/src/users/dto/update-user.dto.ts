import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateUserDto {
  @ApiProperty({
    example: 'Alice Johnson',
    description: 'Full display name of the user.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string;

  @ApiProperty({
    example: 'Full-stack developer and open-source enthusiast.',
    description: 'Short bio or description.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  bio?: string;

  @ApiProperty({
    example: 'San Francisco, CA',
    description: 'User location or city.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  location?: string;

  @ApiProperty({
    example: 'alice_dev',
    description: 'Unique handle for the user (optional if unchanged).',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  handle?: string;
}
