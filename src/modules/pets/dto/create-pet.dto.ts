// src/modules/pets/dto/create-pet.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateMedicalHistoryDto } from './medical-history.dto';

export class CreatePetDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  species: string; // e.g. 'dog', 'cat'

  @IsOptional()
  @IsString()
  breed?: string;

  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsString()
  gender?: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  weight?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsString()
  microchipId?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateMedicalHistoryDto)
  medicalHistory?: CreateMedicalHistoryDto;
}
