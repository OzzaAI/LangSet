import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";

// Helper function to retry database operations, but don't catch NEXT_REDIRECT errors
async function retryDbOperation<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const err = error as Error;
      
      // Don't retry if it's a NEXT_REDIRECT error - let it bubble up
      if (err.message === 'NEXT_REDIRECT') {
        throw error;
      }
      
      lastError = err;
      console.warn(`Database operation attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError!;
}

export default async function Dashboard() {
  const result = await auth.api.getSession({
    headers: await headers(),
  });

  if (!result?.session?.userId) {
    redirect("/sign-in");
  }

  const userId = result.session.userId;

  try {
    // Check if user has a role in the user table with retry logic
    const userRole = await retryDbOperation(async () => {
      return await db
        .select({ role: user.role })
        .from(user)
        .where(eq(user.id, userId))
        .limit(1);
    });

    // Redirect based on role
    if (userRole.length > 0) {
      const role = userRole[0].role.toLowerCase();
      
      switch (role) {
        case 'coach':
          redirect("/dashboard/coach");
        case 'agency':
        case 'admin':
          redirect("/dashboard/agency");
        case 'client':
          redirect("/dashboard/client");
        default:
          // Default to coach if role is unknown
          redirect("/dashboard/coach");
      }
    } else {
      // If no role found, default to coach portal
      redirect("/dashboard/coach");
    }
  } catch (dbError) {
    console.error("Database error after retries, defaulting to coach portal:", dbError);
    // If database is unavailable after retries, default to coach portal
    redirect("/dashboard/coach");
  }

  // This should never be reached due to redirects above
  return null;
}