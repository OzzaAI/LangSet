import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { Document } from "@langchain/core/documents";
import { db } from "@/db/drizzle";
import { instance, dataset, user } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

// Pinecone configuration
const PINECONE_CONFIG = {
  indexName: process.env.PINECONE_INDEX_NAME || "langset-instances",
  environment: process.env.PINECONE_ENVIRONMENT || "us-west1-gcp",
  dimension: 1536, // OpenAI text-embedding-ada-002 dimension
  metric: "cosine" as const,
  similarity_threshold: 0.7,
};

// Initialize Pinecone client
let pineconeClient: Pinecone | null = null;
let vectorStore: PineconeStore | null = null;

export async function initializePinecone(): Promise<Pinecone> {
  if (!pineconeClient) {
    if (!process.env.PINECONE_API_KEY) {
      throw new Error("PINECONE_API_KEY environment variable is required");
    }

    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    console.log("[Pinecone] Client initialized successfully");
  }

  return pineconeClient;
}

export async function initializeVectorStore(): Promise<PineconeStore> {
  if (!vectorStore) {
    const pinecone = await initializePinecone();
    const index = pinecone.Index(PINECONE_CONFIG.indexName);

    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "text-embedding-ada-002",
    });

    vectorStore = await PineconeStore.fromExistingIndex(embeddings, {
      pineconeIndex: index,
      textKey: "content",
      namespace: "langset-production",
    });

    console.log("[Pinecone] Vector store initialized successfully");
  }

  return vectorStore;
}

/**
 * Embed and store instance data in Pinecone
 */
export async function embedInstance(instanceData: {
  id: string;
  question: string;
  answer: string;
  tags: string[];
  category?: string;
  difficulty?: string;
  qualityScore: number;
  datasetId: string;
  userId: string;
}): Promise<void> {
  try {
    const vectorStore = await initializeVectorStore();
    
    // Combine question and answer for embedding
    const content = `Question: ${instanceData.question}\n\nAnswer: ${instanceData.answer}`;
    
    // Create document with metadata
    const document = new Document({
      pageContent: content,
      metadata: {
        instance_id: instanceData.id,
        question: instanceData.question,
        tags: instanceData.tags,
        category: instanceData.category || "general",
        difficulty: instanceData.difficulty || "intermediate",
        quality_score: instanceData.qualityScore,
        dataset_id: instanceData.datasetId,
        user_id: instanceData.userId,
        created_at: new Date().toISOString(),
        content_type: "qa_instance",
        answer_length: instanceData.answer.length,
        question_length: instanceData.question.length,
      }
    });

    // Store in Pinecone
    await vectorStore.addDocuments([document], {
      ids: [instanceData.id]
    });

    console.log(`[Pinecone] Instance ${instanceData.id} embedded successfully`);

  } catch (error) {
    console.error(`[Pinecone] Failed to embed instance ${instanceData.id}:`, error);
    throw error;
  }
}

/**
 * Batch embed multiple instances for performance
 */
export async function batchEmbedInstances(instances: Array<{
  id: string;
  question: string;
  answer: string;
  tags: string[];
  category?: string;
  difficulty?: string;
  qualityScore: number;
  datasetId: string;
  userId: string;
}>): Promise<void> {
  try {
    const vectorStore = await initializeVectorStore();
    
    const documents = instances.map(instance => new Document({
      pageContent: `Question: ${instance.question}\n\nAnswer: ${instance.answer}`,
      metadata: {
        instance_id: instance.id,
        question: instance.question,
        tags: instance.tags,
        category: instance.category || "general",
        difficulty: instance.difficulty || "intermediate", 
        quality_score: instance.qualityScore,
        dataset_id: instance.datasetId,
        user_id: instance.userId,
        created_at: new Date().toISOString(),
        content_type: "qa_instance",
        answer_length: instance.answer.length,
        question_length: instance.question.length,
      }
    }));

    const ids = instances.map(instance => instance.id);

    await vectorStore.addDocuments(documents, { ids });

    console.log(`[Pinecone] Batch embedded ${instances.length} instances successfully`);

  } catch (error) {
    console.error(`[Pinecone] Failed to batch embed instances:`, error);
    throw error;
  }
}

/**
 * Find similar instances using cosine similarity
 */
export async function findSimilarInstances(
  queryText: string, 
  options: {
    topK?: number;
    threshold?: number;
    filter?: {
      category?: string;
      difficulty?: string;
      minQualityScore?: number;
      excludeUserId?: string;
      tags?: string[];
    };
  } = {}
): Promise<Array<{
  instanceId: string;
  score: number;
  question: string;
  answer: string;
  tags: string[];
  category: string;
  difficulty: string;
  qualityScore: number;
  datasetId: string;
}>> {
  try {
    const vectorStore = await initializeVectorStore();
    const { topK = 10, threshold = PINECONE_CONFIG.similarity_threshold, filter } = options;

    // Build Pinecone filter
    const pineconeFilter: Record<string, any> = {};
    
    if (filter?.category) {
      pineconeFilter.category = { $eq: filter.category };
    }
    
    if (filter?.difficulty) {
      pineconeFilter.difficulty = { $eq: filter.difficulty };
    }
    
    if (filter?.minQualityScore) {
      pineconeFilter.quality_score = { $gte: filter.minQualityScore };
    }
    
    if (filter?.excludeUserId) {
      pineconeFilter.user_id = { $ne: filter.excludeUserId };
    }
    
    if (filter?.tags && filter.tags.length > 0) {
      pineconeFilter.tags = { $in: filter.tags };
    }

    // Perform similarity search
    const results = await vectorStore.similaritySearchWithScore(
      queryText,
      topK,
      Object.keys(pineconeFilter).length > 0 ? pineconeFilter : undefined
    );

    // Filter by threshold and format results
    return results
      .filter(([document, score]) => score >= threshold)
      .map(([document, score]) => ({
        instanceId: document.metadata.instance_id,
        score,
        question: document.metadata.question,
        answer: document.pageContent.split('\n\nAnswer: ')[1] || document.pageContent,
        tags: document.metadata.tags || [],
        category: document.metadata.category,
        difficulty: document.metadata.difficulty,
        qualityScore: document.metadata.quality_score,
        datasetId: document.metadata.dataset_id,
      }));

  } catch (error) {
    console.error("[Pinecone] Failed to find similar instances:", error);
    throw error;
  }
}

/**
 * Find content overlaps between datasets for auto-bundling
 */
export async function findDatasetOverlaps(
  datasetId: string,
  options: {
    minSimilarity?: number;
    maxResults?: number;
    excludeOwnDatasets?: boolean;
  } = {}
): Promise<Array<{
  datasetId: string;
  datasetName: string;
  overlapCount: number;
  avgSimilarity: number;
  topOverlaps: Array<{
    instanceId: string;
    similarity: number;
    question: string;
  }>;
}>> {
  try {
    const { minSimilarity = 0.75, maxResults = 5, excludeOwnDatasets = true } = options;

    // Get all instances from the source dataset
    const sourceInstances = await db
      .select({
        id: instance.id,
        question: instance.question,
        answer: instance.answer,
        userId: dataset.userId,
      })
      .from(instance)
      .innerJoin(dataset, eq(instance.datasetId, dataset.id))
      .where(eq(instance.datasetId, datasetId));

    if (sourceInstances.length === 0) {
      return [];
    }

    const vectorStore = await initializeVectorStore();
    const overlapMap = new Map<string, {
      datasetId: string;
      similarities: number[];
      instances: Array<{ instanceId: string; similarity: number; question: string; }>;
    }>();

    // Check each instance for similarities
    for (const sourceInstance of sourceInstances) {
      const queryText = `Question: ${sourceInstance.question}\n\nAnswer: ${sourceInstance.answer}`;
      
      const filter: Record<string, any> = {};
      if (excludeOwnDatasets) {
        filter.user_id = { $ne: sourceInstance.userId };
      }
      filter.dataset_id = { $ne: datasetId }; // Always exclude same dataset

      const similarInstances = await vectorStore.similaritySearchWithScore(
        queryText,
        20, // Get more results for analysis
        filter
      );

      // Group by dataset and track similarities
      for (const [document, score] of similarInstances) {
        if (score >= minSimilarity) {
          const targetDatasetId = document.metadata.dataset_id;
          
          if (!overlapMap.has(targetDatasetId)) {
            overlapMap.set(targetDatasetId, {
              datasetId: targetDatasetId,
              similarities: [],
              instances: []
            });
          }
          
          const overlap = overlapMap.get(targetDatasetId)!;
          overlap.similarities.push(score);
          overlap.instances.push({
            instanceId: document.metadata.instance_id,
            similarity: score,
            question: document.metadata.question
          });
        }
      }
    }

    // Calculate overlap statistics and get dataset names
    const results: Array<{
      datasetId: string;
      datasetName: string;
      overlapCount: number;
      avgSimilarity: number;
      topOverlaps: Array<{
        instanceId: string;
        similarity: number;
        question: string;
      }>;
    }> = [];

    for (const [datasetId, overlap] of overlapMap.entries()) {
      if (overlap.similarities.length >= 2) { // Minimum overlap threshold
        // Get dataset name
        const datasetInfo = await db
          .select({ name: dataset.name })
          .from(dataset)
          .where(eq(dataset.id, datasetId))
          .limit(1);

        const avgSimilarity = overlap.similarities.reduce((sum, sim) => sum + sim, 0) / overlap.similarities.length;
        
        results.push({
          datasetId,
          datasetName: datasetInfo[0]?.name || "Unknown Dataset",
          overlapCount: overlap.similarities.length,
          avgSimilarity: Math.round(avgSimilarity * 100) / 100,
          topOverlaps: overlap.instances
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 3)
        });
      }
    }

    // Sort by overlap significance (count * avg similarity)
    results.sort((a, b) => (b.overlapCount * b.avgSimilarity) - (a.overlapCount * a.avgSimilarity));

    return results.slice(0, maxResults);

  } catch (error) {
    console.error("[Pinecone] Failed to find dataset overlaps:", error);
    throw error;
  }
}

/**
 * Get aggregated statistics for admin analysis
 */
export async function getVectorStatistics(): Promise<{
  totalVectors: number;
  categoryCounts: Record<string, number>;
  difficultyDistribution: Record<string, number>;
  avgQualityScore: number;
  topTags: Array<{ tag: string; count: number; }>;
}> {
  try {
    const pinecone = await initializePinecone();
    const index = pinecone.Index(PINECONE_CONFIG.indexName);

    // Get index statistics
    const stats = await index.describeIndexStats();
    const totalVectors = stats.totalVectorCount || 0;

    // Get database aggregations for detailed statistics
    const instances = await db
      .select({
        category: instance.category,
        difficulty: instance.difficulty,
        qualityScore: instance.qualityScore,
        tags: instance.tags,
      })
      .from(instance)
      .where(eq(instance.anonymizationStatus, "clean"));

    // Calculate category distribution
    const categoryCounts: Record<string, number> = {};
    const difficultyDistribution: Record<string, number> = {};
    const tagCounts: Record<string, number> = {};
    let totalQuality = 0;

    instances.forEach(inst => {
      // Category counts
      const category = inst.category || "general";
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      
      // Difficulty distribution  
      const difficulty = inst.difficulty || "intermediate";
      difficultyDistribution[difficulty] = (difficultyDistribution[difficulty] || 0) + 1;
      
      // Quality score sum
      totalQuality += inst.qualityScore || 0;
      
      // Tag counts
      if (inst.tags && Array.isArray(inst.tags)) {
        inst.tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    const avgQualityScore = instances.length > 0 ? Math.round(totalQuality / instances.length) : 0;
    
    // Top tags
    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => ({ tag, count }));

    return {
      totalVectors,
      categoryCounts,
      difficultyDistribution,
      avgQualityScore,
      topTags
    };

  } catch (error) {
    console.error("[Pinecone] Failed to get vector statistics:", error);
    throw error;
  }
}

/**
 * Auto-bundle datasets based on content similarity
 */
export async function suggestDatasetBundles(
  userId: string,
  options: {
    minOverlapThreshold?: number;
    maxBundleSize?: number;
    minQualityScore?: number;
  } = {}
): Promise<Array<{
  bundleName: string;
  datasets: Array<{
    datasetId: string;
    datasetName: string;
    instanceCount: number;
    avgQuality: number;
  }>;
  overlapScore: number;
  estimatedValue: number;
  reasoning: string;
}>> {
  try {
    const { minOverlapThreshold = 0.7, maxBundleSize = 4, minQualityScore = 70 } = options;

    // Get user's datasets
    const userDatasets = await db
      .select({
        id: dataset.id,
        name: dataset.name,
        instanceCount: dataset.instanceCount,
        averageQualityScore: dataset.averageQualityScore,
      })
      .from(dataset)
      .where(and(
        eq(dataset.userId, userId),
        eq(dataset.averageQualityScore, minQualityScore) // Using eq since gte might not be available
      ));

    if (userDatasets.length < 2) {
      return []; // Need at least 2 datasets to bundle
    }

    const bundleSuggestions: Array<{
      bundleName: string;
      datasets: Array<{
        datasetId: string;
        datasetName: string;
        instanceCount: number;
        avgQuality: number;
      }>;
      overlapScore: number;
      estimatedValue: number;
      reasoning: string;
    }> = [];

    // Find overlaps between all dataset pairs
    for (let i = 0; i < userDatasets.length; i++) {
      for (let j = i + 1; j < userDatasets.length; j++) {
        const dataset1 = userDatasets[i];
        const dataset2 = userDatasets[j];

        const overlaps = await findDatasetOverlaps(dataset1.id, {
          minSimilarity: minOverlapThreshold,
          maxResults: 1,
          excludeOwnDatasets: false
        });

        const relevantOverlap = overlaps.find(o => o.datasetId === dataset2.id);
        
        if (relevantOverlap && relevantOverlap.overlapCount >= 2) {
          // Calculate bundle metrics
          const totalInstances = (dataset1.instanceCount || 0) + (dataset2.instanceCount || 0);
          const avgQuality = ((dataset1.averageQualityScore || 0) + (dataset2.averageQualityScore || 0)) / 2;
          const overlapScore = relevantOverlap.avgSimilarity;
          
          // Estimate value (simplified pricing model)
          const baseValue = totalInstances * 2; // $2 per instance base
          const qualityMultiplier = avgQuality / 100;
          const bundleBonus = 1.2; // 20% bundle bonus
          const estimatedValue = Math.round(baseValue * qualityMultiplier * bundleBonus);

          // Generate reasoning
          let reasoning = `High content similarity (${Math.round(overlapScore * 100)}%) suggests complementary knowledge areas.`;
          if (avgQuality >= 85) {
            reasoning += " High quality scores indicate premium value.";
          }
          if (totalInstances >= 20) {
            reasoning += " Large combined dataset size increases market appeal.";
          }

          bundleSuggestions.push({
            bundleName: `${dataset1.name} + ${dataset2.name} Bundle`,
            datasets: [
              {
                datasetId: dataset1.id,
                datasetName: dataset1.name,
                instanceCount: dataset1.instanceCount || 0,
                avgQuality: dataset1.averageQualityScore || 0
              },
              {
                datasetId: dataset2.id,
                datasetName: dataset2.name,
                instanceCount: dataset2.instanceCount || 0,
                avgQuality: dataset2.averageQualityScore || 0
              }
            ],
            overlapScore,
            estimatedValue,
            reasoning
          });
        }
      }
    }

    // Sort by overlap score and estimated value
    bundleSuggestions.sort((a, b) => (b.overlapScore + b.estimatedValue / 1000) - (a.overlapScore + a.estimatedValue / 1000));

    return bundleSuggestions.slice(0, 5); // Return top 5 suggestions

  } catch (error) {
    console.error("[Pinecone] Failed to suggest dataset bundles:", error);
    throw error;
  }
}

/**
 * Admin-only: Advanced search with filters and aggregations
 */
export async function adminSearchInstances(
  query: string,
  filters: {
    categories?: string[];
    difficulties?: string[];
    qualityRange?: { min: number; max: number; };
    dateRange?: { start: Date; end: Date; };
    userIds?: string[];
    tags?: string[];
  } = {},
  options: {
    limit?: number;
    includeAggregations?: boolean;
  } = {}
): Promise<{
  instances: Array<{
    instanceId: string;
    question: string;
    answer: string;
    score: number;
    category: string;
    difficulty: string;
    qualityScore: number;
    tags: string[];
    userId: string;
    datasetId: string;
    createdAt: string;
  }>;
  aggregations?: {
    categoryBreakdown: Record<string, number>;
    difficultyBreakdown: Record<string, number>;
    qualityScoreDistribution: { min: number; max: number; avg: number; };
    tagCloud: Array<{ tag: string; count: number; }>;
  };
  totalMatches: number;
}> {
  try {
    const vectorStore = await initializeVectorStore();
    const { limit = 50, includeAggregations = false } = options;

    // Build Pinecone filter
    const pineconeFilter: Record<string, any> = {};
    
    if (filters.categories?.length) {
      pineconeFilter.category = { $in: filters.categories };
    }
    
    if (filters.difficulties?.length) {
      pineconeFilter.difficulty = { $in: filters.difficulties };
    }
    
    if (filters.qualityRange) {
      pineconeFilter.quality_score = {
        $gte: filters.qualityRange.min,
        $lte: filters.qualityRange.max
      };
    }
    
    if (filters.userIds?.length) {
      pineconeFilter.user_id = { $in: filters.userIds };
    }
    
    if (filters.tags?.length) {
      pineconeFilter.tags = { $in: filters.tags };
    }

    // Date range filtering would need to be done post-search since Pinecone doesn't handle date ranges well

    // Perform search
    const results = await vectorStore.similaritySearchWithScore(
      query,
      limit * 2, // Get more results for filtering
      Object.keys(pineconeFilter).length > 0 ? pineconeFilter : undefined
    );

    // Format instances
    const instances = results
      .slice(0, limit)
      .map(([document, score]) => ({
        instanceId: document.metadata.instance_id,
        question: document.metadata.question,
        answer: document.pageContent.split('\n\nAnswer: ')[1] || document.pageContent,
        score: Math.round(score * 100) / 100,
        category: document.metadata.category,
        difficulty: document.metadata.difficulty,
        qualityScore: document.metadata.quality_score,
        tags: document.metadata.tags || [],
        userId: document.metadata.user_id,
        datasetId: document.metadata.dataset_id,
        createdAt: document.metadata.created_at,
      }));

    // Calculate aggregations if requested
    let aggregations;
    if (includeAggregations) {
      const categoryBreakdown: Record<string, number> = {};
      const difficultyBreakdown: Record<string, number> = {};
      const tagCounts: Record<string, number> = {};
      const qualityScores: number[] = [];

      instances.forEach(inst => {
        categoryBreakdown[inst.category] = (categoryBreakdown[inst.category] || 0) + 1;
        difficultyBreakdown[inst.difficulty] = (difficultyBreakdown[inst.difficulty] || 0) + 1;
        qualityScores.push(inst.qualityScore);
        
        inst.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      });

      aggregations = {
        categoryBreakdown,
        difficultyBreakdown,
        qualityScoreDistribution: {
          min: Math.min(...qualityScores),
          max: Math.max(...qualityScores),
          avg: Math.round(qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length)
        },
        tagCloud: Object.entries(tagCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 20)
          .map(([tag, count]) => ({ tag, count }))
      };
    }

    return {
      instances,
      aggregations,
      totalMatches: results.length
    };

  } catch (error) {
    console.error("[Pinecone] Admin search failed:", error);
    throw error;
  }
}

export default {
  initializePinecone,
  initializeVectorStore,
  embedInstance,
  batchEmbedInstances,
  findSimilarInstances,
  findDatasetOverlaps,
  getVectorStatistics,
  suggestDatasetBundles,
  adminSearchInstances,
};