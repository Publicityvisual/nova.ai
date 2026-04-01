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
 * Text Summarizer Skill
 * Summarizes long texts using AI or local algorithm
 */

const logger = require('../../utils/logger');

class TextSummarizerSkill {
  constructor() {
    this.name = 'summarize';
    this.version = '1.0.0';
  }

  async initialize() {
    logger.info(`[SKILL] ${this.name} initialized`);
    return true;
  }

  async execute(text, context) {
    if (!text || text.length < 100) {
      return {
        text: '📝 Text Summarizer\n\nUsage: /skill summarize [text or URL]\n\n- Paste long text to summarize\n- Or provide URL to summarize webpage',
        error: 'Text too short'
      };
    }

    // Check if it's a URL
    if (text.match(/^https?:\/\//)) {
      return await this.summarizeURL(text, context);
    }

    // Local summarization if no AI
    if (!context?.ai) {
      return this.localSummarize(text);
    }

    // AI-powered summarization
    try {
      const prompt = `Resume el siguiente texto en español o inglés (dependiendo del idioma original), manteniendo los puntos clave:\n\n"${text.substring(0, 4000)}"\n\nResumen (3-5 puntos):`;
      
      const summary = await context.ai.process(prompt, context);
      
      return {
        text: `📋 *Resumen*\n\n${summary}\n\n_Original: ${text.length} caracteres_`,
        originalLength: text.length,
        summary
      };
    } catch (error) {
      return this.localSummarize(text);
    }
  }

  async summarizeURL(url, context) {
    try {
      // Try to fetch (if browser available)
      if (context?.browser) {
        const page = await context.browser.navigate(url, { extractText: true });
        return await this.execute(page.text || '', context);
      }

      return {
        text: `🔗 URL received: ${url}\n\nPara resumir URLs, usa /browse primero.`
      };
    } catch (error) {
      return { error: `Failed to fetch URL: ${error.message}` };
    }
  }

  localSummarize(text) {
    // Simple extractive summarization
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    
    if (sentences.length <= 3) {
      return { text: '📝 Texto muy corto para resumir.' };
    }

    // Score sentences (simple: presence of important words)
    const wordFreq = {};
    sentences.forEach(s => {
      s.toLowerCase().split(/\s+/).forEach(w => {
        if (w.length > 4) wordFreq[w] = (wordFreq[w] || 0) + 1;
      });
    });

    const scored = sentences.map((s, i) => {
      const score = s.toLowerCase().split(/\s+/).reduce((sum, w) => sum + (wordFreq[w] || 0), 0);
      return { sentence: s.trim(), score, index: i };
    });

    // Pick top 3 sentences, preserving order
    const top = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, Math.min(3, sentences.length))
      .sort((a, b) => a.index - b.index);

    const summary = top.map(s => `• ${s.sentence}`).join('\n');

    return {
      text: `📋 *Resumen Automático*\n\n${summary}\n\n_Original: ${text.length} caracteres, ${sentences.length} oraciones_`,
      summary
    };
  }
}



module.exports = TextSummarizerSkill;;
