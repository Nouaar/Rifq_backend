// src/modules/auth/dto/register.dto.ts
import { IsEmail, IsString, IsOptional, IsNotEmpty } from 'class-validator';
import { UserRole } from '../../users/dto/create-user.dto';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  password: string;

  @IsOptional()
  role?: UserRole;
}
