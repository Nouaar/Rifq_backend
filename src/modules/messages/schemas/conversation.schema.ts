// src/modules/messages/schemas/conversation.schema.ts

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ConversationDocument = Conversation & Document;

@Schema({ timestamps: true })
export class Conversation extends Document {
  _id: Types.ObjectId;

  // Participants in the conversation (always 2 users)
  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }], required: true })
  participants: Types.ObjectId[];

  // Last message in the conversation (for quick access)
  @Prop({ type: Types.ObjectId, ref: 'Message' })
  lastMessage?: Types.ObjectId;

  // When the last message was sent
  @Prop()
  lastMessageAt?: Date;

  // Unread count for each participant (stored as a map)
  @Prop({
    type: Map,
    of: Number,
    default: () => new Map(),
  })
  unreadCounts?: Map<string, number>;

  // Auto-generated timestamps
  createdAt: Date;
  updatedAt: Date;
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);

// Index for efficient querying
ConversationSchema.index({ lastMessageAt: -1 });
ConversationSchema.index({ participants: 1 });

// Pre-save hook to normalize participants (sort array)
ConversationSchema.pre('save', function (next) {
  if (this.participants && Array.isArray(this.participants)) {
    // Sort participants to ensure consistent lookup
    this.participants.sort((a, b) => {
      const aStr = typeof a === 'string' ? a : String(a);
      const bStr = typeof b === 'string' ? b : String(b);
      return aStr.localeCompare(bStr);
    });
  }
  next();
});
