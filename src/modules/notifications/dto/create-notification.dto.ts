import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateNotificationDto {
  @IsString()
  recipientId: string; // User who receives the notification

  @IsString()
  @IsOptional()
  senderId?: string; // User who triggers the notification (optional, defaults to recipient)

  @IsString()
  type: string; // 'booking_request', 'booking_accepted', etc.

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  bookingId?: string;

  @IsString()
  @IsOptional()
  messageRefId?: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}
