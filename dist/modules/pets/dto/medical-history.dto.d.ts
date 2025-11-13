export declare class MedicationDto {
    name: string;
    dosage: string;
}
export declare class CreateMedicalHistoryDto {
    vaccinations?: string[];
    chronicConditions?: string[];
    currentMedications?: MedicationDto[];
}
declare const UpdateMedicalHistoryDto_base: import("@nestjs/mapped-types").MappedType<Partial<CreateMedicalHistoryDto>>;
export declare class UpdateMedicalHistoryDto extends UpdateMedicalHistoryDto_base {
}
export {};
