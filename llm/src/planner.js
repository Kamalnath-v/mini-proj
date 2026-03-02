import { askLLM } from './groqClient.js';

async function planTopics(topic) {
  console.log(`\n[Planner] Creating learning path outline for: "${topic}"`);

  const prompt = `You are an expert curriculum designer. Given a learning topic, create a structured outline for a learning roadmap.

TOPIC: ${topic}

Return ONLY valid JSON (no markdown fences, no extra text) in this exact format:
{
  "title": "Title of the learning roadmap",
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
- Create sufficient main topics, each with sufficient subtopics
- Order topics from beginner to advanced
- Make titles clear and specific
- Make descriptions concise (1-2 sentences)
- Return ONLY the JSON, nothing else`;

  const response = await askLLM(prompt, { temperature: 0.7, maxTokens: 4096 });

  try {
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const plan = JSON.parse(cleaned);

    const topicCount = plan.topics?.length || 0;
    const subtopicCount = plan.topics?.reduce((sum, t) => sum + (t.subtopics?.length || 0), 0) || 0;
    console.log(`[Planner] Created outline: ${topicCount} topics, ${subtopicCount} subtopics`);

    return plan;
  } catch (err) {
    console.error('[Planner] Failed to parse outline JSON:', err.message);
    console.error('[Planner] Raw response:', response.substring(0, 500));
    throw new Error('Failed to generate learning path outline. Try again.');
  }
}

export { planTopics };
