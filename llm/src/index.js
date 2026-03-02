import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { askLLM, getModel } from './groqClient.js';
import { planTopics } from './planner.js';
import { researchSubtopics } from './researcher.js';
import { summarizeAllTopics } from './summarizer.js';
import { generateRoadmapJSON } from './generator.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', model: getModel() });
});

// Main research endpoint
app.post('/api/research', async (req, res) => {
    const { topic } = req.body;

    if (!topic || typeof topic !== 'string' || topic.trim().length === 0) {
        return res.status(400).json({ error: 'Topic is required. Send { "topic": "your topic" }' });
    }

    const cleanTopic = topic.trim();
    console.log(`\n[API] Research request: "${cleanTopic}"`);
    console.log(`[API] Model: ${getModel()}`);

    const startTime = Date.now();

    try {
        // Step 1: Plan the learning path outline
        console.log('\n=== STEP 1/4: Planning learning path ===');
        const plan = await planTopics(cleanTopic);

        // Step 2: Research each subtopic via web search
        console.log('\n=== STEP 2/4: Researching subtopics ===');
        const researchData = await researchSubtopics(plan);

        // Step 3: Summarize research per topic using LLM
        console.log('\n=== STEP 3/4: Analyzing research with LLM ===');
        const topicSummaries = await summarizeAllTopics(plan, researchData);

        // Step 4: Generate the final roadmap JSON
        console.log('\n=== STEP 4/4: Generating roadmap JSON ===');
        const roadmap = await generateRoadmapJSON(plan, researchData, topicSummaries);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`\n[API] Done in ${elapsed}s`);

        res.json(roadmap);
    } catch (err) {
        console.error(`[API] Research failed: ${err.message}`);
        res.status(500).json({ error: 'Research failed', message: err.message });
    }
});

// Clarify endpoint — answer questions about a subtopic
app.post('/api/clarify', async (req, res) => {
    const { subtopic, question } = req.body;

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
        return res.status(400).json({ error: 'Question is required' });
    }

    const subtopicTitle = subtopic?.title || 'General';
    const subtopicDesc = subtopic?.description || '';

    console.log(`[Clarify] Q about "${subtopicTitle}": ${question.trim()}`);

    try {
        const prompt = `You are a helpful learning assistant. The student is studying the subtopic below and has a question.

Subtopic: ${subtopicTitle}
${subtopicDesc ? `Description: ${subtopicDesc}` : ''}

Student's question: ${question.trim()}

Provide a clear, concise, and helpful answer. Use simple language. If relevant, include a brief example. Keep your answer focused and under 200 words.`;

        const answer = await askLLM(prompt, { temperature: 0.5, maxTokens: 1024 });

        res.json({ answer });
    } catch (err) {
        console.error(`[Clarify] Failed: ${err.message}`);
        res.status(500).json({ error: 'Failed to get answer', message: err.message });
    }
});

// Validate env on startup
function validateEnv() {
    if (!process.env.GROQ_API_KEY_1 && !process.env.GROQ_API_KEY_2 && !process.env.GROQ_API_KEY) {
        console.error('[ERROR] No Groq API keys set. Add GROQ_API_KEY_1, GROQ_API_KEY_2, GROQ_API_KEY_3 to .env');
        process.exit(1);
    }
    if (!process.env.SERPER_API_KEY) {
        console.error('[ERROR] SERPER_API_KEY is not set. Add it to .env');
        process.exit(1);
    }
}

validateEnv();

app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════╗
║       Deep Research Agent (Groq) v2.0            ║
║       API Server running on port ${PORT}            ║
╠══════════════════════════════════════════════════╣
║                                                  ║
║  POST /api/research  { "topic": "..." }          ║
║  POST /api/clarify   { subtopic, question }       ║
║  GET  /api/health                                ║
║                                                  ║
╚══════════════════════════════════════════════════╝
`);
});
