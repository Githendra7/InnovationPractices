import { GoogleGenerativeAI } from '@google/generative-ai';
import { zodToJsonSchema } from 'zod-to-json-schema';

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.warn('Missing GOOGLE_API_KEY environment variable. Gemini features will not work.');
}

const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Model configuration
const MODEL_NAME = 'gemini-1.5-flash';
const EMBEDDING_MODEL = 'text-embedding-004';

// Exports that might be null if no key
export const model = genAI ? genAI.getGenerativeModel({ model: MODEL_NAME }) : null;
export const embeddingModel = genAI ? genAI.getGenerativeModel({ model: EMBEDDING_MODEL }) : null;

export interface StructuredLLMParams {
    system?: string;
    user: string;
    schema?: any; // We'll pass standard JSON schema or Zod-converted schema
}

export async function callStructuredLLM<T>(params: StructuredLLMParams): Promise<T> {
    const { system, user, schema } = params;

    const generationConfig: any = {
        temperature: 0.3,
    };

    if (schema) {
        generationConfig.responseMimeType = "application/json";

        // Convert Zod to JSON Schema
        const jsonSchema = zodToJsonSchema(schema);

        // Function to strip disallowed fields from schema for Gemini
        const cleanSchema = (obj: any): any => {
            if (typeof obj !== 'object' || obj === null) return obj;

            if (Array.isArray(obj)) {
                return obj.map(cleanSchema);
            }

            const newObj: any = {};
            for (const key in obj) {
                if (key === '$schema' || key === 'additionalProperties') continue;
                newObj[key] = cleanSchema(obj[key]);
            }
            return newObj;
        };

        generationConfig.responseSchema = cleanSchema(jsonSchema);
    }

    if (!genAI) {
        throw new Error("Google AI not initialized (missing key). Cannot call structured LLM.");
    }

    const generativeModel = genAI.getGenerativeModel({
        model: MODEL_NAME,
        systemInstruction: system,
        generationConfig
    });

    try {
        const result = await generativeModel.generateContent(user);
        const text = result.response.text();

        // Clean up markdown code blocks if present (sometimes Gemini adds ```json ... ``` even with json mode)
        const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();

        return JSON.parse(cleanedText) as T;
    } catch (error) {
        console.error("Gemini Generation Error:", error);
        // basic retry logic could go here, but LangGraph also handles retries
        throw error;
    }
}

export async function generateEmbedding(text: string): Promise<number[]> {
    if (!embeddingModel) {
        console.warn("Google embedding model not initialized. Returning empty embedding.");
        return [];
    }
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
}
