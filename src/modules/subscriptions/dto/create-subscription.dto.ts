// src/modules/subscriptions/dto/create-subscription.dto.ts

import { IsString, IsEnum, IsOptional } from 'class-validator';

export class CreateSubscriptionDto {
  @IsOptional()
  @IsEnum(['vet', 'sitter', 'premium'])
  role?: 'vet' | 'sitter' | 'premium'; // Optional - user chooses after payment

  @IsOptional()
  @IsString()
  paymentMethodId?: string;
}

