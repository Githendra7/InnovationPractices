import { GraphState } from '../types';
import { MorphologicalChart as MorphologicalSchemaType, MorphologicalSchema } from '@/lib/schemas/stages';
import { callStructuredLLM } from '@/lib/ai/groq';
import { retrieveChunks } from '@/lib/rag/retriever';

export async function morphologicalNode(state: GraphState): Promise<Partial<GraphState>> {
    console.log('--- Morphological Node ---');
    const subFunctions = state.functional?.subFunctions || [];

    if (subFunctions.length === 0) {
        throw new Error("No sub-functions available for morphological analysis.");
    }

    // 1. Retrieve Context
    let context = "";
    let citations: string[] = [];
    try {
        const chunks = await retrieveChunks({
            query: `morphological chart examples ${state.ideaText}`,
            tags: ['morphological_chart'],
            topK: 3
        });
        context = chunks.map(c => c.chunkText).join('\n\n');
        citations = chunks.map(c => c.id);
    } catch (err) {
        console.warn("RAG Retrieval failed for Morphological Node:", err);
    }

    // 2. Call LLM
    // We provide the list of functions and ask LLM to fill the matrix
    const functionsList = subFunctions.map(sf => `- ID: ${sf.id}, Function: ${sf.function} (${sf.description})`).join('\n');

    const prompt = `
    Create a Morphological Chart for the product.
    
    Sub-functions identified:
    ${functionsList}

    For EACH sub-function, generate 3-5 distinct solution alternatives (means).
    Include pros/cons for each alternative.
    
    Reference Material:
    ${context}
  `;

    const output = await callStructuredLLM<MorphologicalSchemaType>({
        system: "You are an innovative design engineer.",
        user: prompt,
        schema: MorphologicalSchema
    });

    return {
        morphological: output,
        citations: { ...state.citations, MORPHOLOGICAL: citations }
    };
}
