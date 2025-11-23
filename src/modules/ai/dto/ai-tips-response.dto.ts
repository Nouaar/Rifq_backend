// src/modules/ai/dto/ai-tips-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class TipItemDto {
  @ApiProperty({ example: '🥕', description: 'Emoji for the tip' })
  emoji: string;

  @ApiProperty({ example: 'Nutrition Tip', description: 'Title of the tip' })
  title: string;

  @ApiProperty({
    example:
      'Rotate crunchy vegetables with high-protein treats to keep meals balanced.',
    description: 'Detail description of the tip',
  })
  detail: string;
}

export class AiTipsResponseDto {
  @ApiProperty({ type: [TipItemDto], description: 'List of tips for the pet' })
  tips: TipItemDto[];
}
