import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class LogoutDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc1234refresh',
    description: 'Refresh token that needs to be invalidated.',
  })
  @IsString()
  @MinLength(10)
  refreshToken!: string;
}
