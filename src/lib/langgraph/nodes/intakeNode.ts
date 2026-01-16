import { GraphState } from '../types';
import { IntakeOutput as IntakeOutputSchemaType, IntakeOutputSchema } from '@/lib/schemas/stages';
import { callStructuredLLM } from '@/lib/ai/groq';
import { retrieveChunks } from '@/lib/rag/retriever';

export async function intakeNode(state: GraphState): Promise<Partial<GraphState>> {
    const { ideaText, domain } = state;
    console.log('--- Intake Node ---');

    // 1. Retrieve Context
    let context = "";
    let citations: string[] = [];
    try {
        const chunks = await retrieveChunks({
            query: `product design problem definition ${ideaText}`,
            tags: ['framework', 'best_practices'], // Generic tags
            topK: 4
        });
        context = chunks.map(c => c.chunkText).join('\n\n');
        citations = chunks.map(c => c.id);
    } catch (err) {
        console.warn("RAG Retrieval failed for Intake:", err);
        context = "No knowledge base context available.";
    }

    // 2. Call LLM
    const prompt = `
    You are an expert product development assistant.
    The user has a product idea: "${ideaText}"
    ${domain ? `Domain: ${domain}` : ''}

    Your goal is to:
    1. Clean up and clearly state the idea.
    2. Identify key objectives (what success looks like).
    3. Identify likely constraints (technical, physical, cost).
    4. List assumptions.

    Use the following engineering conceptual design principles as reference if relevant:
    ${context}
  `;

    const output = await callStructuredLLM<IntakeOutputSchemaType>({
        system: "You are a helpful AI assistant for product innovation.",
        user: prompt,
        schema: IntakeOutputSchema
    });

    return {
        intake: output,
        citations: { ...state.citations, INTAKE: citations }
    };
}
