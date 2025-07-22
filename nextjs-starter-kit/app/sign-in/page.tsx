"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, useEffect } from "react";
import { toast } from "sonner";

function SignInContent() {
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");
  const refCode = searchParams.get("ref");

  useEffect(() => {
    // Store referral code if present in URL or localStorage
    const referralCode = refCode || (typeof window !== "undefined" ? localStorage.getItem("referralCode") : null);
    
    if (referralCode) {
      localStorage.setItem("referralCode", referralCode);
      
      // Log referral landing event
      if (typeof window !== "undefined" && window.posthog) {
        window.posthog.capture("referral_signup_page_visited", {
          referral_code: referralCode,
          timestamp: new Date().toISOString(),
        });
      }
    }
  }, [refCode]);

  return (
    <div className="flex flex-col justify-center items-center w-full h-screen">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">
            Welcome to Nextjs Starter Kit
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Use your Google account to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div
              className={cn(
                "w-full gap-2 flex items-center",
                "justify-between flex-col",
              )}
            >
              <Button
                variant="outline"
                className={cn("w-full gap-2")}
                disabled={loading}
                onClick={async () => {
                  try {
                    await authClient.signIn.social(
                      {
                        provider: "google",
                        callbackURL: returnTo || "/dashboard",
                      },
                      {
                        onRequest: () => {
                          setLoading(true);
                        },
                        onResponse: () => {
                          setLoading(false);
                        },
                        onError: (ctx) => {
                          setLoading(false);
                          // Add user-friendly error handling here
                          console.error("Sign-in failed:", ctx.error);
                        },
                      },
                    );
                  } catch (error) {
                    setLoading(false);
                    console.error("Authentication error:", error);
                    // Consider adding toast notification for user feedback
                    toast.error("Oops, something went wrong", {
                      duration: 5000,
                    });
                  }
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="0.98em"
                  height="1em"
                  viewBox="0 0 256 262"
                >
                  <path
                    fill="#4285F4"
                    d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622l38.755 30.023l2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                  ></path>
                  <path
                    fill="#34A853"
                    d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055c-34.523 0-63.824-22.773-74.269-54.25l-1.531.13l-40.298 31.187l-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                  ></path>
                  <path
                    fill="#FBBC05"
                    d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82c0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602z"
                  ></path>
                  <path
                    fill="#EB4335"
                    d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0C79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                  ></path>
                </svg>
                Login with Google
              </Button>
              {/* LinkedIn temporarily disabled - uncomment when credentials are added
              <Button
                variant="outline"
                className={cn("w-full gap-2")}
                disabled={loading}
                onClick={async () => {
                  try {
                    await authClient.signIn.social(
                      {
                        provider: "linkedin",
                        callbackURL: returnTo || "/dashboard/profile",
                      },
                      {
                        onRequest: () => {
                          setLoading(true);
                        },
                        onResponse: () => {
                          setLoading(false);
                        },
                        onError: (ctx) => {
                          setLoading(false);
                          console.error("LinkedIn sign-in failed:", ctx.error);
                          toast.error("LinkedIn sign-in failed. Please try again.", {
                            duration: 5000,
                          });
                        },
                      },
                    );
                  } catch (error) {
                    setLoading(false);
                    console.error("LinkedIn authentication error:", error);
                    toast.error("Oops, something went wrong with LinkedIn", {
                      duration: 5000,
                    });
                  }
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  viewBox="0 0 256 256"
                >
                  <g fill="none">
                    <rect width="256" height="256" fill="#0A66C2" rx="60" />
                    <rect width="256" height="256" fill="#0A66C2" rx="60" />
                    <path
                      fill="#fff"
                      d="M184.715 127.007c0-33.558-25.581-55.856-57.914-55.856c-15.893 0-29.258 5.024-38.832 15.34c-8.813 9.515-13.578 23.054-13.578 38.516c0 33.558 25.581 55.856 57.914 55.856c15.893 0 29.258-5.024 38.832-15.34c8.813-9.515 13.578-23.054 13.578-38.516ZM140.429 71.019c26.127 0 43.386 17.749 43.386 41.388c0 23.639-17.259 41.388-43.386 41.388c-26.127 0-43.386-17.749-43.386-41.388c0-23.639 17.259-41.388 43.386-41.388Z"
                    />
                    <path
                      fill="#fff"
                      d="M49.923 89.441H82.48v119.094H49.923V89.441ZM66.204 52.467c10.678 0 19.336 8.659 19.336 19.336c0 10.678-8.658 19.336-19.336 19.336c-10.677 0-19.336-8.658-19.336-19.336c0-10.677 8.659-19.336 19.336-19.336Z"
                    />
                  </g>
                </svg>
                Login with LinkedIn
              </Button>
              */}
            </div>
          </div>
        </CardContent>
      </Card>
      <p className="mt-6 text-xs text-center text-gray-500 dark:text-gray-400 max-w-md">
        By signing in, you agree to our{" "}
        <Link
          href="/terms-of-service"
          className="underline hover:text-gray-700 dark:hover:text-gray-300"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy-policy"
          className="underline hover:text-gray-700 dark:hover:text-gray-300"
        >
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}

export default function SignIn() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col justify-center items-center w-full h-screen">
          <div className="max-w-md w-full bg-gray-200 dark:bg-gray-800 animate-pulse rounded-lg h-96"></div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
