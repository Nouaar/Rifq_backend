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

    // Check if signature exists
    if (!signature) {
      console.error('⚠️ Missing stripe-signature header');
      throw new BadRequestException('Webhook Error: Missing stripe-signature header.');
    }

    // Get raw body - try multiple sources
    let rawBody: Buffer | string | undefined = request.rawBody;
    
    // If rawBody is not available, try to get it from the request body
    if (!rawBody) {
      // Try to get from request body if it's a Buffer
      if (request.body && Buffer.isBuffer(request.body)) {
        rawBody = request.body;
      } else if (request.body && typeof request.body === 'string') {
        rawBody = Buffer.from(request.body);
      } else {
        console.error('⚠️ No webhook payload was provided. rawBody:', typeof request.rawBody, 'body:', typeof request.body);
        throw new BadRequestException('Webhook Error: No webhook payload was provided.');
      }
    }

    // Ensure rawBody is a Buffer
    if (!Buffer.isBuffer(rawBody)) {
      rawBody = Buffer.from(rawBody as string);
    }

    let event: Stripe.Event;

    try {
      // Verify webhook signature
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        this.webhookSecret,
      );
    } catch (err: any) {
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

    let userId: string | undefined = paymentIntent.metadata?.userId;
    let subscriptionRole: string = paymentIntent.metadata?.subscriptionRole || 'premium';
    const paymentMethodId = paymentIntent.payment_method as string;
    const customerId = paymentIntent.customer as string;
    
    // If userId is missing from metadata, try to find it from customer or subscription
    if (!userId && customerId) {
      try {
        // Try to get userId from customer metadata
        const customer = await this.stripe.customers.retrieve(customerId);
        if (customer && !customer.deleted) {
          // Type guard: customer is now of type Customer
          const activeCustomer = customer as Stripe.Customer;
          if (activeCustomer.metadata?.userId) {
            userId = activeCustomer.metadata.userId;
            console.log(`✅ Found userId from customer metadata: ${userId}`);
          }
        }
      } catch (error: any) {
        console.warn(`⚠️ Could not retrieve customer: ${error.message}`);
      }

      // If still no userId, find subscription by customer ID
      if (!userId) {
        const subscription = await this.subscriptionsService.findByCustomerId(customerId);
        if (subscription) {
          userId = subscription.userId.toString();
          subscriptionRole = subscription.role || 'premium';
          console.log(`✅ Found subscription by customer ID. userId: ${userId}, role: ${subscriptionRole}`);
        }
      }
    }
    
    if (userId && customerId) {
      // Create Stripe subscription now that payment is confirmed
      await this.subscriptionsService.createSubscriptionAfterPayment(
        userId,
        customerId,
        subscriptionRole,
        paymentMethodId,
      );
    } else {
      console.error('❌ Cannot activate subscription - missing required data:', {
        userId,
        customer: customerId,
        paymentIntentId: paymentIntent.id,
      });
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
