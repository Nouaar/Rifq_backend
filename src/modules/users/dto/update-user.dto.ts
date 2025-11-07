// src/modules/users/dto/update-user.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsArray, IsString } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  // Optionally allow updating pets (array of IDs)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pets?: string[];

  // Optionally allow changing profile image
  @IsOptional()
  @IsString()
  profileImage?: string;
}
