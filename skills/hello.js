/**
 * Example Skill: Hello World
 * A simple skill to demonstrate the skills system
 */

module.exports = {
  name: 'hello',
  description: 'Simple greeting skill - says hello',
  version: '1.0.0',
  author: 'Nova Team',
  
  /**
   * Execute the skill
   * @param {string} args - Arguments passed to the skill
   * @returns {string} Response message
   */
  async execute(args) {
    const name = args.trim() || 'World';
    const greetings = [
      `Hello, ${name}! 👋`,
      `Hi there, ${name}! 🎉`,
      `Hey ${name}! How's it going? 🚀`,
      `Greetings, ${name}! 🌟`
    ];
    
    // Return random greeting
    return greetings[Math.floor(Math.random() * greetings.length)];
  }
};
