// src/modules/community/dto/react-post.dto.ts
import { IsString, IsIn } from 'class-validator';

export class ReactPostDto {
  @IsString()
  @IsIn(['like', 'love', 'haha', 'angry', 'cry'])
  reactionType: string;
}
