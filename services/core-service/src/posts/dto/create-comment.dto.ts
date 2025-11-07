import { IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @MaxLength(300, { message: 'Comment too long (max 300 chars)' })
  text: string;
}
