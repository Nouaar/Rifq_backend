// src/modules/community/dto/update-post.dto.ts
import { IsString, IsOptional, MaxLength } from 'class-validator';

export class UpdatePostDto {
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  caption?: string;
}

