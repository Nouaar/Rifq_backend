// src/modules/subscriptions/dto/subscription-response.dto.ts

import { SubscriptionStatus } from '../schemas/subscription.schema';

export class SubscriptionResponseDto {
  id: string;
  userId: string;
  role: string;
  status: SubscriptionStatus;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export class CreateSubscriptionResponseDto {
  subscription: SubscriptionResponseDto;
  clientSecret?: string;
  message?: string;
}

export class CancelSubscriptionResponseDto {
  subscription: SubscriptionResponseDto;
  message?: string;
}

export class VerifyEmailResponseDto {
  success: boolean;
  message?: string;
  subscription?: SubscriptionResponseDto;
}

