import { IsString } from 'class-validator';

export class LikePostDto {
  @IsString()
  postId: string;
}
