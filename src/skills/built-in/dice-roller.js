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
 * Dice Roller / Random Generator Skill
 * For RPG, decisions, random selection
 */

const crypto = require('crypto');
const logger = require('../../utils/logger');

class DiceRollerSkill {
  constructor() {
    this.name = 'dice';
    this.version = '1.0.0';
  }

  async initialize() {
    logger.info(`[SKILL] ${this.name} initialized`);
    return true;
  }

  execute(query) {
    if (!query) {
      return this.getHelp();
    }

    const lower = query.toLowerCase();

    // D&D style: d20, 2d6, etc.
    const diceMatch = lower.match(/(\d*)d(\d+)/);
    if (diceMatch) {
      const count = parseInt(diceMatch[1]) || 1;
      const sides = parseInt(diceMatch[2]);
      return this.rollDice(count, sides);
    }

    // Range: 1-100, 50-100
    const rangeMatch = lower.match(/(-?\d+)[\s\-to]+(-?\d+)/);
    if (rangeMatch) {
      const min = parseInt(rangeMatch[1]);
      const max = parseInt(rangeMatch[2]);
      return this.rollRange(min, max);
    }

    // Choose from list
    if (lower.includes('choose') || lower.includes('pick') || lower.includes('select')) {
      const options = query.split(/[,\s]+/).filter(w => !['choose', 'pick', 'select'].includes(w.toLowerCase()));
      if (options.length >= 2) {
        return this.chooseOne(options);
      }
    }

    // Flip coin
    if (lower.includes('coin') || lower.includes('flip')) {
      return this.flipCoin();
    }

    // Yes/No
    if (lower.includes('yes') || lower.includes('no') || lower.includes('?')) {
      return this.yesOrNo();
    }

    // Number
    if (/\d+/.test(query)) {
      const max = parseInt(query.match(/\d+/)[0]);
      return this.rollRange(1, max);
    }

    return this.getHelp();
  }

  rollDice(count, sides) {
    const results = [];
    for (let i = 0; i < count; i++) {
      results.push(crypto.randomInt(1, sides + 1));
    }

    const total = results.reduce((a, b) => a + b, 0);
    const diceEmoji = this.getDiceEmoji(sides);

    return {
      text: `${diceEmoji} *Roll ${count}d${sides}*\n\n${results.join(' + ')} = *${total}*`,
      results,
      total
    };
  }

  rollRange(min, max) {
    const result = crypto.randomInt(min, max + 1);
    return {
      text: `🎲 *Random ${min}-${max}*\n\nResult: *${result}*`,
      result,
      range: [min, max]
    };
  }

  chooseOne(options) {
    const choice = options[crypto.randomInt(options.length)];
    return {
      text: `🎯 *Random Choice*\n\nOpciones: ${options.join(', ')}\n\nSelección: *${choice}* 🎉`,
      choice,
      options
    };
  }

  flipCoin() {
    const result = crypto.randomInt(2) === 0 ? 'Heads' : 'Tails';
    const emoji = result === 'Heads' ? '👑' : '🪙';
    return {
      text: `${emoji} *Coin Flip*\n\nResult: *${result}*`,
      result
    };
  }

  yesOrNo() {
    const answers = [
      { text: 'Yes', emoji: '👍' },
      { text: 'No', emoji: '👎' },
      { text: 'Absolutely!', emoji: '💯' },
      { text: 'Definitely not', emoji: '🚫' },
      { text: 'Maybe...', emoji: '🤔' },
      { text: 'Ask again later', emoji: '⏳' }
    ];
    const answer = answers[crypto.randomInt(answers.length)];
    
    return {
      text: `${answer.emoji} *The Universe Says*\n\n*${answer.text}*`,
      answer: answer.text
    };
  }

  getDiceEmoji(sides) {
    const map = { 4: '🎲', 6: '🎲', 8: '🎲', 10: '🔟', 12: '🎯', 20: '⚔️', 100: '💯' };
    return map[sides] || '🎲';
  }

  getHelp() {
    return {
      text: `🎲 Dice Roller

Commands:
/skill dice d20 - Roll 20-sided
/skill dice 2d6 - Roll 2 six-sided
/skill dice 1-100 - Random 1-100
/skill dice flip - Flip coin
/skill dice yes/no - Magic 8-ball
/skill dice choose pizza burger pasta - Random choice`
    };
  }
}



module.exports = DiceRollerSkill;;
