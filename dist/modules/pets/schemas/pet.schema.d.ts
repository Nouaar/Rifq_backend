import { Document, Types } from 'mongoose';
export type PetDocument = Pet & Document;
export declare class Pet extends Document {
    _id: Types.ObjectId;
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
    medicalHistory?: Types.ObjectId;
    owner: Types.ObjectId;
}
export declare const PetSchema: import("mongoose").Schema<Pet, import("mongoose").Model<Pet, any, any, any, Document<unknown, any, Pet, any, {}> & Pet & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Pet, Document<unknown, {}, import("mongoose").FlatRecord<Pet>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<Pet> & Required<{
    _id: Types.ObjectId;
}> & {
    __v: number;
}>;
