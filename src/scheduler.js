const cron = require('node-cron');
const { messages } = require('./messages');

function buildSchedules(startTime, intervalHours) {
  const startMinutes = startTime.hour * 60 + startTime.minute;
  const intervalMinutes = intervalHours * 60;

  return messages.map((text, index) => {
    const minutesInDay = (startMinutes + index * intervalMinutes) % (24 * 60);
    const hour = Math.floor(minutesInDay / 60);
    const minute = minutesInDay % 60;

    return {
      text,
      hour,
      minute,
      cronExpression: `${minute} ${hour} * * *`
    };
  });
}

async function sendChannelReminder(bot, channelId, text) {
  await bot.telegram.sendMessage(channelId, text);
  console.log('Reminder sent to channel', { channelId, text });
}

function startReminderScheduler(bot, config) {
  const schedules = buildSchedules(config.reminderStartTime, config.reminderIntervalHours);

  for (const schedule of schedules) {
    cron.schedule(
      schedule.cronExpression,
      () => {
        sendChannelReminder(bot, config.channelId, schedule.text).catch((error) => {
          console.error('Reminder job failed', error);
        });
      },
      {
        timezone: config.reminderTimezone,
        noOverlap: true
      }
    );
  }

  console.log('Reminder scheduler started');
  for (const schedule of schedules) {
    const time = `${String(schedule.hour).padStart(2, '0')}:${String(schedule.minute).padStart(2, '0')}`;
    console.log(`${time} ${config.reminderTimezone} -> ${config.channelId} -> ${schedule.text}`);
  }
}

module.exports = {
  buildSchedules,
  sendChannelReminder,
  startReminderScheduler
};
