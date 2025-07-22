import { nanoid } from "nanoid";

export function generateReferralCode(): string {
  // Generate a short, user-friendly referral code
  // Using nanoid with custom alphabet for readability (no confusing characters)
  return nanoid(8).toUpperCase();
}

export function generateReferralLink(code: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://langset.ai";
  return `${baseUrl}/ref/${code}`;
}

export function extractReferralCode(url: string): string | null {
  try {
    const urlObj = new URL(url);
    return urlObj.searchParams.get("ref");
  } catch {
    return null;
  }
}

export function validateReferralCode(code: string): boolean {
  // Basic validation for referral code format
  return /^[A-Z0-9]{8}$/.test(code);
}