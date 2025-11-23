// src/modules/ai/dto/ai-reminders-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ReminderItemDto {
  @ApiProperty({
    example: 'syringe.fill',
    description: 'Icon name for the reminder',
  })
  icon: string;

  @ApiProperty({
    example: 'Luna • Vaccination Booster',
    description: 'Title of the reminder',
  })
  title: string;

  @ApiProperty({
    example: 'Feline FVCRP booster due soon.',
    description: 'Detail description of the reminder',
  })
  detail: string;

  @ApiProperty({
    example: '2024-12-01T10:00:00Z',
    description: 'Date and time for the reminder',
  })
  date: string;

  @ApiProperty({
    example: '#FF6B6B',
    description: 'Color tint for the reminder',
  })
  tint: string;
}

export class AiRemindersResponseDto {
  @ApiProperty({
    type: [ReminderItemDto],
    description: 'List of reminders for the pet',
  })
  reminders: ReminderItemDto[];
}
