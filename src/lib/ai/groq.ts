import Groq from 'groq-sdk';
import { zodToJsonSchema } from 'zod-to-json-schema';

if (!process.env.GROQ_API_KEY) {
    console.warn("Missing GROQ_API_KEY environment variable. Workflow may fail.");
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Common models on Groq: 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'
// Using Llama 3 70B for best reasoning/performance balance
const MODEL_NAME = 'llama-3.3-70b-versatile';

export interface StructuredLLMParams {
    system?: string;
    user: string;
    schema?: any; // Zod schema
}

export async function callStructuredLLM<T>(params: StructuredLLMParams): Promise<T> {
    const { system, user, schema } = params;

    let systemPrompt = system || "You are a helpful AI assistant.";

    // For Groq JSON mode, we MUST mention "JSON" in the prompt and ideally provide the schema structure.
    if (schema) {
        const jsonSchema = zodToJsonSchema(schema);
        systemPrompt += `\n\nIMPORTANT: You must respond specifically with a valid JSON object strictly matching this schema:\n${JSON.stringify(jsonSchema, null, 2)}`;
        systemPrompt += `\n\nDo not include any markdown formatting (like \`\`\`json) in your response, just the raw JSON string.`;
    }

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: user }
            ],
            model: MODEL_NAME,
            temperature: 0.3,
            // Enable JSON mode
            response_format: schema ? { type: "json_object" } : undefined,
        });

        const content = completion.choices[0]?.message?.content || "{}";

        // Sometimes models still wrap in markdown despite instructions, sanitize just in case
        const cleanedContent = content.replace(/```json\n?|\n?```/g, '').trim();

        return JSON.parse(cleanedContent) as T;
    } catch (error) {
        console.error("Groq Generation Error:", error);
        throw error;
    }
}
