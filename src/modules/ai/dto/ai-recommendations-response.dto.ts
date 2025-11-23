// src/modules/ai/dto/ai-recommendations-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class RecommendationItemDto {
  @ApiProperty({
    example: 'Vaccination Schedule',
    description: 'Title of the recommendation',
  })
  title: string;

  @ApiProperty({
    example: 'Schedule FVCRP booster within the next 2 weeks',
    description: 'Detail description of the recommendation',
  })
  detail: string;

  @ApiProperty({
    example: 'vaccination',
    description: 'Type of recommendation',
  })
  type: string;

  @ApiProperty({
    example: '2024-12-01',
    description: 'Suggested date (optional)',
    required: false,
  })
  suggestedDate?: string;
}

export class AiRecommendationsResponseDto {
  @ApiProperty({
    type: [RecommendationItemDto],
    description: 'List of recommendations for the pet',
  })
  recommendations: RecommendationItemDto[];
}
