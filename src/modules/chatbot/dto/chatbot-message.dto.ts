// src/modules/chatbot/dto/chatbot-message.dto.ts

import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatbotMessageDto {
  @ApiProperty({
    description: 'User message text',
    example: 'What should I feed my dog?',
  })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({
    description: 'Optional conversation context or history',
    example: 'Previous conversation about pet health',
  })
  @IsString()
  @IsOptional()
  context?: string;

  @ApiPropertyOptional({
    description: 'Optional image as base64 string (for JSON requests)',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  })
  @IsString()
  @IsOptional()
  image?: string;
}

