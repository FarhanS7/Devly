import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class AddReactionDto {
  @IsNotEmpty()
  @IsString()
  @Matches(/^[\p{Emoji}]+$/u, {
    message: 'emoji must be a valid emoji character',
  })
  emoji: string;
}
