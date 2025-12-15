#!/bin/bash

# Start Stripe webhook listener for local development
# This forwards Stripe webhook events to your local backend

echo "🔌 Starting Stripe webhook listener..."
echo "📍 Forwarding webhooks to: http://localhost:3000/webhooks/stripe"
echo ""
echo "⚠️  Make sure your backend is running on http://localhost:3000"
echo "⚠️  Install Stripe CLI if you haven't: brew install stripe/stripe-cli/stripe"
echo ""

stripe listen --forward-to http://localhost:3000/webhooks/stripe
