interface Dataset {
  id: string;
  name: string;
  description?: string;
  instanceCount: number;
  averageQualityScore: number;
  totalEditCount: number;
  careerNiches: string[];
  tags: string[];
}

interface PricingSuggestion {
  suggested: number; // in cents
  min: number;
  max: number;
  reasoning: string[];
  factors: {
    quality: number;
    quantity: number;
    uniqueness: number;
    engagement: number;
  };
}

// Hardcoded median prices for MVP (in cents)
const MEDIAN_PRICES = {
  technology: 2500, // $25
  marketing: 2000,  // $20
  sales: 1800,      // $18
  design: 2200,     // $22
  engineering: 3000, // $30
  product: 2800,    // $28
  finance: 2400,    // $24
  operations: 2000, // $20
  hr: 1500,         // $15
  consulting: 3500, // $35
  healthcare: 4000, // $40
  education: 1800,  // $18
  legal: 4500,      // $45
  realestate: 2200, // $22
  entrepreneurship: 3200, // $32
  default: 2000,    // $20
};

const BUNDLE_MULTIPLIER = 0.85; // 15% discount for bundles
const PLATFORM_FEE_RATE = 0.10; // 10% platform fee

export function calculatePricingSuggestion(dataset: Dataset): PricingSuggestion {
  const factors = {
    quality: calculateQualityFactor(dataset.averageQualityScore),
    quantity: calculateQuantityFactor(dataset.instanceCount),
    uniqueness: calculateUniquenessFactor(dataset.careerNiches, dataset.tags),
    engagement: calculateEngagementFactor(dataset.totalEditCount, dataset.instanceCount),
  };

  // Get base median price for primary career niche
  const primaryNiche = dataset.careerNiches?.[0]?.toLowerCase() || 'default';
  const medianPrice = MEDIAN_PRICES[primaryNiche as keyof typeof MEDIAN_PRICES] || MEDIAN_PRICES.default;

  // Calculate weighted score
  const weightedScore = (
    factors.quality * 0.3 +
    factors.quantity * 0.25 +
    factors.uniqueness * 0.25 +
    factors.engagement * 0.2
  );

  // Apply multiplier to median price
  const suggested = Math.round(medianPrice * weightedScore);
  const min = Math.round(suggested * 0.7);
  const max = Math.round(suggested * 1.5);

  const reasoning = generatePricingReasoning(factors, dataset, medianPrice);

  return {
    suggested,
    min,
    max,
    reasoning,
    factors,
  };
}

export function calculateBundlePricing(datasets: Dataset[]): PricingSuggestion {
  if (datasets.length === 0) {
    return {
      suggested: 0,
      min: 0,
      max: 0,
      reasoning: ["No datasets selected"],
      factors: { quality: 0, quantity: 0, uniqueness: 0, engagement: 0 },
    };
  }

  // Calculate individual prices and sum them
  const individualPrices = datasets.map(dataset => calculatePricingSuggestion(dataset));
  const totalIndividualPrice = individualPrices.reduce((sum, price) => sum + price.suggested, 0);

  // Apply bundle discount
  const bundlePrice = Math.round(totalIndividualPrice * BUNDLE_MULTIPLIER);
  const savings = totalIndividualPrice - bundlePrice;

  // Average factors
  const avgFactors = {
    quality: individualPrices.reduce((sum, price) => sum + price.factors.quality, 0) / datasets.length,
    quantity: datasets.reduce((sum, dataset) => sum + dataset.instanceCount, 0),
    uniqueness: calculateBundleUniquenessFactor(datasets),
    engagement: individualPrices.reduce((sum, price) => sum + price.factors.engagement, 0) / datasets.length,
  };

  const reasoning = [
    `Bundle of ${datasets.length} datasets`,
    `Individual total: $${(totalIndividualPrice / 100).toFixed(2)}`,
    `Bundle discount (15%): -$${(savings / 100).toFixed(2)}`,
    `Total instances: ${datasets.reduce((sum, d) => sum + d.instanceCount, 0)}`,
    `Covers ${new Set(datasets.flatMap(d => d.careerNiches)).size} career niches`,
  ];

  return {
    suggested: bundlePrice,
    min: Math.round(bundlePrice * 0.8),
    max: Math.round(bundlePrice * 1.3),
    reasoning,
    factors: avgFactors,
  };
}

function calculateQualityFactor(averageQualityScore: number): number {
  // Scale quality score (0-100) to multiplier (0.5-1.5)
  const normalizedScore = Math.max(0, Math.min(100, averageQualityScore)) / 100;
  return 0.5 + (normalizedScore * 1.0);
}

function calculateQuantityFactor(instanceCount: number): number {
  // More instances = higher value, with diminishing returns
  if (instanceCount <= 10) return 0.6;
  if (instanceCount <= 25) return 0.8;
  if (instanceCount <= 50) return 1.0;
  if (instanceCount <= 100) return 1.2;
  if (instanceCount <= 200) return 1.4;
  return 1.5;
}

function calculateUniquenessFactor(careerNiches: string[], tags: string[]): number {
  const totalTags = new Set([...(careerNiches || []), ...(tags || [])]).size;
  
  if (totalTags <= 3) return 0.7;
  if (totalTags <= 6) return 0.9;
  if (totalTags <= 10) return 1.1;
  if (totalTags <= 15) return 1.3;
  return 1.4;
}

function calculateEngagementFactor(totalEditCount: number, instanceCount: number): number {
  const avgEditsPerInstance = instanceCount > 0 ? totalEditCount / instanceCount : 0;
  
  if (avgEditsPerInstance <= 1) return 0.8;
  if (avgEditsPerInstance <= 2) return 1.0;
  if (avgEditsPerInstance <= 4) return 1.2;
  return 1.3;
}

function calculateBundleUniquenessFactor(datasets: Dataset[]): number {
  const allNiches = new Set(datasets.flatMap(d => d.careerNiches || []));
  const allTags = new Set(datasets.flatMap(d => d.tags || []));
  const totalUniqueTags = allNiches.size + allTags.size;
  
  // Bundle uniqueness bonus
  return Math.min(1.5, 1.0 + (totalUniqueTags * 0.02));
}

function generatePricingReasoning(
  factors: Record<string, number>,
  dataset: Dataset,
  medianPrice: number
): string[] {
  const reasoning: string[] = [];
  
  reasoning.push(`Base price for ${dataset.careerNiches?.[0] || 'general'} domain: $${(medianPrice / 100).toFixed(2)}`);
  
  if (factors.quality > 1.1) {
    reasoning.push(`+${Math.round((factors.quality - 1) * 100)}% for high quality (${dataset.averageQualityScore}/100 avg score)`);
  } else if (factors.quality < 0.9) {
    reasoning.push(`${Math.round((factors.quality - 1) * 100)}% for quality needs improvement`);
  }
  
  if (factors.quantity > 1.1) {
    reasoning.push(`+${Math.round((factors.quantity - 1) * 100)}% for substantial content (${dataset.instanceCount} instances)`);
  } else if (factors.quantity < 0.9) {
    reasoning.push(`${Math.round((factors.quantity - 1) * 100)}% for limited content`);
  }
  
  if (factors.uniqueness > 1.1) {
    const totalTags = new Set([...(dataset.careerNiches || []), ...(dataset.tags || [])]).size;
    reasoning.push(`+${Math.round((factors.uniqueness - 1) * 100)}% for diverse content (${totalTags} unique tags)`);
  }
  
  if (factors.engagement > 1.1) {
    const avgEdits = dataset.instanceCount > 0 ? dataset.totalEditCount / dataset.instanceCount : 0;
    reasoning.push(`+${Math.round((factors.engagement - 1) * 100)}% for high engagement (${avgEdits.toFixed(1)} edits/instance)`);
  }
  
  return reasoning;
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function calculatePlatformFee(amount: number): number {
  return Math.round(amount * PLATFORM_FEE_RATE);
}

export function calculateSellerAmount(amount: number): number {
  return amount - calculatePlatformFee(amount);
}

export function generateShareableLink(listingId: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://langset.ai";
  return `${baseUrl}/marketplace/${listingId}`;
}