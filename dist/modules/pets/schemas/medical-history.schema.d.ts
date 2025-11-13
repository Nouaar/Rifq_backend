import { Document, Types } from 'mongoose';
export type MedicalHistoryDocument = MedicalHistory & Document;
export interface Medication {
    name: string;
    dosage: string;
}
export declare class MedicalHistory extends Document {
    _id: Types.ObjectId;
    pet: Types.ObjectId;
    vaccinations: string[];
    chronicConditions: string[];
    currentMedications: Medication[];
}
export declare const MedicalHistorySchema: import("mongoose").Schema<MedicalHistory, import("mongoose").Model<MedicalHistory, any, any, any, Document<unknown, any, MedicalHistory, any, {}> & MedicalHistory & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, MedicalHistory, Document<unknown, {}, import("mongoose").FlatRecord<MedicalHistory>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<MedicalHistory> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
