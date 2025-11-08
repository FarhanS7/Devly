import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.refresh123abc',
    description: 'The refresh token to generate a new access token.',
  })
  @IsNotEmpty()
  refreshToken: string;
}
