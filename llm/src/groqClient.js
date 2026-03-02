import Groq from 'groq-sdk';

const clients = [];
let callIndex = 0;

const MAX_RETRIES = 3;

function initClients() {
    if (clients.length > 0) return;

    // Support multiple API keys for load distribution
    const key1 = process.env.GROQ_API_KEY_1;
    const key2 = process.env.GROQ_API_KEY_2;
    const key3 = process.env.GROQ_API_KEY_3;
    const fallback = process.env.GROQ_API_KEY;

    const keys = [key1, key2, key3].filter(Boolean);

    // Fall back to single GROQ_API_KEY if no numbered keys
    if (keys.length === 0 && fallback) {
        keys.push(fallback);
    }

    if (keys.length === 0) {
        throw new Error('No Groq API keys set. Add GROQ_API_KEY_1 and GROQ_API_KEY_2 to your .env file.');
    }

    for (const apiKey of keys) {
        clients.push(new Groq({ apiKey }));
    }

    console.log(`[Groq] Loaded ${clients.length} API key(s) for round-robin`);
}

function getNextClient() {
    initClients();
    const client = clients[callIndex % clients.length];
    callIndex++;
    return client;
}

function getModel() {
    return process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
}

// Strip <think>...</think> reasoning tags from model output (for reasoning models like qwen3)
function stripThinkTags(text) {
    return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function askLLM(prompt, options = {}) {
    const groq = getNextClient();
    const model = getModel();

    const temperature = options.temperature ?? 0.7;
    const maxTokens = options.maxTokens ?? 8192;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
            const completion = await groq.chat.completions.create({
                model,
                messages: [{ role: 'user', content: prompt }],
                temperature,
                max_tokens: maxTokens,
            });

            const raw = completion.choices[0].message.content;
            return stripThinkTags(raw);
        } catch (err) {
            const status = err.status || err.statusCode;
            if ((status === 429 || status === 413) && attempt < MAX_RETRIES) {
                const retryAfter = err.headers?.['retry-after'];
                const waitSeconds = retryAfter ? parseInt(retryAfter) + 5 : Math.pow(2, attempt) * 10;
                console.log(`[Groq] ${status === 413 ? 'Token limit' : 'Rate limited'} (${status}). Retrying in ${waitSeconds}s... (attempt ${attempt}/${MAX_RETRIES})`);
                await sleep(waitSeconds * 1000);
                continue;
            }
            throw err;
        }
    }
}

export { askLLM, getModel };
