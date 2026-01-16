import { GraphState } from '../types';
import { RisksTradeoffs as RisksSchemaType, RisksSchema } from '@/lib/schemas/stages';
import { callStructuredLLM } from '@/lib/ai/groq';
import { retrieveChunks } from '@/lib/rag/retriever';

export async function riskNode(state: GraphState): Promise<Partial<GraphState>> {
    console.log('--- Risk & Tradeoff Node ---');

    // 1. Retrieve Context
    let context = "";
    let citations: string[] = [];
    try {
        const chunks = await retrieveChunks({
            query: `risk analysis checklist ${state.ideaText}`,
            tags: ['risk_tradeoffs'],
            topK: 4
        });
        context = chunks.map(c => c.chunkText).join('\n\n');
        citations = chunks.map(c => c.id);
    } catch (err) {
        console.warn("RAG Retrieval failed for Risk Node:", err);
    }

    // 2. Call LLM
    const prompt = `
    Analyze the risks and key trade-offs for the conceptual design of: "${state.intake?.cleanedIdea}"
    
    Consider the alternatives proposed in the morphological chart.
    
    1. Identify at least 5 key risks across Technical, Safety, Market, and Compliance categories. Provide mitigations.
    2. Identify 3 critical design trade-offs (e.g. Cost vs Quality).
    
    Reference Material:
    ${context}
  `;

    const output = await callStructuredLLM<RisksSchemaType>({
        system: "You are a product risk manager.",
        user: prompt,
        schema: RisksSchema
    });

    return {
        risks: output,
        citations: { ...state.citations, RISKS: citations }
    };
}
