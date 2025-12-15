// src/modules/community/dto/add-comment.dto.ts
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AddCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  text: string;
}
