import prisma from '@/lib/db/prisma';
import { generateEmbedding } from '@/lib/ai/gemini';

interface RetrieveParams {
  query: string;
  tags?: string[];
  topK?: number;
}

export async function retrieveChunks({ query, tags, topK = 6 }: RetrieveParams) {
  const embedding = await generateEmbedding(query);

  // Convert embedding to string format for pgvector query: "[0.1, 0.2, ...]"
  const vectorQuery = `[${embedding.join(',')}]`;

  try {
    // We use raw SQL because Prisma pgvector support requires it for similarity search
    // Note: We cast to vector(768) which matches our schema
    const chunks = await prisma.$queryRaw`
    SELECT 
      id, 
      "chunkText", 
      metadata,
      1 - (embedding <=> ${vectorQuery}::vector) as score
    FROM "KnowledgeChunk"
    WHERE 
      1 - (embedding <=> ${vectorQuery}::vector) > 0.5
      ${tags && tags.length > 0 ? Prisma.sql`AND EXISTS (
        SELECT 1 FROM "KnowledgeDocument" d 
        WHERE d.id = "KnowledgeChunk"."documentId" 
        AND d.tags::text[] && ${tags}
      )` : Prisma.empty}
    ORDER BY score DESC
    LIMIT ${topK};
  `;


    return chunks as Array<{ id: string; chunkText: string; score: number; metadata: any }>;

  } catch (e: any) {
    // Fallback if vector extension is missing or other DB error
    console.warn("RAG Retrieval warning (semantic search failed):", e.message);
    return [];
  }
}

import { Prisma } from '@prisma/client';
