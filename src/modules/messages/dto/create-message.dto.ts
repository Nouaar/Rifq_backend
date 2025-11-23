// src/modules/messages/dto/create-message.dto.ts

import { IsString, IsNotEmpty, IsOptional, IsMongoId } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMessageDto {
  @ApiProperty({
    description: 'ID of the recipient user',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  recipientId: string;

  @ApiProperty({
    description: 'Message content',
    example: 'Hello, I would like to book an appointment.',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description:
      'Optional conversation ID if continuing an existing conversation',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString()
  @IsOptional()
  @IsMongoId()
  conversationId?: string;
}
