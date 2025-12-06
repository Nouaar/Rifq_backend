// src/modules/community/dto/create-post.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class CreatePostDto {
  @IsString()
  petImage: string;

  @IsString()
  @IsOptional()
  caption?: string;
}
