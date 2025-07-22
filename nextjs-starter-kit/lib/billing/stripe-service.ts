import Stripe from 'stripe';
import { db } from "@/db/drizzle";
import { user, transaction } from "@/db/schema";
import { eq } from "drizzle-orm";
import { SUBSCRIPTION_TIERS, upgradeUserTier } from "./quota-service";
import { StripeCircuitBreaker } from "@/lib/security/circuit-breaker";
import { logger } from "@/lib/monitoring/error-logger";
import { Errors } from "@/lib/monitoring/error-handler";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

export interface StripePaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
}

export interface StripeSubscription {
  id: string;
  status: string;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  priceId: string;
  customerId: string;
}

/**
 * Create Stripe customer
 */
export async function createStripeCustomer(
  userId: string,
  email: string,
  name?: string
): Promise<string> {
  try {
    const customer = await StripeCircuitBreaker.execute(async () => {
      return await stripe.customers.create({
        email,
        name: name || undefined,
        metadata: {
          langset_user_id: userId,
        },
      });
    });

    // Update user with Stripe customer ID
    await db
      .update(user)
      .set({
        stripeCustomerId: customer.id,
        updatedAt: new Date()
      })
      .where(eq(user.id, userId));

    console.log(`[Stripe] Created customer ${customer.id} for user ${userId}`);
    return customer.id;

  } catch (error) {
    await logger.error(
      '[Stripe] Failed to create customer',
      error instanceof Error ? error : new Error(String(error)),
      {
        component: 'stripe',
        operation: 'create_customer',
        userId,
        metadata: { email, name }
      }
    );
    throw Errors.externalService('Stripe', error instanceof Error ? error : undefined);
  }
}

/**
 * Create subscription for tier upgrade
 */
export async function createSubscription(
  userId: string,
  tier: keyof typeof SUBSCRIPTION_TIERS,
  paymentMethodId?: string
): Promise<StripeSubscription> {
  try {
    const tierInfo = SUBSCRIPTION_TIERS[tier];
    
    if (!tierInfo.stripePriceId) {
      throw new Error(`Tier ${tier} does not have a Stripe price ID configured`);
    }

    // Get or create Stripe customer
    const userData = await db
      .select({
        stripeCustomerId: user.stripeCustomerId,
        email: user.email,
        name: user.name
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userData[0]) {
      throw new Error("User not found");
    }

    let customerId = userData[0].stripeCustomerId;
    
    if (!customerId) {
      customerId = await createStripeCustomer(userId, userData[0].email, userData[0].name);
    }

    // Create subscription
    const subscriptionData: Stripe.SubscriptionCreateParams = {
      customer: customerId,
      items: [{
        price: tierInfo.stripePriceId,
      }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        langset_user_id: userId,
        tier: tier,
      },
    };

    if (paymentMethodId) {
      subscriptionData.default_payment_method = paymentMethodId;
    }

    const subscription = await StripeCircuitBreaker.execute(async () => {
      return await stripe.subscriptions.create(subscriptionData);
    });

    console.log(`[Stripe] Created subscription ${subscription.id} for user ${userId}`);

    return {
      id: subscription.id,
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      priceId: tierInfo.stripePriceId,
      customerId
    };

  } catch (error) {
    console.error('[Stripe] Failed to create subscription:', error);
    throw error;
  }
}

/**
 * Create payment intent for one-time payment
 */
export async function createPaymentIntent(
  userId: string,
  amount: number,
  currency: string = 'usd',
  metadata: Record<string, string> = {}
): Promise<StripePaymentIntent> {
  try {
    // Get Stripe customer
    const userData = await db
      .select({
        stripeCustomerId: user.stripeCustomerId,
        email: user.email,
        name: user.name
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userData[0]) {
      throw new Error("User not found");
    }

    let customerId = userData[0].stripeCustomerId;
    
    if (!customerId) {
      customerId = await createStripeCustomer(userId, userData[0].email, userData[0].name);
    }

    const paymentIntent = await StripeCircuitBreaker.execute(async () => {
      return await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          langset_user_id: userId,
          ...metadata
        },
      });
    });

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status
    };

  } catch (error) {
    console.error('[Stripe] Failed to create payment intent:', error);
    throw error;
  }
}

/**
 * Create marketplace payment with Stripe Connect
 */
export async function createMarketplacePayment({
  buyerId,
  sellerId,
  amount,
  currency = 'usd',
  platformFee,
  metadata = {}
}: {
  buyerId: string;
  sellerId: string;
  amount: number;
  currency?: string;
  platformFee: number;
  metadata?: Record<string, string>;
}): Promise<StripePaymentIntent> {
  try {
    // Get buyer's Stripe customer
    const buyerData = await db
      .select({
        stripeCustomerId: user.stripeCustomerId,
        email: user.email,
        name: user.name
      })
      .from(user)
      .where(eq(user.id, buyerId))
      .limit(1);

    if (!buyerData[0]) {
      throw new Error("Buyer not found");
    }

    let customerIdBuyer = buyerData[0].stripeCustomerId;
    
    if (!customerIdBuyer) {
      customerIdBuyer = await createStripeCustomer(buyerId, buyerData[0].email, buyerData[0].name);
    }

    // Get seller's Stripe Connect account
    const sellerData = await db
      .select({
        stripeConnectAccountId: user.stripeConnectAccountId,
        email: user.email
      })
      .from(user)
      .where(eq(user.id, sellerId))
      .limit(1);

    if (!sellerData[0]) {
      throw new Error("Seller not found");
    }

    // If seller doesn't have Connect account, create one
    let connectAccountId = sellerData[0].stripeConnectAccountId;
    if (!connectAccountId) {
      connectAccountId = await createConnectAccount(sellerId, sellerData[0].email);
    }

    const sellerAmount = amount - platformFee;

    // Create payment intent with application fee
    const paymentIntent = await StripeCircuitBreaker.execute(async () => {
      return await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        customer: customerIdBuyer,
        application_fee_amount: Math.round(platformFee * 100), // Platform fee in cents
        transfer_data: {
          destination: connectAccountId,
        },
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          langset_buyer_id: buyerId,
          langset_seller_id: sellerId,
          seller_amount: sellerAmount.toString(),
          platform_fee: platformFee.toString(),
          ...metadata
        },
      });
    });

    console.log(`[Stripe] Created marketplace payment intent ${paymentIntent.id} for $${amount}`);
    console.log(`[Stripe] Platform fee: $${platformFee}, Seller receives: $${sellerAmount}`);

    return {
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret!,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status
    };

  } catch (error) {
    console.error('[Stripe] Failed to create marketplace payment:', error);
    throw error;
  }
}

/**
 * Create Stripe Connect account for seller
 */
export async function createConnectAccount(
  sellerId: string,
  email: string
): Promise<string> {
  try {
    const account = await StripeCircuitBreaker.execute(async () => {
      return await stripe.accounts.create({
        type: 'express',
        country: 'US', // Default to US, should be configurable
        email: email,
        metadata: {
          langset_seller_id: sellerId
        },
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true }
        }
      });
    });

    // Update user with Connect account ID
    await db
      .update(user)
      .set({
        stripeConnectAccountId: account.id,
        updatedAt: new Date()
      })
      .where(eq(user.id, sellerId));

    console.log(`[Stripe] Created Connect account ${account.id} for seller ${sellerId}`);
    return account.id;

  } catch (error) {
    console.error('[Stripe] Failed to create Connect account:', error);
    throw error;
  }
}

/**
 * Create Connect onboarding link for seller
 */
export async function createConnectOnboardingLink(
  sellerId: string,
  refreshUrl: string,
  returnUrl: string
): Promise<string> {
  try {
    const userData = await db
      .select({
        stripeConnectAccountId: user.stripeConnectAccountId
      })
      .from(user)
      .where(eq(user.id, sellerId))
      .limit(1);

    if (!userData[0]?.stripeConnectAccountId) {
      throw new Error("Seller must have a Connect account first");
    }

    const accountLink = await stripe.accountLinks.create({
      account: userData[0].stripeConnectAccountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding'
    });

    return accountLink.url;

  } catch (error) {
    console.error('[Stripe] Failed to create onboarding link:', error);
    throw error;
  }
}

/**
 * Process seller payout - now uses real Stripe Connect
 */
export async function createSellerPayout(
  sellerId: string,
  amount: number,
  transactionId: string,
  description: string = "Dataset sale earnings"
): Promise<string> {
  try {
    // Update seller's total earnings in database
    const currentEarnings = await db
      .select({ totalEarnings: user.totalEarnings })
      .from(user)
      .where(eq(user.id, sellerId))
      .limit(1);

    const newTotal = (currentEarnings[0]?.totalEarnings || 0) + amount;

    await db
      .update(user)
      .set({
        totalEarnings: newTotal,
        updatedAt: new Date()
      })
      .where(eq(user.id, sellerId));

    console.log(`[Stripe] Updated seller ${sellerId} earnings: +$${amount} (total: $${newTotal})`);
    
    // Note: Actual transfer to seller's bank account happens automatically 
    // via Stripe Connect when payment is captured
    
    return `earnings_updated_${crypto.randomUUID()}`;

  } catch (error) {
    console.error('[Stripe] Failed to process seller payout:', error);
    throw error;
  }
}

/**
 * Handle Stripe webhook events
 */
export async function handleStripeWebhook(
  event: Stripe.Event
): Promise<void> {
  try {
    console.log(`[Stripe Webhook] Handling event: ${event.type}`);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.langset_user_id;
        const tier = subscription.metadata.tier as keyof typeof SUBSCRIPTION_TIERS;

        if (userId && tier && subscription.status === 'active') {
          await upgradeUserTier(userId, tier, subscription.customer as string);
          console.log(`[Stripe Webhook] Activated ${tier} subscription for user ${userId}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.langset_user_id;

        if (userId) {
          // Downgrade to basic tier
          await upgradeUserTier(userId, 'basic');
          console.log(`[Stripe Webhook] Downgraded user ${userId} to basic tier`);
        }
        break;
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const buyerId = paymentIntent.metadata.langset_buyer_id;
        const sellerId = paymentIntent.metadata.langset_seller_id;

        if (buyerId && sellerId) {
          console.log(`[Stripe Webhook] Marketplace payment succeeded: $${paymentIntent.amount / 100}`);
          
          // Update transaction status
          await db
            .update(transaction)
            .set({
              status: "completed",
              updatedAt: new Date()
            })
            .where(eq(transaction.stripePaymentIntentId, paymentIntent.id));

          // Process seller payout
          const sellerAmount = parseFloat(paymentIntent.metadata.seller_amount);
          await createSellerPayout(sellerId, sellerAmount, paymentIntent.id);
          
          console.log(`[Stripe Webhook] Processed payout to seller ${sellerId}: $${sellerAmount}`);
        } else if (paymentIntent.metadata.langset_user_id) {
          const userId = paymentIntent.metadata.langset_user_id;
          console.log(`[Stripe Webhook] Payment succeeded for user ${userId}: $${paymentIntent.amount / 100}`);
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const userId = paymentIntent.metadata.langset_user_id;

        if (userId) {
          console.log(`[Stripe Webhook] Payment failed for user ${userId}`);
          // Handle payment failure if needed
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

  } catch (error) {
    console.error('[Stripe Webhook] Error handling webhook:', error);
    throw error;
  }
}

/**
 * Get user's subscription status
 */
export async function getUserSubscriptionStatus(userId: string): Promise<{
  hasActiveSubscription: boolean;
  subscription?: StripeSubscription;
  tier: keyof typeof SUBSCRIPTION_TIERS;
}> {
  try {
    const userData = await db
      .select({
        stripeCustomerId: user.stripeCustomerId,
        subscriptionTier: user.subscriptionTier
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userData[0]) {
      throw new Error("User not found");
    }

    const tier = (userData[0].subscriptionTier as keyof typeof SUBSCRIPTION_TIERS) || 'basic';

    if (!userData[0].stripeCustomerId || tier === 'basic') {
      return {
        hasActiveSubscription: false,
        tier
      };
    }

    // Get active subscriptions from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: userData[0].stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      return {
        hasActiveSubscription: false,
        tier
      };
    }

    const subscription = subscriptions.data[0];

    return {
      hasActiveSubscription: true,
      subscription: {
        id: subscription.id,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        priceId: subscription.items.data[0].price.id,
        customerId: subscription.customer as string
      },
      tier
    };

  } catch (error) {
    console.error('[Stripe] Failed to get subscription status:', error);
    throw error;
  }
}

/**
 * Cancel user subscription
 */
export async function cancelSubscription(
  userId: string,
  immediately: boolean = false
): Promise<void> {
  try {
    const userData = await db
      .select({
        stripeCustomerId: user.stripeCustomerId
      })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1);

    if (!userData[0]?.stripeCustomerId) {
      throw new Error("No active subscription found");
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: userData[0].stripeCustomerId,
      status: 'active',
      limit: 1,
    });

    if (subscriptions.data.length === 0) {
      throw new Error("No active subscription found");
    }

    const subscription = subscriptions.data[0];

    if (immediately) {
      await stripe.subscriptions.cancel(subscription.id);
      await upgradeUserTier(userId, 'basic');
    } else {
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: true,
      });
    }

    console.log(`[Stripe] ${immediately ? 'Cancelled' : 'Scheduled cancellation for'} subscription ${subscription.id} for user ${userId}`);

  } catch (error) {
    console.error('[Stripe] Failed to cancel subscription:', error);
    throw error;
  }
}

export default {
  createStripeCustomer,
  createSubscription,
  createPaymentIntent,
  createMarketplacePayment,
  createConnectAccount,
  createConnectOnboardingLink,
  createSellerPayout,
  handleStripeWebhook,
  getUserSubscriptionStatus,
  cancelSubscription,
};