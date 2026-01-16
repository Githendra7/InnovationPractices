import { GraphState } from '../types';
import { FinalReport as FinalReportSchemaType, FinalReportSchema } from '@/lib/schemas/stages';
import { callStructuredLLM } from '@/lib/ai/groq';
import { retrieveChunks } from '@/lib/rag/retriever';

export async function finalNode(state: GraphState): Promise<Partial<GraphState>> {
    console.log('--- Final Report Node ---');

    // 1. Retrieve Context
    // Maybe retrieve generic advice on "next steps" or prototyping
    let context = "";
    let citations: string[] = [];
    try {
        const chunks = await retrieveChunks({
            query: `product development next steps prototyping ${state.ideaText}`,
            tags: ['example'], // maybe check case studies
            topK: 2
        });
        context = chunks.map(c => c.chunkText).join('\n\n');
        citations = chunks.map(c => c.id);
    } catch (err) {
        console.warn("RAG Retrieval failed for Final Node:", err);
    }

    // 2. Call LLM
    const prompt = `
    Generate a final executive summary and recommended next steps for the project: "${state.intake?.cleanedIdea}"
    
    Summarize the key findings from Functional Decomposition and Risk Analysis.
    Provide 5 clear, actionable next steps for the innovator (e.g. "Build a rough cardboard prototype", "Survey 10 potential users").
    
    Reference Context:
    ${context}
  `;

    const output = await callStructuredLLM<FinalReportSchemaType>({
        system: "You are a senior product strategy consultant.",
        user: prompt,
        schema: FinalReportSchema
    });

    return {
        final: output,
        citations: { ...state.citations, FINAL: citations }
    };
}
