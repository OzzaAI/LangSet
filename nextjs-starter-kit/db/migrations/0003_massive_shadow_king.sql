ALTER TABLE "user" ADD COLUMN "referral_code" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "referred_by" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "referral_points" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_referral_code_unique" UNIQUE("referral_code");