ALTER TABLE "user" ADD COLUMN "linkedin_profile" jsonb;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "credibility_score" integer DEFAULT 0;