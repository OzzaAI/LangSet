"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { validateReferralCode } from "@/lib/referral";

export default function ReferralPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;

  useEffect(() => {
    if (code && validateReferralCode(code)) {
      // Store referral code in localStorage for the signup process
      localStorage.setItem("referralCode", code);
      
      // Log referral click event
      if (typeof window !== "undefined" && window.posthog) {
        window.posthog.capture("referral_link_clicked", {
          referral_code: code,
          timestamp: new Date().toISOString(),
        });
      }
      
      // Redirect to signup with ref parameter
      router.push(`/sign-in?ref=${code}`);
    } else {
      // Invalid referral code, redirect to signup without ref
      router.push("/sign-in");
    }
  }, [code, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Processing referral link...</p>
      </div>
    </div>
  );
}