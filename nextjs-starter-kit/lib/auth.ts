import { db } from "@/db/drizzle";
import { account, session, subscription, user, verification } from "@/db/schema";
import {
  checkout,
  polar,
  portal,
  usage,
  webhooks,
} from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { fetchLinkedInProfile, calculateCredibilityScore } from "./linkedin-api";
import { generateReferralCode } from "./referral";
import { eq } from "drizzle-orm";

// Utility function to safely parse dates
function safeParseDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  return new Date(value);
}

const polarClient = new Polar({
  accessToken: process.env.POLAR_ACCESS_TOKEN,
  server: "sandbox",
});

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  trustedOrigins: [`${process.env.NEXT_PUBLIC_APP_URL}`],
  allowedDevOrigins: [`${process.env.NEXT_PUBLIC_APP_URL}`],
  cookieCache: {
    enabled: true,
    maxAge: 5 * 60, // Cache duration in seconds
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
      subscription,
    },
  }),
  hooks: {
    after: [
      {
        matcher(context) {
          return context.path === "/sign-up" || (context.path === "/sign-in/social" && !context.user?.emailVerified);
        },
        async handler(ctx) {
          try {
            // Generate referral code for new users
            const referralCode = generateReferralCode();
            
            await db
              .update(user)
              .set({
                referralCode: referralCode,
              })
              .where(eq(user.id, ctx.user.id));

            console.log(`Generated referral code ${referralCode} for user ${ctx.user.id}`);
          } catch (error) {
            console.error("Error generating referral code:", error);
          }
        },
      },
      {
        matcher(context) {
          return context.path === "/sign-in/social" && context.body?.provider === "linkedin";
        },
        async handler(ctx) {
          try {
            // Get the account that was just created/linked
            const accounts = await db
              .select()
              .from(account)
              .where(eq(account.userId, ctx.user.id))
              .where(eq(account.providerId, "linkedin"));
            
            const linkedinAccount = accounts[0];
            if (!linkedinAccount?.accessToken) {
              console.log("No LinkedIn access token found");
              return;
            }

            // Fetch LinkedIn profile data
            const linkedinProfile = await fetchLinkedInProfile(linkedinAccount.accessToken);
            if (!linkedinProfile) {
              console.log("Failed to fetch LinkedIn profile");
              return;
            }

            // Calculate credibility score
            const credibilityScore = calculateCredibilityScore(linkedinProfile);

            // Update user with LinkedIn profile and credibility score
            await db
              .update(user)
              .set({
                linkedinProfile: linkedinProfile,
                credibilityScore: credibilityScore,
                name: `${linkedinProfile.firstName} ${linkedinProfile.lastName}`,
              })
              .where(eq(user.id, ctx.user.id));

            console.log(`Updated user ${ctx.user.id} with LinkedIn profile and credibility score: ${credibilityScore}`);
          } catch (error) {
            console.error("Error processing LinkedIn profile:", error);
            // Don't throw error to avoid breaking auth flow
          }
        },
      },
    ],
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    // LinkedIn temporarily disabled - add credentials to enable
    ...(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET ? {
      linkedin: {
        clientId: process.env.LINKEDIN_CLIENT_ID as string,
        clientSecret: process.env.LINKEDIN_CLIENT_SECRET as string,
      },
    } : {}),
  },
  plugins: [
    polar({
      client: polarClient,
      createCustomerOnSignUp: true,
      use: [
        checkout({
          products: [
            {
              productId:
                process.env.NEXT_PUBLIC_STARTER_TIER ||
                (() => {
                  throw new Error(
                    "NEXT_PUBLIC_STARTER_TIER environment variable is required",
                  );
                })(),
              slug:
                process.env.NEXT_PUBLIC_STARTER_SLUG ||
                (() => {
                  throw new Error(
                    "NEXT_PUBLIC_STARTER_SLUG environment variable is required",
                  );
                })(),
            },
          ],
          successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/${process.env.POLAR_SUCCESS_URL}`,
          authenticatedUsersOnly: true,
        }),
        portal(),
        usage(),
        webhooks({
          secret:
            process.env.POLAR_WEBHOOK_SECRET ||
            (() => {
              throw new Error(
                "POLAR_WEBHOOK_SECRET environment variable is required",
              );
            })(),
          onPayload: async ({ data, type }) => {
            if (
              type === "subscription.created" ||
              type === "subscription.active" ||
              type === "subscription.canceled" ||
              type === "subscription.revoked" ||
              type === "subscription.uncanceled" ||
              type === "subscription.updated"
            ) {
              console.log("🎯 Processing subscription webhook:", type);
              console.log("📦 Payload data:", JSON.stringify(data, null, 2));

              try {
                // STEP 1: Extract user ID from customer data
                const userId = data.customer?.externalId;
                // STEP 2: Build subscription data
                const subscriptionData = {
                  id: data.id,
                  createdAt: new Date(data.createdAt),
                  modifiedAt: safeParseDate(data.modifiedAt),
                  amount: data.amount,
                  currency: data.currency,
                  recurringInterval: data.recurringInterval,
                  status: data.status,
                  currentPeriodStart:
                    safeParseDate(data.currentPeriodStart) || new Date(),
                  currentPeriodEnd:
                    safeParseDate(data.currentPeriodEnd) || new Date(),
                  cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
                  canceledAt: safeParseDate(data.canceledAt),
                  startedAt: safeParseDate(data.startedAt) || new Date(),
                  endsAt: safeParseDate(data.endsAt),
                  endedAt: safeParseDate(data.endedAt),
                  customerId: data.customerId,
                  productId: data.productId,
                  discountId: data.discountId || null,
                  checkoutId: data.checkoutId || "",
                  customerCancellationReason:
                    data.customerCancellationReason || null,
                  customerCancellationComment:
                    data.customerCancellationComment || null,
                  metadata: data.metadata
                    ? JSON.stringify(data.metadata)
                    : null,
                  customFieldData: data.customFieldData
                    ? JSON.stringify(data.customFieldData)
                    : null,
                  userId: userId as string | null,
                };

                console.log("💾 Final subscription data:", {
                  id: subscriptionData.id,
                  status: subscriptionData.status,
                  userId: subscriptionData.userId,
                  amount: subscriptionData.amount,
                });

                // STEP 3: Use Drizzle's onConflictDoUpdate for proper upsert
                await db
                  .insert(subscription)
                  .values(subscriptionData)
                  .onConflictDoUpdate({
                    target: subscription.id,
                    set: {
                      modifiedAt: subscriptionData.modifiedAt || new Date(),
                      amount: subscriptionData.amount,
                      currency: subscriptionData.currency,
                      recurringInterval: subscriptionData.recurringInterval,
                      status: subscriptionData.status,
                      currentPeriodStart: subscriptionData.currentPeriodStart,
                      currentPeriodEnd: subscriptionData.currentPeriodEnd,
                      cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd,
                      canceledAt: subscriptionData.canceledAt,
                      startedAt: subscriptionData.startedAt,
                      endsAt: subscriptionData.endsAt,
                      endedAt: subscriptionData.endedAt,
                      customerId: subscriptionData.customerId,
                      productId: subscriptionData.productId,
                      discountId: subscriptionData.discountId,
                      checkoutId: subscriptionData.checkoutId,
                      customerCancellationReason:
                        subscriptionData.customerCancellationReason,
                      customerCancellationComment:
                        subscriptionData.customerCancellationComment,
                      metadata: subscriptionData.metadata,
                      customFieldData: subscriptionData.customFieldData,
                      userId: subscriptionData.userId,
                    },
                  });

                console.log("✅ Upserted subscription:", data.id);
              } catch (error) {
                console.error(
                  "💥 Error processing subscription webhook:",
                  error,
                );
                // Don't throw - let webhook succeed to avoid retries
              }
            }
          },
        }),
      ],
    }),
    nextCookies(),
  ],
});
