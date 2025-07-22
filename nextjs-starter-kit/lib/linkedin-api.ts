interface LinkedInProfile {
  id: string;
  firstName: string;
  lastName: string;
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

export async function fetchLinkedInProfile(accessToken: string): Promise<LinkedInProfile | null> {
  try {
    // Fetch basic profile using v2 API
    const profileResponse = await fetch(
      'https://api.linkedin.com/v2/people/~:(id,firstName,lastName,headline,industry)',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Restli-Protocol-Version': '2.0.0',
        },
      }
    );

    if (!profileResponse.ok) {
      console.error('Failed to fetch LinkedIn profile:', profileResponse.statusText);
      return null;
    }

    const profileData = await profileResponse.json();

    // Note: LinkedIn positions endpoint requires additional permissions (r_fullprofile)
    // For basic verification, we'll skip positions for now
    let positions = null;
    try {
      // This endpoint requires r_fullprofile permission which needs approval from LinkedIn
      const positionsResponse = await fetch(
        'https://api.linkedin.com/v2/people/~/positions:(id,title,summary,start-date,end-date,is-current,company:(id,name,industry))',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'X-Restli-Protocol-Version': '2.0.0',
          },
        }
      );

      if (positionsResponse.ok) {
        positions = await positionsResponse.json();
      }
    } catch (error) {
      console.warn('Failed to fetch LinkedIn positions:', error);
    }

    return {
      id: profileData.id,
      firstName: profileData.firstName?.localized?.en_US || profileData.firstName,
      lastName: profileData.lastName?.localized?.en_US || profileData.lastName,
      headline: profileData.headline?.localized?.en_US || profileData.headline,
      industry: profileData.industry?.localized?.en_US || profileData.industry,
      positions: positions,
    };
  } catch (error) {
    console.error('Error fetching LinkedIn profile:', error);
    return null;
  }
}

export function calculateCredibilityScore(profile: LinkedInProfile): number {
  let score = 0;

  // Base score for having a LinkedIn profile
  score += 20;

  // Profile completeness (40 points max)
  if (profile.firstName && profile.lastName) score += 10;
  if (profile.headline) score += 10;
  if (profile.industry) score += 10;
  if (profile.positions?.values?.length) score += 10;

  // Experience scoring (40 points max)
  if (profile.positions?.values?.length) {
    const experienceYears = calculateExperienceYears(profile.positions);
    
    if (experienceYears >= 10) score += 40;
    else if (experienceYears >= 5) score += 30;
    else if (experienceYears >= 2) score += 20;
    else if (experienceYears >= 1) score += 10;
  }

  return Math.min(score, 100);
}

function calculateExperienceYears(positions: LinkedInProfile['positions']): number {
  if (!positions?.values?.length) return 0;
  
  const totalMonths = positions.values.reduce((total, position) => {
    const startYear = position.startDate.year;
    const startMonth = position.startDate.month || 1;
    const endYear = position.endDate?.year || new Date().getFullYear();
    const endMonth = position.endDate?.month || new Date().getMonth() + 1;
    
    const months = (endYear - startYear) * 12 + (endMonth - startMonth);
    return total + Math.max(0, months);
  }, 0);
  
  return Math.floor(totalMonths / 12);
}