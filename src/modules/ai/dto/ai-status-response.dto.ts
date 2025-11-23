// src/modules/ai/dto/ai-status-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class StatusPillDto {
  @ApiProperty({ example: 'Healthy', description: 'Text for the status pill' })
  text: string;

  @ApiProperty({ example: '#10B981', description: 'Background color' })
  bg: string;

  @ApiProperty({ example: '#065F46', description: 'Foreground color' })
  fg: string;
}

export class AiStatusResponseDto {
  @ApiProperty({ example: 'Healthy', description: 'Overall health status' })
  status: string;

  @ApiProperty({
    type: [StatusPillDto],
    description: 'Status pills to display',
  })
  pills: StatusPillDto[];

  @ApiProperty({
    example: '✓ Up-to-date | 2 med | 30 kg',
    description: 'Summary text',
  })
  summary: string;
}
