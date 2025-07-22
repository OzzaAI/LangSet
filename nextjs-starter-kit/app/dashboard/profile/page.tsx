"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { TagsInput } from "@/components/ui/tags-input";
import { Checkbox } from "@/components/ui/checkbox";
import { generateReferralLink } from "@/lib/referral";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Copy } from "lucide-react";

const CAREER_NICHES = [
  "Marketing",
  "Technology",
  "Sales",
  "Design",
  "Engineering",
  "Product Management",
  "Finance",
  "Operations",
  "Human Resources",
  "Consulting",
  "Healthcare",
  "Education",
  "Legal",
  "Real Estate",
  "Entrepreneurship",
];

const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  bio: z.string().max(500, "Bio is too long").optional(),
  careerNiches: z.array(z.string()).min(1, "Select at least one career niche").max(5, "Select up to 5 career niches"),
  skills: z.array(z.string()).min(1, "Add at least one skill").max(15, "Add up to 15 skills"),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

interface LinkedInProfile {
  id?: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  industry?: string;
  positions?: {
    values: Array<{
      company: { name: string };
      title: string;
      startDate: { year: number; month?: number };
      endDate?: { year: number; month?: number };
      isCurrent: boolean;
    }>;
  };
}

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  bio?: string;
  careerNiches?: string[];
  skills?: string[];
  profileComplete?: boolean;
  referralCode?: string;
  referredBy?: string;
  referralPoints?: number;
  linkedinProfile?: LinkedInProfile;
  credibilityScore?: number;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      bio: "",
      careerNiches: [],
      skills: [],
    },
  });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch("/api/profile");
        if (!response.ok) {
          if (response.status === 401) {
            router.push("/sign-in");
            return;
          }
          throw new Error("Failed to fetch profile");
        }
        
        const data = await response.json();
        setUser(data.user);
        
        // Pre-fill form with existing data or LinkedIn data
        const linkedinProfile = data.user.linkedinProfile;
        const defaultName = data.user.name || 
          (linkedinProfile ? `${linkedinProfile.firstName || ''} ${linkedinProfile.lastName || ''}`.trim() : '');
        const defaultBio = data.user.bio || linkedinProfile?.headline || '';
        const defaultSkills = data.user.skills || [];
        const defaultCareerNiches = data.user.careerNiches || [];
        
        form.reset({
          name: defaultName,
          bio: defaultBio,
          careerNiches: defaultCareerNiches,
          skills: defaultSkills,
        });

        // Check for referral code and track if this is a new user
        const referralCode = localStorage.getItem("referralCode");
        if (referralCode && !data.user.referredBy && !data.user.profileComplete) {
          trackReferral(referralCode);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        toast.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router, form]);

  const onSubmit = async (values: ProfileFormValues) => {
    setSaving(true);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      toast.success("Profile updated successfully!");
      
      // Redirect to dashboard after successful save
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Error updating profile:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update profile");
      }
    } finally {
      setSaving(false);
    }
  };

  const trackReferral = async (referralCode: string) => {
    try {
      const response = await fetch("/api/referral/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ referralCode }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`You were referred by ${data.referrer.name}! 🎉`);
        localStorage.removeItem("referralCode"); // Clean up
        
        // Log successful referral tracking
        if (typeof window !== "undefined" && window.posthog) {
          window.posthog.capture("referral_tracked", {
            referral_code: referralCode,
            referrer_name: data.referrer.name,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error("Error tracking referral:", error);
    }
  };

  const handleCareerNicheToggle = (niche: string, checked: boolean) => {
    const currentNiches = form.getValues("careerNiches");
    if (checked) {
      if (currentNiches.length < 5) {
        form.setValue("careerNiches", [...currentNiches, niche]);
      } else {
        toast.error("You can select up to 5 career niches");
      }
    } else {
      form.setValue("careerNiches", currentNiches.filter(n => n !== niche));
    }
  };

  const copyReferralLink = async () => {
    if (!user?.referralCode) {
      toast.error("Referral code not available");
      return;
    }

    const referralLink = generateReferralLink(user.referralCode);
    
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success("Referral link copied to clipboard!");
      
      // Log referral link copy event
      if (typeof window !== "undefined" && window.posthog) {
        window.posthog.capture("referral_link_copied", {
          referral_code: user.referralCode,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      toast.error("Failed to copy link. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
          <CardDescription>
            Fill out your profile information to get started. We&apos;ve pre-filled some fields from your LinkedIn profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Tell us about yourself, your background, and what you&apos;re passionate about..."
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Share your professional background and interests (optional, max 500 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Career Niches */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Career Niches</h3>
                <FormField
                  control={form.control}
                  name="careerNiches"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select your areas of expertise *</FormLabel>
                      <FormDescription>
                        Choose up to 5 career areas that best describe your professional focus
                      </FormDescription>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                        {CAREER_NICHES.map((niche) => (
                          <div key={niche} className="flex items-center space-x-2">
                            <Checkbox
                              id={niche}
                              checked={field.value.includes(niche)}
                              onCheckedChange={(checked) => handleCareerNicheToggle(niche, checked as boolean)}
                            />
                            <label htmlFor={niche} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              {niche}
                            </label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Skills */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Skills</h3>
                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Your skills and expertise *</FormLabel>
                      <FormControl>
                        <TagsInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Add a skill and press Enter"
                        />
                      </FormControl>
                      <FormDescription>
                        Add your key skills, technologies, and areas of expertise (e.g., &quot;JavaScript&quot;, &quot;Project Management&quot;, &quot;Data Analysis&quot;)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* LinkedIn Profile Summary */}
              {user.linkedinProfile && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">LinkedIn Profile Summary</h3>
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {user.linkedinProfile.firstName} {user.linkedinProfile.lastName}
                        </p>
                        {user.linkedinProfile.headline && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {user.linkedinProfile.headline}
                          </p>
                        )}
                        {user.linkedinProfile.industry && (
                          <p className="text-sm text-gray-500 mt-1">
                            Industry: {user.linkedinProfile.industry}
                          </p>
                        )}
                      </div>
                      {user.credibilityScore && (
                        <div className="text-right">
                          <p className="text-sm font-medium">Credibility Score</p>
                          <p className="text-lg font-bold text-blue-600">
                            {user.credibilityScore}/100
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Referral Section */}
              {user.referralCode && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Referral Program</h3>
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 p-4 rounded-lg">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Share your referral link and earn points when friends join!
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white dark:bg-gray-800 p-2 rounded border text-sm font-mono">
                            {generateReferralLink(user.referralCode)}
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={copyReferralLink}
                            className="shrink-0"
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2">
                        <div>
                          <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                            Your Referral Code
                          </p>
                          <p className="text-lg font-bold text-purple-800 dark:text-purple-200">
                            {user.referralCode}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-purple-700 dark:text-purple-300">
                            Referral Points
                          </p>
                          <p className="text-lg font-bold text-purple-800 dark:text-purple-200">
                            {user.referralPoints || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex gap-4 pt-6">
                <Button 
                  type="submit" 
                  disabled={saving}
                  className="flex-1"
                >
                  {saving ? "Saving Profile..." : "Save Profile"}
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => router.push("/dashboard")}
                  className="flex-1"
                >
                  Skip for Now
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}