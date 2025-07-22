import {
  boolean,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// Better Auth Tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  bio: text("bio"),
  careerNiches: jsonb("career_niches"),
  skills: jsonb("skills"),
  profileComplete: boolean("profile_complete").default(false),
  referralCode: text("referral_code").unique(),
  referredBy: text("referred_by"),
  referralPoints: integer("referral_points").default(0),
  dailyEditsCount: integer("daily_edits_count").default(0),
  lastEditDate: timestamp("last_edit_date"),
  linkedinProfile: jsonb("linkedin_profile"),
  credibilityScore: integer("credibility_score").default(0),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Subscription table for Polar webhook data
export const subscription = pgTable("subscription", {
  id: text("id").primaryKey(),
  createdAt: timestamp("createdAt").notNull(),
  modifiedAt: timestamp("modifiedAt"),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  recurringInterval: text("recurringInterval").notNull(),
  status: text("status").notNull(),
  currentPeriodStart: timestamp("currentPeriodStart").notNull(),
  currentPeriodEnd: timestamp("currentPeriodEnd").notNull(),
  cancelAtPeriodEnd: boolean("cancelAtPeriodEnd").notNull().default(false),
  canceledAt: timestamp("canceledAt"),
  startedAt: timestamp("startedAt").notNull(),
  endsAt: timestamp("endsAt"),
  endedAt: timestamp("endedAt"),
  customerId: text("customerId").notNull(),
  productId: text("productId").notNull(),
  discountId: text("discountId"),
  checkoutId: text("checkoutId").notNull(),
  customerCancellationReason: text("customerCancellationReason"),
  customerCancellationComment: text("customerCancellationComment"),
  metadata: text("metadata"), // JSON string
  customFieldData: text("customFieldData"), // JSON string
  userId: text("userId").references(() => user.id),
});

// Dataset and Instance tables for editing mode
export const dataset = pgTable("dataset", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const instance = pgTable("instance", {
  id: text("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  tags: jsonb("tags"),
  qualityScore: integer("quality_score").default(0),
  editCount: integer("edit_count").default(0),
  lastEditedBy: text("last_edited_by").references(() => user.id),
  lastEditedAt: timestamp("last_edited_at"),
  datasetId: text("dataset_id").notNull().references(() => dataset.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Marketplace tables
export const listing = pgTable("listing", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  price: integer("price").notNull(), // price in cents
  currency: text("currency").notNull().default("USD"),
  isActive: boolean("is_active").notNull().default(true),
  isBundle: boolean("is_bundle").notNull().default(false),
  bundleDatasets: jsonb("bundle_datasets"), // array of dataset IDs for bundles
  shareableLink: text("shareable_link").unique(),
  views: integer("views").default(0),
  sellerId: text("seller_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  datasetId: text("dataset_id").references(() => dataset.id, { onDelete: "cascade" }), // null for bundles
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const offer = pgTable("offer", {
  id: text("id").primaryKey(),
  amount: integer("amount").notNull(), // amount in cents
  currency: text("currency").notNull().default("USD"),
  message: text("message"),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected, expired
  expiresAt: timestamp("expires_at"),
  buyerId: text("buyer_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  listingId: text("listing_id").notNull().references(() => listing.id, { onDelete: "cascade" }),
  datasetId: text("dataset_id").references(() => dataset.id, { onDelete: "cascade" }),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const transaction = pgTable("transaction", {
  id: text("id").primaryKey(),
  amount: integer("amount").notNull(), // total amount in cents
  platformFee: integer("platform_fee").notNull(), // 10% platform fee in cents
  sellerAmount: integer("seller_amount").notNull(), // amount after platform fee
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("pending"), // pending, completed, failed, refunded
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  buyerId: text("buyer_id").notNull().references(() => user.id),
  sellerId: text("seller_id").notNull().references(() => user.id),
  listingId: text("listing_id").notNull().references(() => listing.id),
  offerId: text("offer_id").references(() => offer.id),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});
