// src/modules/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User extends Document {
  _id: Types.ObjectId;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  role: string; // optional if using UserRole enum

  @Prop({ default: 0 })
  balance: number;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  verificationCode?: string;

  @Prop()
  verificationCodeExpires?: Date;

  @Prop()
  refreshToken?: string; // optional if you want raw token storage

  @Prop()
  hashedRefreshToken?: string; // <- required for refresh flow
}

export const UserSchema = SchemaFactory.createForClass(User);
