import { askLLM } from './groqClient.js';

/**
 * Generate a roadmap by using the LLM to research a topic from roadmap.sh.
 * The LLM is instructed to base its response on roadmap.sh content for the given topic.
 * @param {string} topic - Topic name (e.g. "frontend") or full URL (e.g. "https://roadmap.sh/frontend")
 * @returns {Promise<Object>} - Roadmap JSON object
 */
async function generateFromRoadmapSh(topic) {
    // Normalize: if user passed a full URL, extract the path
    let roadmapTopic = topic;
    if (topic.startsWith('https://roadmap.sh/')) {
        roadmapTopic = topic.replace('https://roadmap.sh/', '');
    } else if (topic.startsWith('http://roadmap.sh/')) {
        roadmapTopic = topic.replace('http://roadmap.sh/', '');
    }

    console.log(`[Roadmap.sh] Generating roadmap for topic: "${roadmapTopic}"`);

    const prompt = `You are a learning-path architect. Generate a comprehensive structured learning roadmap for "${roadmapTopic}" based on what roadmap.sh covers for this topic.

The roadmap at https://roadmap.sh/${roadmapTopic} covers the essential skills, tools, and concepts a developer needs to learn. Based on your knowledge of this roadmap, generate a detailed JSON learning path.

JSON format:
{
  "title": "${roadmapTopic} Roadmap",
  "description": "A comprehensive learning path for ${roadmapTopic}",
  "topics": [
    {
      "title": "Major section",
      "description": "What this section covers",
      "subtopics": [
        {
          "title": "Subtopic",
          "description": "Detailed explanation (2-3 sentences)",
          "resources": [
            { "title": "Resource", "url": "https://real-url", "type": "article|video|documentation|tutorial" }
          ],
          "questions": [
            { "question": "Quiz question", "options": ["A","B","C","D"], "correctAnswer": 0 }
          ]
        }
      ]
    }
  ]
}

Rules:
1. Cover ALL major sections from the roadmap.sh ${roadmapTopic} roadmap.
2. Each subtopic must have 1-2 real resource URLs and 1-2 quiz questions.
3. Descriptions should be educational and detailed, not just repeating titles.
4. correctAnswer is a 0-based index.
5. Return ONLY valid JSON.`;

    const response = await askLLM(prompt, {
        temperature: 0.4,
        maxTokens: parseInt(process.env.MAX_TOKENS_RESEARCH) || 16384,
    });

    // Parse JSON response
    let cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const roadmap = JSON.parse(cleaned);

    if (!roadmap.title || !roadmap.topics || !Array.isArray(roadmap.topics)) {
        throw new Error('Invalid roadmap structure from LLM');
    }

    // Normalize fields
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
    console.log(`[Roadmap.sh] Generated: ${roadmap.topics.length} topics, ${subtopicCount} subtopics`);

    return roadmap;
}

export { generateFromRoadmapSh };
