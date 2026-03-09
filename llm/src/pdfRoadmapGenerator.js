import { PDFParse } from 'pdf-parse';
import { askLLM } from './groqClient.js';
import { researchSubtopics } from './researcher.js';
import { summarizeAllTopics } from './summarizer.js';
import { generateRoadmapJSON } from './generator.js';

/**
 * Extract text content from a PDF buffer.
 * @param {Buffer} pdfBuffer - The PDF file buffer
 * @returns {Promise<string>} - Extracted text
 */
async function extractPDFText(pdfBuffer) {
    console.log('[PDF] Extracting text from PDF...');
    const parser = new PDFParse({ data: pdfBuffer });
    await parser.load();
    const result = await parser.getText();
    // getText() returns { pages: [...], text: "full text", total: pageCount }
    const pdfText = result.text || '';
    const pageCount = result.total || 'unknown';

    if (!pdfText || pdfText.trim().length < 50) {
        throw new Error('PDF appears to be empty or contains very little text. Make sure it is a text-based PDF (not a scanned image).');
    }

    console.log(`[PDF] Extracted ${pdfText.length} characters (${pageCount} pages)`);
    return pdfText;
}

/**
 * Use the LLM to plan topics based on PDF content (same as planTopics but with PDF context).
 * @param {string} pdfText - The extracted PDF text
 * @returns {Promise<Object>} - Plan object with title, description, topics
 */
async function planTopicsFromPDF(pdfText) {
    console.log('[PDF Planner] Creating learning path outline from PDF content...');

    // Truncate if extremely long to stay within token limits
    const maxChars = 15000;
    const truncatedText = pdfText.length > maxChars
        ? pdfText.substring(0, maxChars) + '\n\n[... content truncated for processing ...]'
        : pdfText;

    const prompt = `You are an expert curriculum designer. Below is text extracted from a PDF document. Analyze the content and create a structured learning roadmap outline based on what the PDF covers.

EXTRACTED PDF CONTENT:
---
${truncatedText}
---

Return ONLY valid JSON (no markdown fences, no extra text) in this exact format:
{
  "title": "Title of the learning roadmap (inferred from the PDF content)",
  "description": "Brief description of what this roadmap covers",
  "topics": [
    {
      "title": "Topic 1 Name",
      "description": "What this topic covers",
      "subtopics": [
        { "title": "Subtopic 1.1 Name", "description": "What this subtopic covers" },
        { "title": "Subtopic 1.2 Name", "description": "What this subtopic covers" }
      ]
    }
  ]
}

RULES:
- Preserve the hierarchical structure from the PDF — major sections become topics, items within them become subtopics
- Create at most 8 main topics, each with at most 5 subtopics (merge or group related items if needed)
- Order topics from beginner to advanced
- Make titles clear and specific
- Make descriptions concise (1 sentence max)
- Return ONLY the JSON, nothing else
- Keep your response SHORT to avoid truncation`;

    const maxTokensPdf = parseInt(process.env.MAX_TOKENS_PDF) || 16384;
    const response = await askLLM(prompt, { temperature: 0.5, maxTokens: maxTokensPdf });

    // Try to parse the JSON response, with a repair attempt if it fails
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // First attempt: direct parse
    try {
        const plan = JSON.parse(cleaned);
        const topicCount = plan.topics?.length || 0;
        const subtopicCount = plan.topics?.reduce((sum, t) => sum + (t.subtopics?.length || 0), 0) || 0;
        console.log(`[PDF Planner] Created outline: ${topicCount} topics, ${subtopicCount} subtopics`);
        return plan;
    } catch (firstErr) {
        console.warn('[PDF Planner] First parse failed:', firstErr.message);
        console.warn('[PDF Planner] Response length:', response.length, 'chars. Attempting JSON repair...');

        // Second attempt: try to fix truncated JSON by closing open brackets
        try {
            // Remove any trailing incomplete object/string and close brackets
            let repaired = cleaned;
            // Remove trailing incomplete key-value pair
            repaired = repaired.replace(/,\s*"[^"]*"?\s*:?\s*[^}\]]*$/, '');
            // Count and close open brackets
            const openBraces = (repaired.match(/{/g) || []).length;
            const closeBraces = (repaired.match(/}/g) || []).length;
            const openBrackets = (repaired.match(/\[/g) || []).length;
            const closeBrackets = (repaired.match(/\]/g) || []).length;
            for (let i = 0; i < openBrackets - closeBrackets; i++) repaired += ']';
            for (let i = 0; i < openBraces - closeBraces; i++) repaired += '}';

            const plan = JSON.parse(repaired);
            const topicCount = plan.topics?.length || 0;
            const subtopicCount = plan.topics?.reduce((sum, t) => sum + (t.subtopics?.length || 0), 0) || 0;
            console.log(`[PDF Planner] Repaired and parsed outline: ${topicCount} topics, ${subtopicCount} subtopics`);
            return plan;
        } catch (repairErr) {
            console.error('[PDF Planner] JSON repair also failed:', repairErr.message);
            console.error('[PDF Planner] Raw response (first 500 chars):', response.substring(0, 500));
            throw new Error('Failed to generate learning path outline from PDF. The response was too large. Try a shorter PDF or try again.');
        }
    }
}

/**
 * Full PDF-to-roadmap pipeline: Extract PDF → Plan → Research → Summarize → Generate
 * Follows the same 4-step process as the /api/research endpoint.
 * @param {Buffer} pdfBuffer - The PDF file buffer
 * @returns {Promise<Object>} - Final roadmap JSON object
 */
async function generateRoadmapFromPDF(pdfBuffer) {
    // Step 1: Extract text from the PDF
    console.log('\n=== PDF STEP 1/4: Extracting PDF text ===');
    const pdfText = await extractPDFText(pdfBuffer);

    // Step 2: Plan topics from PDF content (instead of a topic string)
    console.log('\n=== PDF STEP 2/4: Planning learning path from PDF ===');
    const plan = await planTopicsFromPDF(pdfText);

    // Step 3: Research each subtopic via web search (same as /api/research)
    console.log('\n=== PDF STEP 3/4: Researching subtopics ===');
    const researchData = await researchSubtopics(plan);

    // Step 4a: Summarize research per topic using LLM
    console.log('\n=== PDF STEP 4/4: Analyzing research and generating roadmap ===');
    const topicSummaries = await summarizeAllTopics(plan, researchData);

    // Step 4b: Generate the final roadmap JSON with resources and quizzes
    const roadmap = await generateRoadmapJSON(plan, researchData, topicSummaries);

    return roadmap;
}

export { generateRoadmapFromPDF };
