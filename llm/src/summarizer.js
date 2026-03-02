import { askLLM } from './groqClient.js';

async function summarizeTopicResearch(topicTitle, subtopicsData) {
    console.log(`  [Summarizer] Analyzing research for: "${topicTitle}"`);

    // Build compact research context from scraped content
    const researchText = subtopicsData.map(sub => {
        const content = sub.sources
            .filter(s => s.content)
            .map(s => s.content.substring(0, 1500))
            .join('\n');

        return `Subtopic: "${sub.subtopicTitle}"\n${content || sub.sources.map(s => s.snippet).join(' ')}`;
    }).join('\n---\n');

    const subtopicNames = subtopicsData.map(s => s.subtopicTitle);

    const prompt = `Analyze this research and extract key learning points for each subtopic.

Topic: "${topicTitle}"
Subtopics: ${JSON.stringify(subtopicNames)}

Research content:
${researchText}

Return ONLY valid JSON (no markdown fences):
{
  "topicDescription": "2-3 sentence description of this topic",
  "subtopics": [
    {
      "title": "subtopic name",
      "description": "Detailed 2-3 sentence description of what to learn",
      "keyConcepts": ["concept 1", "concept 2", "concept 3"],
      "resourceTypes": ["article", "video", "documentation", or "tutorial"]
    }
  ]
}`;

    const response = await askLLM(prompt, { temperature: 0.3, maxTokens: 4096 });

    try {
        const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleaned);
        console.log(`  [Summarizer] Extracted insights for ${parsed.subtopics?.length || 0} subtopics`);
        return parsed;
    } catch {
        console.log(`  [Summarizer] Parse failed, using fallback`);
        return {
            topicDescription: '',
            subtopics: subtopicNames.map(t => ({
                title: t,
                description: '',
                keyConcepts: [],
                resourceTypes: ['article'],
            })),
        };
    }
}

async function summarizeAllTopics(plan, researchData) {
    console.log('\n[Summarizer] Analyzing scraped research per topic...');

    const summaries = {};

    for (const topic of plan.topics) {
        // Get all research data for this topic's subtopics
        const topicResearch = researchData.filter(r => r.topicTitle === topic.title);

        if (topicResearch.length > 0) {
            summaries[topic.title] = await summarizeTopicResearch(topic.title, topicResearch);
        }
    }

    console.log(`[Summarizer] Completed analysis for ${Object.keys(summaries).length} topics`);
    return summaries;
}

export { summarizeAllTopics };
