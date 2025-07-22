import { betterAuth } from "better-auth";
import { genericOAuth } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db/drizzle";
import { user, account, session, verification } from "@/db/schema";

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
    },
  }),
  plugins: [
    genericOAuth({
      config: [
        {
          providerId: "linkedin",
          clientId: process.env.LINKEDIN_CLIENT_ID!,
          clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
          authorizationUrl: "https://www.linkedin.com/oauth/v2/authorization",
          tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
          scopes: ["openid", "profile", "email"],
          redirectUrl: "http://localhost:3000/api/auth/oauth2/callback/linkedin",
        }
      ]
    })
  ]
});

