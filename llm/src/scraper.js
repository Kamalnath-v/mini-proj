import axios from 'axios';
import * as cheerio from 'cheerio';

const MAX_CONTENT_LENGTH = 6000;

const BLOCKED_SELECTORS = [
    'nav', 'footer', 'header', 'aside',
    '.sidebar', '.nav', '.menu', '.footer', '.header',
    '.advertisement', '.ad', '.ads', '.cookie',
    'script', 'style', 'noscript', 'iframe',
    '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
];

async function scrapePage(url) {
    try {
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (compatible; ResearchAgent/2.0)',
                'Accept': 'text/html,application/xhtml+xml',
            },
            maxRedirects: 3,
            validateStatus: status => status < 400,
        });

        const contentType = response.headers['content-type'] || '';
        if (!contentType.includes('text/html')) return null;

        const $ = cheerio.load(response.data);

        BLOCKED_SELECTORS.forEach(selector => $(selector).remove());

        let text = '';
        const mainSelectors = ['main', 'article', '[role="main"]', '.content', '.post', '#content'];
        for (const sel of mainSelectors) {
            const el = $(sel);
            if (el.length > 0) {
                text = el.text();
                break;
            }
        }
        if (!text) text = $('body').text();

        text = text.replace(/\s+/g, ' ').replace(/\n\s*\n/g, '\n').trim();

        if (text.length > MAX_CONTENT_LENGTH) {
            text = text.substring(0, MAX_CONTENT_LENGTH) + '... [truncated]';
        }

        if (text.length < 100) return null;

        return { url, content: text };
    } catch {
        return null;
    }
}

export { scrapePage };
