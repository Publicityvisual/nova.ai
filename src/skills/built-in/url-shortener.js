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
 * URL Shortener Skill
 * Uses TinyURL API (free, no key needed)
 */

const axios = require('axios');
const logger = require('../../utils/logger');

class URLShortenerSkill {
  constructor() {
    this.name = 'url-shortener';
    this.version = '1.0.0';
    this.author = 'Nova Ultra';
  }

  async initialize() {
    logger.info(`[SKILL] ${this.name} initialized`);
    return true;
  }

  async execute(url) {
    if (!url || !url.match(/^https?:\/\/.+/)) {
      return {
        text: `🔗 URL Shortener

Usage: /skill url-shortener [URL]

Example:
/skill url-shortener https://example.com/very/long/url`,
        error: 'Invalid URL'
      };
    }

    try {
      // TinyURL API
      const shortUrl = await this.shortenTinyURL(url);
      
      return {
        text: `🔗 *URL Shortened*

📎 Original: ${url}
🔗 Short: ${shortUrl}

Click or copy the short URL.`,
        original: url,
        shortUrl,
        provider: 'tinyurl'
      };

    } catch (error) {
      logger.error('URL shortener error:', error.message);
      return {
        text: `❌ Failed to shorten URL\nError: ${error.message}`,
        error: error.message
      };
    }
  }

  async shortenTinyURL(url) {
    const response = await axios.get(
      `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`,
      { timeout: 10000 }
    );
    return response.data;
  }

  async shortenIsgd(url) {
    const response = await axios.get(
      `https://is.gd/create.php?format=simple&url=${encodeURIComponent(url)}`,
      { timeout: 10000 }
    );
    return response.data;
  }

  async unshorten(url) {
    // Follow redirects to get original URL
    try {
      const response = await axios.head(url, {
        maxRedirects: 0,
        timeout: 5000,
        validateStatus: status => status >= 200 && status < 400
      });
      
      const original = response.headers?.location || url;
      return {
        text: `🔍 *URL Expanded*

🔗 Short: ${url}
📎 Original: ${original}`,
        original
      };
    } catch (error) {
      return { error: 'Could not expand URL' };
    }
  }
}



module.exports = URLShortenerSkill;;
