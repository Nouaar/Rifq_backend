import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  recipient: Types.ObjectId; // User who receives the notification

  @Prop({ required: true, type: Types.ObjectId, ref: 'User' })
  sender: Types.ObjectId; // User who triggered the notification

  @Prop({ required: true })
  type: string; // 'booking_request', 'booking_accepted', 'booking_rejected', 'message', etc.

  @Prop({ required: true })
  title: string; // Notification title

  @Prop({ required: true })
  message: string; // Notification message/body

  @Prop({ type: Types.ObjectId, ref: 'Booking' })
  booking?: Types.ObjectId; // Reference to booking if notification is booking-related

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  messageRef?: Types.ObjectId; // Reference to message if notification is message-related

  @Prop({ default: false })
  read: boolean; // Whether the notification has been read

  @Prop({ type: Date })
  readAt?: Date; // When the notification was read

  @Prop({ type: Object })
  metadata?: Record<string, any>; // Additional data (e.g., booking details, user info)
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Index for efficient querying of unread notifications
NotificationSchema.index({ recipient: 1, read: 1 });
