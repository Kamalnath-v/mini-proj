import axios from 'axios';
import { scrapePage } from './scraper.js';

async function searchSerper(query, maxResults = 3) {
    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) throw new Error('SERPER_API_KEY is not set.');

    try {
        const response = await axios.post(
            'https://google.serper.dev/search',
            { q: query, num: maxResults },
            {
                headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
                timeout: 10000,
            }
        );

        return (response.data.organic || []).slice(0, maxResults).map(item => ({
            title: item.title || '',
            url: item.link || '',
            snippet: item.snippet || '',
        }));
    } catch {
        return [];
    }
}

async function researchSubtopics(plan) {
    const maxSources = parseInt(process.env.MAX_SOURCES_PER_SUBTOPIC) || 2;
    const researchData = [];

    for (const topic of plan.topics) {
        console.log(`\n[Researcher] Researching topic: "${topic.title}"`);

        for (const subtopic of topic.subtopics) {
            const query = `${subtopic.title} ${plan.title} tutorial guide`;
            console.log(`  [Search] "${query}"`);

            const results = await searchSerper(query, maxSources);
            const sources = [];

            for (const result of results) {
                const scraped = await scrapePage(result.url);
                sources.push({
                    title: result.title,
                    url: result.url,
                    snippet: result.snippet,
                    content: scraped ? scraped.content : '',
                });
            }

            researchData.push({
                topicTitle: topic.title,
                subtopicTitle: subtopic.title,
                sources,
            });

            console.log(`  [OK] Found ${sources.length} sources for "${subtopic.title}"`);
        }
    }

    const totalSources = researchData.reduce((sum, r) => sum + r.sources.length, 0);
    console.log(`\n[Researcher] Research complete: ${totalSources} total sources collected`);

    return researchData;
}

export { researchSubtopics };
