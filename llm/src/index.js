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

        const answer = await askLLM(prompt, { temperature: 0.5, maxTokens: parseInt(process.env.MAX_TOKENS_CLARIFY) || 1024 });

        res.json({ answer });
    } catch (err) {
        console.error(`[Clarify] Failed: ${err.message}`);
        res.status(500).json({ error: 'Failed to get answer', message: err.message });
    }
});

// Visualize endpoint — generate interactive HTML/CSS/JS visualization for a subtopic
app.post('/api/visualize', async (req, res) => {
    const { subtopic, userContext } = req.body;

    if (!subtopic || !subtopic.title) {
        return res.status(400).json({ error: 'Subtopic with title is required' });
    }

    const subtopicTitle = subtopic.title;
    const subtopicDesc = subtopic.description || '';
    const extraContext = userContext || '';

    console.log(`[Visualize] Generating visualization for: "${subtopicTitle}"${extraContext ? ` (with user context: "${extraContext}")` : ''}`);

    try {
        const prompt = `You are a world-class interactive educational designer. Your task is to create a single, self-contained HTML file with an **interactive, animated visualization** that teaches the following topic in a way that is immediately understandable and engaging.

Topic: ${subtopicTitle}
${subtopicDesc ? `Description: ${subtopicDesc}` : ''}
${extraContext ? `\nStudent's request: ${extraContext}` : ''}

CRITICAL REQUIREMENTS FOR INTERACTIVITY:
1. The visualization MUST be highly interactive — users should click, drag, hover, type, or press buttons to explore the concept. Static diagrams are NOT acceptable.
2. Use at least 2-3 of these interactive techniques:
   - Clickable step-by-step walkthroughs with "Next/Prev" controls
   - Animated SVG or Canvas diagrams that build up progressively
   - Interactive code playgrounds where users modify values and see results live
   - Draggable elements to rearrange or connect concepts
   - Toggle buttons to switch between views (e.g., before/after, input/output)
   - Sliders or controls that change parameters in real-time
   - Hover tooltips that reveal deeper explanations
   - Animated state transitions showing how data flows or transforms
3. Use smooth CSS animations and transitions everywhere — elements should fade in, slide, pulse, or transform. Nothing should appear statically.
4. Color-code different concepts with a vibrant palette against a dark background (#0f0f23). Use gradients, glows (box-shadow), and subtle particle effects where appropriate.
5. Include a clear title, a one-line subtitle explaining what the user will learn, and labels on all interactive elements.
6. The visualization should teach through DOING — the user should understand the concept by interacting with it, not by reading paragraphs of text.
7. Make it fit within an 860x560 viewport. Use CSS Grid or Flexbox for layout.

TECHNICAL RULES:
- Completely self-contained: inline CSS and JS only. NO external libraries, CDNs or imports.
- Use modern JS (const, let, arrow functions, template literals).
- Use requestAnimationFrame for smooth animations when needed.

Return ONLY the raw HTML. No explanation text, no markdown fences. Start with <!DOCTYPE html> and end with </html>.`;

        const html = await askLLM(prompt, { temperature: 0.7, maxTokens: parseInt(process.env.MAX_TOKENS_VISUALIZE) || 8192 });

        // Clean up the response — strip markdown fences if present
        let cleanHtml = html.trim();
        if (cleanHtml.startsWith('```html')) {
            cleanHtml = cleanHtml.slice(7);
        } else if (cleanHtml.startsWith('```')) {
            cleanHtml = cleanHtml.slice(3);
        }
        if (cleanHtml.endsWith('```')) {
            cleanHtml = cleanHtml.slice(0, -3);
        }
        cleanHtml = cleanHtml.trim();

        console.log(`[Visualize] Generated ${cleanHtml.length} chars of HTML`);

        res.json({ html: cleanHtml });
    } catch (err) {
        console.error(`[Visualize] Failed: ${err.message}`);
        res.status(500).json({ error: 'Failed to generate visualization', message: err.message });
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
║  POST /api/visualize { subtopic }                 ║
║  GET  /api/health                                ║
║                                                  ║
╚══════════════════════════════════════════════════╝
`);
});
