/**
 * Notion Integration
 */

const axios = require('axios');
const logger = require('../utils/logger');

class NotionIntegration {
  constructor() {
    this.name = 'notion';
    this.apiKey = process.env.NOTION_API_KEY;
    this.databaseId = process.env.NOTION_DATABASE_ID;
  }

  async initialize() {
    if (!this.apiKey) {
      return false;
    }
    
    this.client = axios.create({
      baseURL: 'https://api.notion.com/v1',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });

    return true;
  }

  async query(args) {
    if (!this.client) return { error: 'Not initialized' };
    
    try {
      // Search or query database
      const response = await this.client.post(`databases/${this.databaseId}/query`, {
        page_size: 10
      });
      
      return {
        success: true,
        results: response.data.results
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  async createPage(title, content) {
    try {
      const response = await this.client.post('pages', {
        parent: { database_id: this.databaseId },
        properties: {
          Name: {
            title: [{ text: { content: title } }]
          }
        },
        children: content.map(c => ({
          object: 'block',
          type: 'paragraph',
          paragraph: { rich_text: [{ text: { content: c } }] }
        }))
      });

      return { success: true, page: response.data };
    } catch (error) {
      return { error: error.message };
    }
  }
}

module.exports = NotionIntegration;
