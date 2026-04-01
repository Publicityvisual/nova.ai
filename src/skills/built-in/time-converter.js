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
 * Time Converter Skill
 * Time zones, countdowns, world clock
 */

class TimeConverterSkill {
  constructor() {
    this.name = 'time';
    this.version = '1.0.0';
  }

  async initialize() {
    return true;
  }

  execute(query) {
    if (!query) {
      return this.getHelp();
    }

    const lower = query.toLowerCase();

    // Current times
    if (lower.includes('now') || lower.includes('current')) {
      return this.getWorldTimes();
    }

    // Countdown
    const countdownMatch = lower.match(/countdown (to|for)\s+(.+)/);
    if (countdownMatch || lower.includes('countdown')) {
      const date = query.replace(/countdown/i, '').replace(/to|for/i, '').trim();
      return this.countdown(date || '2024-12-31');
    }

    // Convert timezones
    const tzMatch = lower.match(/(\d{1,2}:\d{2})\s+([\w\s]+)\s+to\s+([\w\s]+)/);
    if (tzMatch) {
      return this.convertTime(tzMatch[1], tzMatch[2], tzMatch[3]);
    }

    // Specific timezone
    const cities = ['new york', 'london', 'tokyo', 'sydney', 'paris', 'berlin', 'beijing', 'moscow'];
    const found = cities.find(c => lower.includes(c));
    if (found) {
      return this.getCityTime(found);
    }

    return this.getHelp();
  }

  getWorldTimes() {
    const times = [
      { city: '🗽 New York', tz: 'America/New_York' },
      { city: '🇬🇧 London', tz: 'Europe/London' },
      { city: '🇩🇪 Berlin', tz: 'Europe/Berlin' },
      { city: '🇦🇪 Dubai', tz: 'Asia/Dubai' },
      { city: '🇮🇳 Mumbai', tz: 'Asia/Kolkata' },
      { city: '🇯🇵 Tokyo', tz: 'Asia/Tokyo' },
      { city: '🇦🇺 Sydney', tz: 'Australia/Sydney' }
    ];

    const lines = times.map(t => {
      const time = new Date().toLocaleTimeString('en-US', {
        timeZone: t.tz,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      return `${t.city}: ${time}`;
    }).join('\n');

    return { text: `🌍 *World Clock*\n\n${lines}` };
  }

  countdown(dateStr) {
    const target = new Date(dateStr);
    const now = new Date();
    const diff = target - now;

    if (diff < 0) {
      return { text: '⏰ That date has already passed!' };
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return {
      text: `⏳ *Countdown to ${dateStr}*\n\n${days} days\n${hours} hours\n${minutes} minutes`,
      days, hours, minutes
    };
  }

  getCityTime(city) {
    const tzMap = {
      'new york': 'America/New_York',
      'london': 'Europe/London',
      'tokyo': 'Asia/Tokyo',
      'sydney': 'Australia/Sydney',
      'paris': 'Europe/Paris',
      'berlin': 'Europe/Berlin',
      'beijing': 'Asia/Shanghai',
      'moscow': 'Europe/Moscow'
    };

    const tz = tzMap[city];
    if (!tz) return { text: `Unknown city: ${city}` };

    const time = new Date().toLocaleString('en-US', {
      timeZone: tz,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });

    return { text: `🕐 *Time in ${city}*\n\n${time}` };
  }

  convertTime(time, from, to) {
    // Simplified - just placeholder
    return {
      text: `🕐 *Timezone Converter*\n\n${time} ${from} → ${time} ${to}\n\n(Note: Full conversion needs moment-timezone library)`
    };
  }

  getHelp() {
    return {
      text: `🕐 Time Converter

Commands:
/skill time now - World clock
/skill time countdown [date] - Days remaining
/skill time new york - Time in city
/skill time convert 14:00 EST to PST - Convert

Supported cities: New York, London, Tokyo, Sydney, etc.`
    };
  }
}



module.exports = TimeConverterSkill;;
