ALTER TABLE "user" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "career_niches" jsonb;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "skills" jsonb;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "profile_complete" boolean DEFAULT false;