
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import path from 'path';

// Construct absolute path to .env file, assuming script is in scripts/ and .env is in root
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.error("No GOOGLE_API_KEY found.");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

async function main() {
    console.log("Checking available models...");
    try {
        const modelName = 'gemini-1.5-flash';
        console.log(`Attempting to generate with ${modelName}...`);

        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, are you there?");
        console.log("Success! Response:", result.response.text());

    } catch (error: any) {
        console.error("Error with 'gemini-1.5-flash':");
        console.error(error.message);

        console.log("\nAttempting 'gemini-pro' as fallback check...");
        try {
            const model2 = genAI.getGenerativeModel({ model: 'gemini-pro' });
            const result2 = await model2.generateContent("Hello?");
            console.log("Success! Response:", result2.response.text());
        } catch (e: any) {
            console.error("Error with 'gemini-pro':", e.message);
        }

        console.log("\nAttempting 'gemini-1.5-flash-001'...");
        try {
            const model3 = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-001' });
            const result3 = await model3.generateContent("Hello?");
            console.log("Success! Response:", result3.response.text());
        } catch (e: any) {
            console.error("Error with 'gemini-1.5-flash-001':", e.message);
        }
    }
}

main();
