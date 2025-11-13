import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'alice@example.com',
    description: 'Email address of the new user.',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'alice',
    description: 'Unique handle/username of the new user.',
  })
  @IsNotEmpty()
  handle!: string;

  @ApiProperty({
    example: 'supersecure123',
    description: 'Password for the new user account (min 6 chars).',
  })
  @MinLength(6)
  password!: string;
}
