import { CreateMedicalHistoryDto } from './medical-history.dto';
export declare class CreatePetDto {
    name: string;
    species: string;
    breed?: string;
    age?: number;
    gender?: string;
    color?: string;
    weight?: number;
    height?: number;
    photo?: string;
    microchipId?: string;
    medicalHistory?: CreateMedicalHistoryDto;
}
