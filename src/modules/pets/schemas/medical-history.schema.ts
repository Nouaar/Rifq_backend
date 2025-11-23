// src/modules/pets/schemas/medical-history.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MedicalHistoryDocument = MedicalHistory & Document;

export interface Medication {
  name: string;
  dosage: string;
}

@Schema({ timestamps: true })
export class MedicalHistory extends Document {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Pet', required: true, unique: true })
  pet: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  vaccinations: string[];

  @Prop({ type: [String], default: [] })
  chronicConditions: string[];

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        dosage: { type: String, required: true },
      },
    ],
    default: [],
  })
  currentMedications: Medication[];
}

export const MedicalHistorySchema =
  SchemaFactory.createForClass(MedicalHistory);

MedicalHistorySchema.index({ pet: 1 }, { unique: true });
