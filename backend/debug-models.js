const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

const envVars = {};
envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
        const key = parts[0].trim();
        let value = parts.slice(1).join('=').trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        envVars[key] = value;
    }
});

let apiKey = "";
if (envVars.GEMINI_API_KEYS) {
    apiKey = envVars.GEMINI_API_KEYS.split(',')[0].trim();
} else if (envVars.GEMINI_API_KEY) {
    apiKey = envVars.GEMINI_API_KEY.trim();
}

console.log(`Using Key: ${apiKey.substring(0, 5)}...`);
const genAI = new GoogleGenerativeAI(apiKey);

async function run() {
    console.log("Verifying fixes...");

    // Test Generation
    try {
        console.log("Testing Generation (gemini-2.5-flash)...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent("hello");
        console.log("Generation SUCCESS: " + result.response.text());
    } catch (e) {
        console.log("Generation FAILED: " + e.message);
    }

    // Test Embedding
    try {
        console.log("Testing Embedding (gemini-embedding-001)...");
        const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
        const result = await model.embedContent("Hello world");
        console.log(`Embedding SUCCESS: Got vector length ${result.embedding.values.length}`);
    } catch (e) {
        console.log("Embedding FAILED: " + e.message);
    }
}

run();
