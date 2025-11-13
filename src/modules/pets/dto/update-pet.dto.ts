import { PartialType } from '@nestjs/mapped-types';
import { Type } from 'class-transformer';
import { IsOptional, ValidateNested } from 'class-validator';
import { CreatePetDto } from './create-pet.dto';
import { UpdateMedicalHistoryDto } from './medical-history.dto';

export class UpdatePetDto extends PartialType(CreatePetDto) {
  @IsOptional()
  @ValidateNested()
  @Type(() => UpdateMedicalHistoryDto)
  medicalHistory?: UpdateMedicalHistoryDto;
}
