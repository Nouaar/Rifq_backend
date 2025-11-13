// src/modules/pet-sitters/dto/create-sitter.dto.ts

import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  IsArray,
  IsBoolean,
  IsDate,
  MinLength,
} from 'class-validator';

export class CreateSitterDto {
  // User base fields
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  // Sitter-specific required fields
  @IsNotEmpty()
  @IsNumber()
  hourlyRate: number;

  @IsNotEmpty()
  @IsString()
  sitterAddress: string; // Address field from form

  // Sitter-specific optional fields
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @IsOptional()
  @IsNumber()
  yearsOfExperience?: number;

  @IsOptional()
  @IsBoolean()
  availableWeekends?: boolean;

  @IsOptional()
  @IsBoolean()
  canHostPets?: boolean;

  @IsOptional()
  @IsArray()
  availability?: (Date | string)[]; // Accept both Date objects and ISO date strings

  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  @IsOptional()
  @IsString()
  bio?: string;
}

