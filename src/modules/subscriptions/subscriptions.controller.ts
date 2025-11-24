// src/modules/subscriptions/subscriptions.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  RawBodyRequest,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import {
  SubscriptionResponseDto,
  CreateSubscriptionResponseDto,
  CancelSubscriptionResponseDto,
  VerifyEmailResponseDto,
} from './dto/subscription-response.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserDocument } from '../users/schemas/user.schema';
import { SubscriptionStatus } from './schemas/subscription.schema';
import Stripe from 'stripe';
import { ConfigService } from '@nestjs/config';

@Controller('subscriptions')
export class SubscriptionsController {
  private readonly stripeWebhookSecret: string;

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly configService: ConfigService,
  ) {
    this.stripeWebhookSecret =
      this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: UserDocument,
    @Body() createSubscriptionDto: CreateSubscriptionDto,
  ): Promise<CreateSubscriptionResponseDto> {
    return this.subscriptionsService.create(
      user._id.toString(),
      createSubscriptionDto,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMySubscription(
    @CurrentUser() user: UserDocument,
  ): Promise<SubscriptionResponseDto> {
    const subscription = await this.subscriptionsService.findByUserId(
      user._id.toString(),
    );
    if (!subscription) {
      // Return a default "none" subscription response
      return {
        id: '',
        userId: user._id.toString(),
        role: user.role || 'owner',
        status: SubscriptionStatus.NONE,
        stripeSubscriptionId: null,
        stripeCustomerId: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: null,
        createdAt: null,
        updatedAt: null,
      };
    }
    return subscription;
  }

  @Post('cancel')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancel(
    @CurrentUser() user: UserDocument,
  ): Promise<CancelSubscriptionResponseDto> {
    return this.subscriptionsService.cancel(user._id.toString());
  }

  @Post('reactivate')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async reactivate(
    @CurrentUser() user: UserDocument,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionsService.reactivate(user._id.toString());
  }

  @Post('renew')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async renew(
    @CurrentUser() user: UserDocument,
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionsService.renew(user._id.toString());
  }

  @Post('verify-email')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @CurrentUser() user: UserDocument,
    @Body() verifyEmailDto: VerifyEmailDto,
  ): Promise<VerifyEmailResponseDto> {
    try {
      const subscription = await this.subscriptionsService.verifyEmail(
        user._id.toString(),
        verifyEmailDto.code,
      );
      return {
        success: true,
        message: 'Email verified! Your subscription is now active.',
        subscription,
      };
    } catch (error) {
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to verify email',
        subscription: undefined,
      };
    }
  }

  @Post('resend-verification')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async resendVerification(
    @CurrentUser() user: UserDocument,
  ): Promise<{ message: string }> {
    return this.subscriptionsService.resendVerificationCode(
      user._id.toString(),
    );
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
  ): Promise<{ received: boolean }> {
    const sig = req.headers['stripe-signature'] as string;

    if (!sig) {
      console.error('Missing stripe-signature header');
      return { received: false };
    }

    if (!this.stripeWebhookSecret) {
      console.warn(
        'STRIPE_WEBHOOK_SECRET not configured. Webhook verification skipped.',
      );
      // In test mode, we might not have webhook secret
      return { received: true };
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      const stripe = new Stripe(
        this.configService.get<string>('STRIPE_SECRET_KEY') || '',
        { apiVersion: '2025-11-17.clover' },
      );

      const rawBody = req.rawBody;
      if (!rawBody) {
        throw new Error('Missing raw body');
      }

      event = stripe.webhooks.constructEvent(
        rawBody,
        sig,
        this.stripeWebhookSecret,
      );
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return { received: false };
    }

    // Handle the event
    try {
      await this.subscriptionsService.handleStripeWebhook(event);
    } catch (error) {
      console.error('Error handling webhook event:', error);
      // Return success to Stripe even if we had an error (to avoid retries)
      return { received: true };
    }

    return { received: true };
  }
}
