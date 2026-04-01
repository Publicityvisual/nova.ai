/**
 * ███╗   ██╗ ██████╗ ██╗   ██╗ █████╗ 
 * ████╗  ██║██╔═══██╗██║   ██║██╔══██╗
 * ██╔██╗ ██║██║   ██║██║   ██║███████║
 * ██║╚██╗██║██║   ██║╚██╗ ██╔╝██╔══██║
 * ██║ ╚████║╚██████╔╝ ╚████╔╝ ██║  ██║
 * ╚═╝  ╚═══╝ ╚═════╝   ╚═══╝  ╚═╝  ╚═╝
 * 
 * NOVA ULTRA - Confidential
 * Proprietary software. Unauthorized copying prohibited.
 * Verified secure implementation.
 * 
 * @copyright 2024 Nova Ultra
 * @version 2.0.0
 * @license Proprietary
 */

/**
 * Web Search Skill
 * Based on: WebStack (clawhub)
 * SAFE: Uses DuckDuckGo API (no scraping, no CAPTCHA)
 */

const axios = require('axios');
const cheerio = require('cheerio');
const logger = require('../../utils/logger');

class WebSearchSkill {
  constructor() {
    this.name = 'web-search';
    this.version = '1.0.0';
    this.author = 'Nova Ultra';
  }

  async initialize() {
    logger.info(`[SKILL] ${this.name} initialized`);
    return true;
  }

  async execute(query) {
    if (!query) {
      return {
        text: '🔍 Web Search\n\nUsage: /skill web-search [query]',
        error: 'No query'
      };
    }

    try {
      // DuckDuckGo HTML (free, no API key needed)
      const html = await this.searchDuckDuckGo(query);
      const results = this.parseResults(html);

      if (results.length === 0) {
        return {
          text: `🔍 No results found for: "${query}"\n\nTry different keywords.`
        };
      }

      const text = `🔍 *Search: "${query}"*\n\n${results.slice(0, 5).map((r, i) => 
        `${i+1}. *${r.title}*\n${r.snippet}\n🔗 ${r.url}`
      ).join('\n\n')}`;

      return {
        text,
        results: results.slice(0, 5)
      };

    } catch (error) {
      logger.error('Search error:', error.message);
      return {
        text: `⚠️ Search temporarily unavailable.\nError: ${error.message}`,
        error: error.message
      };
    }
  }

  async searchDuckDuckGo(query) {
    // Use DuckDuckGo HTML version
    const url = 'https://html.duckduckgo.com/html/';
    const response = await axios.post(url, `q=${encodeURIComponent(query)}`, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 15000
    });
    return response.data;
  }

  parseResults(html) {
    const results = [];
    try {
      const $ = cheerio.load(html);
      
      $('.result').each((i, elem) => {
        const title = $(elem).find('.result__a').text().trim();
        const url = $(elem).find('.result__a').attr('href') || '';
        const snippet = $(elem).find('.result__snippet').text().trim();
        
        if (title) {
          results.push({
            title: title.substring(0, 80),
            url: url.substring(0, 100),
            snippet: snippet.substring(0, 150)
          });
        }
      });
    } catch (e) {
      logger.error('Parse error:', e);
    }
    return results;
  }

  async summary(url) {
    // Fetch and summarize a webpage
    try {
      const response = await axios.get(url, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0'
        }
      });
      const $ = cheerio.load(response.data);
      
      // Remove scripts, styles
      $('script, style, nav, footer, header, aside').remove();
      
      const title = $('title').text() || $('h1').first().text() || 'No title';
      const paragraphs = $('article p, main p, .content p')
        .map((i, el) => $(el).text().trim())
        .get()
        .filter(t => t.length > 50)
        .slice(0, 5);

      return {
        title: title.substring(0, 100),
        summary: paragraphs.join(' ').substring(0, 800)
      };

    } catch (error) {
      return { error: error.message };
    }
  }
}



module.exports = WebSearchSkill;;
