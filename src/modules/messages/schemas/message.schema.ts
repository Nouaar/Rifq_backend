// src/modules/messages/schemas/message.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;

@Schema({ timestamps: true })
export class Message extends Document {
  _id: Types.ObjectId;

  // Conversation this message belongs to
  @Prop({ type: Types.ObjectId, ref: 'Conversation', required: true })
  conversation: Types.ObjectId;

  // Sender of the message
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId;

  // Recipient of the message
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  recipient: Types.ObjectId;

  // Message content
  @Prop({ required: true })
  content: string;

  // Whether the message has been read
  @Prop({ default: false })
  read: boolean;

  // When the message was read
  @Prop()
  readAt?: Date;

  // Whether the message has been deleted
  @Prop({ default: false })
  isDeleted: boolean;

  // When the message was edited (if applicable)
  @Prop()
  editedAt?: Date;

  // Audio file URL (if message contains audio)
  @Prop()
  audioURL?: string;

  // Auto-generated timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

// Indexes for efficient queries
MessageSchema.index({ conversation: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ recipient: 1 });
MessageSchema.index({ read: 1 });
