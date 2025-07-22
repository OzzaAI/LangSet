import { auth } from "@/lib/auth";
import { db } from "@/db/drizzle";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  bio: z.string().max(500, "Bio is too long").optional(),
  careerNiches: z.array(z.string()).max(10, "Too many career niches selected"),
  skills: z.array(z.string()).max(20, "Too many skills selected"),
});

export async function PUT(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate the request body
    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Validation failed", 
          details: validation.error.flatten().fieldErrors 
        },
        { status: 400 }
      );
    }

    const { name, bio, careerNiches, skills } = validation.data;

    // Check if profile is complete
    const profileComplete = !!(
      name && 
      bio && 
      careerNiches.length > 0 && 
      skills.length > 0
    );

    // Update user profile in database
    const updatedUser = await db
      .update(user)
      .set({
        name,
        bio: bio || null,
        careerNiches,
        skills,
        profileComplete,
        updatedAt: new Date(),
      })
      .where(eq(user.id, session.user.id))
      .returning();

    if (!updatedUser.length) {
      return NextResponse.json(
        { error: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      profileComplete,
      user: updatedUser[0],
    });

  } catch (error) {
    console.error("Error updating profile:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the current session
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch user profile from database
    const userProfile = await db
      .select()
      .from(user)
      .where(eq(user.id, session.user.id))
      .limit(1);

    if (!userProfile.length) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user: userProfile[0],
    });

  } catch (error) {
    console.error("Error fetching profile:", error);
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}