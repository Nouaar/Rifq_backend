// src/modules/users/dto/create-user.dto.ts
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export enum UserRole {
  OWNER = 'owner',
  VET = 'vet',
  ADMIN = 'admin',
  SITTER = 'sitter',
}

export class CreateUserDto {
  // Common user fields
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string;

  // Role & account state
  @IsOptional()
  @IsEnum(UserRole, {
    message: 'Role must be one of: owner, vet, admin, sitter',
  })
  role?: UserRole = UserRole.OWNER;

  @IsOptional()
  @IsNumber()
  balance?: number = 0;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean = false;

  // Verification & security
  @IsOptional()
  @IsString()
  verificationCode?: string;

  @IsOptional()
  @IsDate()
  verificationCodeExpires?: Date;

  @IsOptional()
  @IsString()
  refreshToken?: string;

  @IsOptional()
  @IsString()
  hashedRefreshToken?: string;

  // Vet-specific fields (optional)
  @IsOptional()
  @IsString()
  specialization?: string;

  @IsOptional()
  @IsString()
  clinicName?: string;

  @IsOptional()
  @IsString()
  clinicAddress?: string;

  @IsOptional()
  @IsString()
  Location?: string;

  @IsOptional()
  @IsString()
  licenseNumber?: string;

  @IsOptional()
  @IsNumber()
  yearsOfExperience?: number;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @IsString()
  profileImage?: string;
}
