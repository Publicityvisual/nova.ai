/**
 * GitHub Integration
 */

const axios = require('axios');

class GitHubIntegration {
  constructor() {
    this.name = 'github';
    this.token = process.env.GITHUB_TOKEN;
  }

  async initialize() {
    if (!this.token) return false;
    
    this.client = axios.create({
      baseURL: 'https://api.github.com',
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    // Test connection
    try {
      await this.client.get('/user');
      return true;
    } catch {
      return false;
    }
  }

  async query(args) {
    if (typeof args === 'string') {
      // Parse command-like args
      const [command, ...rest] = args.split(' ');
      
      switch (command) {
        case 'repos': return this.getRepos();
        case 'issues': return this.getIssues(rest[0]);
        case 'create': return this.createIssue(rest[0], rest.slice(1).join(' '));
        default: return { error: 'Unknown command: ' + command };
      }
    }
    
    return { error: 'Invalid args' };
  }

  async getRepos() {
    const { data } = await this.client.get('/user/repos?sort=updated&per_page=10');
    return data.map(r => ({
      name: r.full_name,
      url: r.html_url,
      updated: r.updated_at
    }));
  }

  async getIssues(repo) {
    if (!repo) return { error: 'Please specify repository' };
    const { data } = await this.client.get(`/repos/${repo}/issues?state=open`);
    return data.map(i => ({
      number: i.number,
      title: i.title,
      url: i.html_url,
      author: i.user.login
    }));
  }

  async createIssue(repo, title) {
    if (!title) return { error: 'Title required' };
    const [owner, name] = repo.split('/');
    
    const { data } = await this.client.post(`/repos/${repo}/issues`, {
      title: title
    });
    
    return { success: true, issue: { number: data.number, url: data.html_url } };
  }
}

module.exports = GitHubIntegration;
