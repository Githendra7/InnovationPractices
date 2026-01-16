
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const LOG_FILE = 'verification_result.txt';

function log(message: string) {
    console.log(message);
    try {
        fs.appendFileSync(LOG_FILE, message + '\n', 'utf8');
    } catch (e) {
        console.error('Failed to write to log file', e);
    }
}

async function verifyGroq() {
    log('--- Verifying Groq API Key ---');
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        log('❌ GROQ_API_KEY is missing in .env');
        return false;
    }

    try {
        const groq = new Groq({ apiKey });
        const completion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: 'Hello, are you working?' }],
            model: 'llama-3.3-70b-versatile',
            max_tokens: 10,
        });
        log('✅ Groq API connection successful!');
        log('Response: ' + completion.choices[0]?.message?.content);
        return true;
    } catch (error: any) {
        log('❌ Groq API failed: ' + error.message);
        return false;
    }
}

async function verifyGemini() {
    log('\n--- Verifying Google API Key (for Embeddings) ---');
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        log('⚠️ GOOGLE_API_KEY is missing in .env. RAG features will likely fail.');
        return false;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
        const result = await model.embedContent("Hello world");
        if (result.embedding.values.length > 0) {
            log('✅ Google API (Embeddings) connection successful!');
            return true;
        }
        return false;
    } catch (error: any) {
        log('❌ Google API failed: ' + error.message);
        return false;
    }
}

async function main() {
    // Clear previous log
    try {
        if (fs.existsSync(LOG_FILE)) {
            fs.unlinkSync(LOG_FILE);
        }
    } catch (e) { }

    const groqOk = await verifyGroq();
    const geminiOk = await verifyGemini();

    if (groqOk) {
        log('\n🎉 Groq is ready to use for text generation.');
    } else {
        log('\n🚫 Groq configuration needs attention.');
    }

    if (!geminiOk) {
        log('⚠️ RAG features might not work without a valid Google API Key.');
    }
}

main();
