const fs = require('fs');
const path = require('path');
const https = require('https');

const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

// Parse .env
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

if (!apiKey) {
    console.error("No API Key found");
    process.exit(1);
}

console.log(`Using Key: ${apiKey.substring(0, 5)}...`);

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode !== 200) {
            console.error(`Error: ${res.statusCode} ${res.statusMessage}`);
            console.error(data);
            return;
        }

        try {
            const json = JSON.parse(data);
            if (json.models) {
                console.log("\nAvailable Models:");
                json.models.forEach(m => {
                    console.log(`- ${m.name} (${m.supportedGenerationMethods.join(', ')})`);
                });
            } else {
                console.log("No models found in response.");
                console.log(data);
            }
        } catch (e) {
            console.error("Error parsing JSON", e);
            console.log(data);
        }
    });

}).on('error', (err) => {
    console.error("Network Error:", err);
});
