// src/modules/chatbot/dto/chatbot-image-analysis.dto.ts

import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChatbotImageAnalysisDto {
  @ApiProperty({
    description: 'Base64 encoded image data (with or without data URI prefix)',
    example: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...',
  })
  @IsString()
  @IsNotEmpty()
  image: string;

  @ApiPropertyOptional({
    description: 'Optional prompt/question about the image',
    example: 'What health issues do you see in this pet image?',
    default: 'Analyze this pet image and provide health insights.',
  })
  @IsString()
  @IsOptional()
  prompt?: string;
}

