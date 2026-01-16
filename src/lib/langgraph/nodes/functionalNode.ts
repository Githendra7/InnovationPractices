import { GraphState } from '../types';
import { FunctionalDecomposition as FunctionalDecompositionSchemaType, FunctionalDecompositionSchema } from '@/lib/schemas/stages';
import { callStructuredLLM } from '@/lib/ai/groq';
import { retrieveChunks } from '@/lib/rag/retriever';

export async function functionalNode(state: GraphState): Promise<Partial<GraphState>> {
    console.log('--- Functional Decomposition Node ---');
    const idea = state.intake?.cleanedIdea || state.ideaText;

    // 1. Retrieve Context
    let context = "";
    let citations: string[] = [];
    try {
        const chunks = await retrieveChunks({
            query: `functional decomposition method ${idea}`,
            tags: ['functional_decomposition'],
            topK: 4
        });
        context = chunks.map(c => c.chunkText).join('\n\n');
        citations = chunks.map(c => c.id);
    } catch (err) {
        console.warn("RAG Retrieval failed for Functional Node:", err);
    }

    // 2. Call LLM
    const prompt = `
    Perform a Functional Decomposition for the following product:
    "${idea}"

    Objectives: ${state.intake?.objectives.join(', ')}

    Follow strictly:
    - Identify the Overall Function (Main Verb + Noun).
    - Break it down into 5-10 sub-functions.
    - Ensure sub-functions adhere to "Verb + Noun" format.
    - Ensure they are action-oriented and solution-neutral (describe WHAT, not HOW).
    
    Reference Material on Method:
    ${context}
  `;

    const output = await callStructuredLLM<FunctionalDecompositionSchemaType>({
        system: "You are an expert systems engineer.",
        user: prompt,
        schema: FunctionalDecompositionSchema
    });

    return {
        functional: output,
        citations: { ...state.citations, FUNCTIONAL: citations }
    };
}
