// src/modules/subscriptions/dto/create-subscription.dto.ts

import { IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateSubscriptionDto {
  @IsString()
  @IsEnum(['vet', 'sitter'])
  role: 'vet' | 'sitter';

  @IsString()
  @IsOptional()
  paymentMethodId?: string;
}

