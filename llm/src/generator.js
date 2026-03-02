import { askLLM } from './groqClient.js';

// Attempt to repair truncated JSON by closing open brackets/braces
function repairJSON(str) {
    let cleaned = str.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Remove trailing comma before we try to close
    cleaned = cleaned.replace(/,\s*$/, '');

    // Count open vs close brackets
    let openBraces = 0;
    let openBrackets = 0;
    let inString = false;
    let escape = false;

    for (let i = 0; i < cleaned.length; i++) {
        const ch = cleaned[i];
        if (escape) { escape = false; continue; }
        if (ch === '\\') { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '{') openBraces++;
        if (ch === '}') openBraces--;
        if (ch === '[') openBrackets++;
        if (ch === ']') openBrackets--;
    }

    // If we're inside a string, close it
    if (inString) cleaned += '"';

    // Close any open brackets/braces
    while (openBrackets > 0) { cleaned += ']'; openBrackets--; }
    while (openBraces > 0) { cleaned += '}'; openBraces--; }

    return cleaned;
}

async function generateRoadmapJSON(plan, researchData, topicSummaries) {
    console.log('\n[Generator] Generating final roadmap JSON with resources and quizzes...');

    // Build enriched research block with summaries + real URLs
    const researchBlock = plan.topics.map(topic => {
        const summary = topicSummaries[topic.title];
        const topicDesc = summary?.topicDescription || topic.description;

        const subtopicsText = topic.subtopics.map(sub => {
            // Get LLM summary for this subtopic
            const subSummary = summary?.subtopics?.find(s => s.title === sub.title);
            const desc = subSummary?.description || sub.description;
            const concepts = subSummary?.keyConcepts?.join(', ') || '';

            // Get real URLs from research
            const subResearch = researchData.find(r => r.subtopicTitle === sub.title && r.topicTitle === topic.title);
            const urls = subResearch?.sources?.filter(s => s.url).map(s => `${s.title} | ${s.url}`) || [];

            return `  "${sub.title}": ${desc}${concepts ? ` [Concepts: ${concepts}]` : ''}\n    URLs: ${urls.join('; ')}`;
        }).join('\n');

        return `"${topic.title}" (${topicDesc}):\n${subtopicsText}`;
    }).join('\n\n');

    const prompt = `Generate a learning roadmap JSON for "${plan.title}".

Enriched outline with descriptions and URLs:
${researchBlock}

JSON format: {"title":"${plan.title}","description":"${plan.description}","topics":[{"title":"","description":"","subtopics":[{"title":"","description":"use the detailed descriptions above","resources":[{"title":"","url":"real URL from above","type":"article|video|documentation|tutorial"}],"questions":[{"question":"test understanding of key concepts","options":["A","B","C","D"],"correctAnswer":0}]}]}]}

Rules: Use REAL URLs only. Each subtopic: 1-2 resources, 1-2 quiz questions (4 options, correctAnswer is 0-based index). Make descriptions detailed. Make quiz questions specific to the key concepts listed. Return ONLY valid JSON.`;

    // Try up to 2 attempts
    for (let attempt = 1; attempt <= 2; attempt++) {
        const response = await askLLM(prompt, { temperature: 0.4, maxTokens: parseInt(process.env.MAX_TOKENS_RESEARCH) || 32768 });

        try {
            // First try normal parse
            let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            let roadmap;

            try {
                roadmap = JSON.parse(cleaned);
            } catch (parseErr) {
                // Try repairing truncated JSON
                console.log(`[Generator] JSON parse failed, attempting repair (attempt ${attempt})...`);
                const repaired = repairJSON(response);
                roadmap = JSON.parse(repaired);
                console.log('[Generator] JSON repair successful!');
            }

            if (!roadmap.title || !roadmap.topics || !Array.isArray(roadmap.topics)) {
                throw new Error('Invalid roadmap structure: missing title or topics');
            }

            // Ensure all subtopics have the required fields with defaults
            for (const topic of roadmap.topics) {
                topic.description = topic.description || '';
                topic.subtopics = topic.subtopics || [];
                for (const sub of topic.subtopics) {
                    sub.description = sub.description || '';
                    sub.completed = false;
                    sub.resources = (sub.resources || []).map(r => ({
                        title: r.title || 'Resource',
                        url: r.url || '',
                        type: ['article', 'video', 'documentation', 'tutorial'].includes(r.type) ? r.type : 'article',
                    }));
                    sub.questions = (sub.questions || []).map(q => ({
                        question: q.question || '',
                        options: Array.isArray(q.options) ? q.options.slice(0, 4) : ['A', 'B', 'C', 'D'],
                        correctAnswer: typeof q.correctAnswer === 'number' ? q.correctAnswer : 0,
                    }));
                }
            }

            const subtopicCount = roadmap.topics.reduce((sum, t) => sum + t.subtopics.length, 0);
            const resourceCount = roadmap.topics.reduce((sum, t) =>
                sum + t.subtopics.reduce((s, st) => s + st.resources.length, 0), 0);
            const questionCount = roadmap.topics.reduce((sum, t) =>
                sum + t.subtopics.reduce((s, st) => s + st.questions.length, 0), 0);

            console.log(`[Generator] Roadmap generated: ${roadmap.topics.length} topics, ${subtopicCount} subtopics, ${resourceCount} resources, ${questionCount} questions`);

            return roadmap;
        } catch (err) {
            console.error(`[Generator] Attempt ${attempt} failed:`, err.message);
            if (attempt === 2) {
                console.error('[Generator] Raw response (first 1000 chars):', response.substring(0, 1000));
                throw new Error('Failed to generate roadmap JSON after 2 attempts. Try again.');
            }
            console.log('[Generator] Retrying...');
        }
    }
}

export { generateRoadmapJSON };
