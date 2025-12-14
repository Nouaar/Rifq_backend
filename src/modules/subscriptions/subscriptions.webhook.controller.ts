// src/modules/subscriptions/subscriptions.webhook.controller.ts

import {
  Controller,
  Post,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  BadRequestException,
  RawBodyRequest,
} from '@nestjs/common';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { SubscriptionsService } from './subscriptions.service';

@Controller('webhooks/stripe')
export class SubscriptionsWebhookController {
  private stripe: Stripe;
  private webhookSecret: string;

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly configService: ConfigService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2025-11-17.clover',
      });
    }
    this.webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET') || '';
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string,
  ) {
    if (!this.stripe || !this.webhookSecret) {
      console.warn('⚠️ Stripe webhook received but Stripe is not configured');
      return { received: true };
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = this.stripe.webhooks.constructEvent(
        request.rawBody,
        signature,
        this.webhookSecret,
      );
    } catch (err) {
      console.error('⚠️ Webhook signature verification failed:', err.message);
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }

    console.log(`📥 Received Stripe webhook: ${event.type}`);

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    console.log('✅ Payment succeeded for PaymentIntent:', paymentIntent.id);

    const userId = paymentIntent.metadata?.userId;
    const subscriptionRole = paymentIntent.metadata?.subscriptionRole || 'premium';
    
    if (userId) {
      // Create Stripe subscription now that payment is confirmed
      await this.subscriptionsService.createSubscriptionAfterPayment(
        userId,
        paymentIntent.customer as string,
        subscriptionRole,
      );
    }
  }

  private async handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
    console.log('❌ Payment failed for PaymentIntent:', paymentIntent.id);
    // You might want to notify the user
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    console.log('🔄 Subscription updated:', subscription.id);
    // Handle subscription updates (e.g., renewal, plan change)
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    console.log('🗑️ Subscription deleted:', subscription.id);
    // Handle subscription cancellation from Stripe side
  }
}
