/**
 * Browser Automation - Puppeteer
 * Web browsing, screenshots, form interaction
 */

const puppeteer = require('puppeteer');
const logger = require('../utils/logger');

class Browser {
  constructor(options = {}) {
    this.browser = null;
    this.page = null;
    this.initialized = false;
    this.headless = options.headless !== false;
    this.defaultViewport = options.viewport || { width: 1280, height: 720 };
  }

  async initialize() {
    try {
      logger.info('Initializing browser...');
      
      this.browser = await puppeteer.launch({
        headless: this.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });

      this.page = await this.browser.newPage();
      await this.page.setViewport(this.defaultViewport);
      
      // Set user agent
      await this.page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );

      this.initialized = true;
      logger.info('Browser initialized');
    } catch (error) {
      logger.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  async navigate(url, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Ensure URL has protocol
      if (!url.startsWith('http')) {
        url = 'https://' + url;
      }

      logger.info(`Navigating to: ${url}`);
      
      await this.page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      const title = await this.page.title();
      const currentUrl = this.page.url();

      let result = {
        success: true,
        title,
        url: currentUrl
      };

      // Extract text if requested
      if (options.extractText) {
        const text = await this.extractText();
        result.text = text.substring(0, 4000); // Limit size
      }

      // Extract links if requested
      if (options.extractLinks) {
        const links = await this.extractLinks();
        result.links = links.slice(0, 20); // Limit count
      }

      return result;

    } catch (error) {
      logger.error('Navigation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async extractText() {
    try {
      return await this.page.evaluate(() => {
        // Remove script and style elements
        const scripts = document.querySelectorAll('script, style, nav, footer, header');
        scripts.forEach(s => s.remove());
        
        // Get main content
        const article = document.querySelector('article, main, [role="main"]');
        if (article) {
          return article.innerText;
        }
        
        // Fallback to body
        return document.body.innerText;
      });
    } catch (error) {
      return '';
    }
  }

  async extractLinks() {
    try {
      return await this.page.evaluate(() => {
        return Array.from(document.querySelectorAll('a[href]'))
          .map(a => ({
            text: a.innerText.trim().substring(0, 100),
            href: a.href
          }))
          .filter(l => l.text && l.href.startsWith('http'));
      });
    } catch (error) {
      return [];
    }
  }

  async screenshot(options = {}) {
    if (!this.initialized || !this.page) {
      return {
        success: false,
        error: 'Browser not initialized'
      };
    }

    try {
      const screenshot = await this.page.screenshot({
        type: options.type || 'png',
        fullPage: options.fullPage || false,
        encoding: 'base64'
      });

      return {
        success: true,
        screenshot,
        url: this.page.url(),
        title: await this.page.title()
      };

    } catch (error) {
      logger.error('Screenshot error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async click(selector) {
    if (!this.initialized) {
      return { success: false, error: 'Browser not initialized' };
    }

    try {
      await this.page.waitForSelector(selector, { timeout: 5000 });
      await this.page.click(selector);
      
      // Wait for navigation or changes
      await this.page.waitForTimeout(1000);

      return {
        success: true,
        url: this.page.url(),
        title: await this.page.title()
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to click: ${error.message}`
      };
    }
  }

  async type(input) {
    const [selector, ...textParts] = input.split('|');
    const text = textParts.join('|');

    if (!selector || !text) {
      return {
        success: false,
        error: 'Usage: /type [selector]|[text]'
      };
    }

    try {
      await this.page.waitForSelector(selector.trim(), { timeout: 5000 });
      await this.page.type(selector.trim(), text.trim(), { delay: 50 });

      return {
        success: true,
        message: `Typed "${text.substring(0, 50)}" into ${selector}`
      };

    } catch (error) {
      return {
        success: false,
        error: `Failed to type: ${error.message}`
      };
    }
  }

  async search(query) {
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    return this.navigate(searchUrl, { extractText: true, extractLinks: true });
  }

  async evaluate(script) {
    try {
      const result = await this.page.evaluate(script);
      return {
        success: true,
        result
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.initialized = false;
      logger.info('Browser closed');
    }
  }
}

module.exports = Browser;
