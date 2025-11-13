// src/modules/pets/dto/medical-history.dto.ts

import {
  IsArray,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';

export class MedicationDto {
  @IsString()
  name: string;

  @IsString()
  dosage: string;
}

export class CreateMedicalHistoryDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  vaccinations?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  chronicConditions?: string[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MedicationDto)
  currentMedications?: MedicationDto[];
}

export class UpdateMedicalHistoryDto extends PartialType(
  CreateMedicalHistoryDto,
) {}

