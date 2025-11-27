// src/modules/chatbot/dto/chatbot-history-response.dto.ts

import { ApiProperty } from '@nestjs/swagger';

export class ChatbotMessageItemDto {
  @ApiProperty({ description: 'Message ID' })
  _id: string;

  @ApiProperty({ description: 'Message role: user or assistant', enum: ['user', 'assistant'] })
  role: string;

  @ApiProperty({ description: 'Message content' })
  content: string;

  @ApiProperty({ description: 'Optional image URL', required: false })
  imageUrl?: string;

  @ApiProperty({ description: 'Optional image prompt', required: false })
  imagePrompt?: string;

  @ApiProperty({ description: 'Message creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Message update timestamp' })
  updatedAt: Date;
}

export class ChatbotHistoryResponseDto {
  @ApiProperty({
    description: 'List of messages in chronological order',
    type: [ChatbotMessageItemDto],
  })
  messages: ChatbotMessageItemDto[];

  @ApiProperty({ description: 'Total number of messages in history' })
  total: number;
}

