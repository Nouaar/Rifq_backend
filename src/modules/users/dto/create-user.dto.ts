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
} from 'class-validator';

export enum UserRole {
  OWNER = 'owner',
  VET = 'vet',
  SITTER = 'sitter',
}

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  name: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsEnum(UserRole, {
    message: 'Role must be one of: owner, vet, sitter',
  })
  role?: UserRole = UserRole.OWNER;

  @IsOptional()
  @IsNumber()
  balance?: number = 0;

  @IsOptional()
  @IsBoolean()
  isVerified?: boolean = false;

  @IsOptional()
  @IsString()
  verificationCode?: string;

  @IsOptional()
  @IsDate()
  verificationCodeExpires?: Date;
}
