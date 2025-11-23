// src/modules/messages/dto/update-message.dto.ts

import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMessageDto {
  @ApiProperty({
    description: 'Updated message content',
    example: 'Updated message text',
  })
  @IsString()
  @IsNotEmpty()
  content: string;
}
