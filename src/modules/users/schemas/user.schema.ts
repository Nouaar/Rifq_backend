// src/modules/users/schemas/user.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User extends Document {
  _id: Types.ObjectId;

  // Common user fields
  @Prop({ required: true, unique: true })
  email: string;

  @Prop()
  phoneNumber?: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  profileImage?: string;

  // By default, every user is an "owner"
  @Prop({ default: 'owner', enum: ['owner', 'vet', 'admin', 'sitter'] })
  role: string;

  @Prop({ default: 0 })
  balance: number;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  verificationCode?: string;

  @Prop()
  verificationCodeExpires?: Date;

  @Prop()
  refreshToken?: string;

  @Prop()
  hashedRefreshToken?: string;

  // Vet-specific fields (optional)
  @Prop()
  specialization?: string;

  @Prop()
  clinicName?: string;

  @Prop()
  clinicAddress?: string;

  @Prop()
  Location?: string;

  @Prop()
  licenseNumber?: string;

  @Prop()
  yearsOfExperience?: number;

  @Prop()
  bio?: string;

  // Relationship: one owner can have many pets
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Pet' }], default: [] })
  pets: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
