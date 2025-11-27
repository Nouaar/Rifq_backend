// src/modules/chatbot/dto/chatbot-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class ChatbotResponseDto {
  @ApiProperty({
    description: 'AI-generated response',
    example: 'Based on the image, I can see...',
  })
  response: string;

  @ApiProperty({
    description: 'Timestamp of the response',
    example: '2025-01-15T10:30:00Z',
  })
  timestamp: Date;
}
