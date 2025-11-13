import { CreatePetDto } from './create-pet.dto';
import { UpdateMedicalHistoryDto } from './medical-history.dto';
declare const UpdatePetDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreatePetDto>>;
export declare class UpdatePetDto extends UpdatePetDto_base {
    medicalHistory?: UpdateMedicalHistoryDto;
}
export {};
