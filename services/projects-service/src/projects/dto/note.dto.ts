import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  content?: any; // JSON content from TipTap
}

export class UpdateNoteDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsOptional()
  content?: any;
}
