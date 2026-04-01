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
 * Reminder Skill - Set reminders
 */

const logger = require('../../utils/logger');

class ReminderSkill {
  constructor() {
    this.name = 'reminder';
    this.reminders = [];
  }

  async initialize() {
    // Start checking reminders
    setInterval(() => this.checkReminders(), 60000);
    return true;
  }

  async execute(input) {
    // formats: "5 minutes drink water" or "tomorrow 3pm call mom"
    const reminder = this.parseReminder(input);
    
    if (!reminder) {
      return {
        error: 'Could not understand reminder format.\nExamples:\n• "5 minutes drink water"\n• "tomorrow at 3pm call mom"\n• "in 2 hours take a break"'
      };
    }

    this.reminders.push(reminder);
    
    return {
      text: `✅ Reminder set!\n*${reminder.message}*\n⏰ ${reminder.time.toLocaleString()}`,
      reminder
    };
  }

  parseReminder(input) {
    const lower = input.toLowerCase();
    let timeMatch;
    let message;
    const now = new Date();

    // "in X minutes/hours/days"
    const relativeMatch = lower.match(/in\s+(\d+)\s+(minute|hour|day)s?\s+(.+)/);
    if (relativeMatch) {
      const amount = parseInt(relativeMatch[1]);
      const unit = relativeMatch[2];
      message = relativeMatch[3];
      
      const target = new Date(now);
      if (unit === 'minute') target.setMinutes(target.getMinutes() + amount);
      else if (unit === 'hour') target.setHours(target.getHours() + amount);
      else if (unit === 'day') target.setDate(target.getDate() + amount);
      
      return { time: target, message, created: now };
    }

    // "5 minutes X"
    const simpleMatch = lower.match(/^(\d+)\s*(min|minute|hour)s?\s+(.+)/);
    if (simpleMatch) {
      const amount = parseInt(simpleMatch[1]);
      const unit = simpleMatch[2];
      message = simpleMatch[3];
      
      const target = new Date(now);
      if (unit === 'min' || unit === 'minute') target.setMinutes(target.getMinutes() + amount);
      else target.setHours(target.getHours() + amount);
      
      return { time: target, message, created: now };
    }

    return null;
  }

  checkReminders() {
    const now = new Date();
    this.reminders = this.reminders.filter(r => {
      if (r.time <= now) {
        // Trigger reminder
        logger.info(`🔔 REMINDER: ${r.message}`);
        // This would notify the user through the adapter
        return false;
      }
      return true;
    });
  }
}



module.exports = ReminderSkill;;
