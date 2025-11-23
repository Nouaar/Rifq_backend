# Stripe Subscription Backend Setup Guide

## Overview
This guide explains how to set up and configure the Stripe subscription backend for the Rifq application.

## Installation

1. **Install dependencies:**
```bash
npm install
```

This will install:
- `stripe` - Stripe SDK
- `@nestjs/schedule` - For scheduled tasks (subscription expiration checks)

## Environment Variables

Add the following environment variables to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key (test or live)
STRIPE_WEBHOOK_SECRET=whsec_... # Stripe webhook signing secret
STRIPE_SUBSCRIPTION_PRICE_ID=price_... # Stripe price ID for $30/month subscription

# Optional: Set to 'production' for live mode
NODE_ENV=development
```

### Getting Stripe Keys

1. **Stripe Secret Key:**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com)
   - Navigate to Developers → API keys
   - Copy your **Secret key** (starts with `sk_test_` for test mode)

2. **Stripe Webhook Secret:**
   - Go to Developers → Webhooks
   - Create a new webhook endpoint: `https://your-domain.com/subscriptions/webhook`
   - Select events:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`
   - Copy the **Signing secret** (starts with `whsec_`)

3. **Subscription Price ID:**
   - Go to Products → Create product
   - Name: "Vet/Sitter Monthly Subscription"
   - Price: $30.00 USD
   - Billing period: Monthly
   - Copy the **Price ID** (starts with `price_`)

## Test Mode Setup

For testing without real payments:

1. Use Stripe test keys (start with `sk_test_`)
2. Use test card numbers:
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Any future expiry date and CVC

3. Set `NODE_ENV=development` to enable test mode (subscriptions created without Stripe)

## API Endpoints

### Create Subscription
```
POST /subscriptions
Authorization: Bearer <token>
Body: {
  "role": "vet" | "sitter",
  "paymentMethodId": "pm_xxx" // Optional
}
```

### Get My Subscription
```
GET /subscriptions/me
Authorization: Bearer <token>
```

### Cancel Subscription
```
POST /subscriptions/cancel
Authorization: Bearer <token>
```

### Reactivate Subscription
```
POST /subscriptions/reactivate
Authorization: Bearer <token>
```

### Stripe Webhook
```
POST /subscriptions/webhook
Headers: {
  "stripe-signature": "t=...,v1=..."
}
```

## Database Schema

The subscription schema includes:
- `userId` - Reference to user
- `role` - "vet" or "sitter"
- `status` - pending, active, canceled, expired, none
- `stripeSubscriptionId` - Stripe subscription ID
- `stripeCustomerId` - Stripe customer ID
- `currentPeriodStart` - Subscription period start date
- `currentPeriodEnd` - Subscription period end date
- `cancelAtPeriodEnd` - Whether to cancel at period end

## Subscription Flow

1. **User creates subscription:**
   - POST `/subscriptions` with role
   - Subscription created with status "pending"
   - Stripe customer and subscription created (or simulated in test mode)

2. **User verifies email:**
   - POST `/auth/verify` with email and code
   - Subscription automatically activated (status → "active")
   - User role upgraded to "vet" or "sitter"

3. **Subscription expires:**
   - Scheduled task runs every hour
   - Checks subscriptions past `currentPeriodEnd`
   - Sets status to "expired"
   - Downgrades user role to "owner"

4. **User cancels:**
   - POST `/subscriptions/cancel`
   - Sets `cancelAtPeriodEnd: true`
   - At period end, subscription expires and role downgrades

## Scheduled Tasks

The `SubscriptionsScheduler` runs every hour to:
- Check for expired subscriptions
- Auto-expire subscriptions past their period end
- Downgrade user roles to "owner"

## Webhook Events Handled

- `customer.subscription.created` - Activate subscription
- `customer.subscription.updated` - Update subscription details
- `customer.subscription.deleted` - Expire subscription, downgrade role
- `invoice.payment_succeeded` - Ensure subscription remains active
- `invoice.payment_failed` - Log payment failure (user notification can be added)

## Testing

1. **Test subscription creation:**
```bash
curl -X POST http://localhost:3000/subscriptions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"role": "vet"}'
```

2. **Test email verification (activates subscription):**
```bash
curl -X POST http://localhost:3000/auth/verify \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "code": "123456"}'
```

3. **Test webhook (using Stripe CLI):**
```bash
stripe listen --forward-to localhost:3000/subscriptions/webhook
stripe trigger customer.subscription.created
```

## Production Deployment

1. **Set environment variables:**
   - Use live Stripe keys (`sk_live_...`)
   - Set `NODE_ENV=production`
   - Configure webhook endpoint in Stripe Dashboard

2. **Webhook endpoint:**
   - Must be HTTPS
   - Must verify webhook signature
   - Should handle idempotency

3. **Monitoring:**
   - Monitor webhook delivery in Stripe Dashboard
   - Check logs for subscription expiration
   - Monitor scheduled task execution

## Troubleshooting

### Webhook not receiving events
- Check webhook endpoint URL is correct
- Verify webhook secret is set correctly
- Check server logs for signature verification errors

### Subscriptions not activating
- Check email verification is completing
- Verify subscription status in database
- Check logs for activation errors

### Scheduled task not running
- Verify `@nestjs/schedule` is installed
- Check `ScheduleModule.forRoot()` is imported
- Check server logs for cron job execution

## Notes

- In test mode (`NODE_ENV !== 'production'`), subscriptions are created without Stripe
- Subscription activation happens automatically after email verification
- Role downgrade happens automatically when subscription expires
- Webhook signature verification is required for production

