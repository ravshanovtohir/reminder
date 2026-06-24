require('dotenv').config();

function required(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required`);
  }

  return value;
}

function parseAdminIds(value) {
  if (!value) {
    return new Set();
  }

  return new Set(
    value
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean)
  );
}

function parseStartTime(value) {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);

  if (!match) {
    throw new Error('REMINDER_START_TIME must be in HH:mm format, for example 08:00');
  }

  return {
    hour: Number(match[1]),
    minute: Number(match[2])
  };
}

function parseIntervalHours(value) {
  const interval = Number(value);

  if (!Number.isInteger(interval) || interval <= 0) {
    throw new Error('REMINDER_INTERVAL_HOURS must be a positive integer');
  }

  return interval;
}

const config = {
  botToken: required('BOT_TOKEN'),
  databaseUrl: required('DATABASE_URL'),
  channelId: required('TELEGRAM_CHANNEL_ID'),
  port: Number(process.env.PORT || 3333),
  reminderTimezone: process.env.REMINDER_TIMEZONE || 'Asia/Samarkand',
  reminderStartTime: parseStartTime(process.env.REMINDER_START_TIME || '08:00'),
  reminderIntervalHours: parseIntervalHours(process.env.REMINDER_INTERVAL_HOURS || '1'),
  reactionEmoji: process.env.TELEGRAM_REACTION_EMOJI || '❤',
  adminIds: parseAdminIds(process.env.TELEGRAM_ADMIN_IDS)
};

module.exports = { config };
