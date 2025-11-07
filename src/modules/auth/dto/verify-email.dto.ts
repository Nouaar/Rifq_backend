// src/modules/auth/dto/verify-email.dto.ts
import { IsEmail, IsString, Length } from 'class-validator';

export class VerifyEmailDto {
  @IsEmail()
  email: string;

  @IsString()
  @Length(4, 6)
  code: string;
}
