// src/modules/subscriptions/dto/verify-email.dto.ts

import { IsString } from 'class-validator';

export class VerifyEmailDto {
  @IsString()
  code: string;
}

