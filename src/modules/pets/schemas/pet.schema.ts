// src/modules/pets/schemas/pet.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type PetDocument = Pet & Document;

@Schema({ timestamps: true })
export class Pet extends Document {
  _id: Types.ObjectId;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  species: string; // e.g., 'dog', 'cat'

  @Prop()
  breed?: string;

  @Prop()
  age?: number;

  @Prop()
  gender?: string;

  @Prop()
  color?: string;

  @Prop()
  weight?: number;

  //  Relation: each pet belongs to one owner (User)
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  owner: Types.ObjectId;
}

export const PetSchema = SchemaFactory.createForClass(Pet);
