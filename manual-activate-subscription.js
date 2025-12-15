// Manual script to activate a pending subscription after successful payment
// Run: node manual-activate-subscription.js <userId>

require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const Stripe = require('stripe');

const MONGODB_URI = process.env.MONGODB_URI;
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const STRIPE_PRICE_ID = process.env.STRIPE_SUBSCRIPTION_PRICE_ID;

const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2025-11-17.clover',
});

async function activatePendingSubscription(userId) {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    const subscriptionsCollection = db.collection('subscriptions');
    
    // Find pending subscription
    const subscription = await subscriptionsCollection.findOne({
      userId: new ObjectId(userId),
      status: 'pending',
    });
    
    if (!subscription) {
      console.log('❌ No pending subscription found for user:', userId);
      return;
    }
    
    console.log('📋 Found pending subscription:', subscription._id.toString());
    console.log('📋 Customer ID:', subscription.stripeCustomerId);
    console.log('📋 Role:', subscription.role);
    
    // Get the latest successful payment intent for this customer
    const paymentIntents = await stripe.paymentIntents.list({
      customer: subscription.stripeCustomerId,
      limit: 5,
    });
    
    const successfulPayment = paymentIntents.data.find(pi => pi.status === 'succeeded');
    
    if (!successfulPayment) {
      console.log('❌ No successful payment found for customer');
      return;
    }
    
    console.log('✅ Found successful payment:', successfulPayment.id);
    console.log('💳 Payment method:', successfulPayment.payment_method);
    
    // Create Stripe subscription
    const stripeSubscription = await stripe.subscriptions.create({
      customer: subscription.stripeCustomerId,
      items: [{ price: STRIPE_PRICE_ID }],
      default_payment_method: successfulPayment.payment_method,
    });
    
    console.log('✅ Created Stripe subscription:', stripeSubscription.id);
    
    // Update local subscription
    await subscriptionsCollection.updateOne(
      { _id: subscription._id },
      {
        $set: {
          stripeSubscriptionId: stripeSubscription.id,
          currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          status: 'active',
          updatedAt: new Date(),
        },
      }
    );
    
    // Update user
    await db.collection('users').updateOne(
      { _id: new ObjectId(userId) },
      {
        $set: {
          hasActiveSubscription: true,
          role: subscription.role,
        },
      }
    );
    
    console.log('✅ Subscription activated successfully!');
    console.log('📅 Period:', new Date(stripeSubscription.current_period_start * 1000), 'to', new Date(stripeSubscription.current_period_end * 1000));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.close();
  }
}

const userId = process.argv[2];
if (!userId) {
  console.log('Usage: node manual-activate-subscription.js <userId>');
  process.exit(1);
}

activatePendingSubscription(userId)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
