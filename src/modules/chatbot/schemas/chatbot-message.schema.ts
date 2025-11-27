// src/modules/chatbot/schemas/chatbot-message.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ChatbotMessageDocument = ChatbotMessage & Document;

@Schema({ timestamps: true })
export class ChatbotMessage extends Document {
  _id: Types.ObjectId;

  // User who sent/received the message
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  // Message role: 'user' or 'assistant'
  @Prop({ required: true, enum: ['user', 'assistant'] })
  role: string;

  // Message content
  @Prop({ required: true })
  content: string;

  // Optional image URL if this is an image analysis message
  @Prop()
  imageUrl?: string;

  // Optional prompt used for image analysis
  @Prop()
  imagePrompt?: string;

  // Auto-generated timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const ChatbotMessageSchema =
  SchemaFactory.createForClass(ChatbotMessage);

// Indexes for efficient queries
ChatbotMessageSchema.index({ userId: 1, createdAt: -1 });
ChatbotMessageSchema.index({ userId: 1, role: 1, createdAt: -1 });
