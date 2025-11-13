// src/modules/veterinarians/schemas/veterinarian.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type VeterinarianDocument = Veterinarian & Document;

@Schema({ timestamps: true, collection: 'veterinarians' })
export class Veterinarian {
  _id: Types.ObjectId;

  // Reference to User (owner can also be a vet)
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  user: Types.ObjectId;

  // Vet-specific required fields
  @Prop({ required: true })
  licenseNumber: string;

  @Prop({ required: true })
  clinicName: string;

  @Prop({ required: true })
  clinicAddress: string;

  // Vet-specific optional fields
  @Prop({ type: [String], default: [] })
  specializations?: string[];

  @Prop()
  yearsOfExperience?: number;

  @Prop()
  latitude?: number;

  @Prop()
  longitude?: number;

  @Prop()
  bio?: string;
}

export const VeterinarianSchema = SchemaFactory.createForClass(Veterinarian);

