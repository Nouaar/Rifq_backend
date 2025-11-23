// src/modules/messages/dto/create-conversation.dto.ts

import { IsString, IsNotEmpty, IsMongoId } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConversationDto {
  @ApiProperty({
    description: 'ID of the participant user to start a conversation with',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  @IsMongoId()
  participantId: string;
}
