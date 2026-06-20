const { messages } = require('./messages');

const CHECK_INTERVAL_MS = 30 * 1000;

function buildSchedules(startTime, intervalHours) {
  const startMinutes = startTime.hour * 60 + startTime.minute;
  const intervalMinutes = intervalHours * 60;

  return messages.map((text, index) => {
    const minutesInDay = (startMinutes + index * intervalMinutes) % (24 * 60);
    const hour = Math.floor(minutesInDay / 60);
    const minute = minutesInDay % 60;

    return {
      index: index + 1,
      text,
      hour,
      minute,
      cronExpression: `${minute} ${hour} * * *`
    };
  });
}

function formatTime(hour, minute) {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function getZonedNow(timezone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(new Date());

  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)])
  );

  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second
  };
}

function getScheduleKey(now, schedule) {
  return [
    now.year,
    String(now.month).padStart(2, '0'),
    String(now.day).padStart(2, '0'),
    schedule.index,
    formatTime(schedule.hour, schedule.minute)
  ].join(':');
}

function getScheduleSummary(config) {
  const schedules = buildSchedules(config.reminderStartTime, config.reminderIntervalHours);
  const now = getZonedNow(config.reminderTimezone);
  const nowMinute = now.hour * 60 + now.minute + now.second / 60;
  const nextSchedule =
    schedules.find((schedule) => schedule.hour * 60 + schedule.minute > nowMinute) || schedules[0];

  return [
    'Расписание зикров',
    `Канал: ${config.channelId}`,
    `Часовой пояс: ${config.reminderTimezone}`,
    `Сейчас: ${formatTime(now.hour, now.minute)}:${String(now.second).padStart(2, '0')}`,
    `Следующее сообщение: ${formatTime(nextSchedule.hour, nextSchedule.minute)} — ${nextSchedule.text}`,
    '',
    ...schedules.map(
      (schedule) => `${schedule.index}. ${formatTime(schedule.hour, schedule.minute)} — ${schedule.text}`
    )
  ].join('\n');
}

async function sendChannelReminder(bot, channelId, text) {
  await bot.telegram.sendMessage(channelId, text);
  console.log('Reminder sent to channel', { channelId, text });
}

async function runDueReminders(bot, config, schedules, sentKeys) {
  const now = getZonedNow(config.reminderTimezone);
  const dueSchedules = schedules.filter(
    (schedule) => schedule.hour === now.hour && schedule.minute === now.minute
  );

  for (const schedule of dueSchedules) {
    const key = getScheduleKey(now, schedule);

    if (sentKeys.has(key)) {
      continue;
    }

    console.log('Reminder due', {
      timezone: config.reminderTimezone,
      time: `${formatTime(now.hour, now.minute)}:${String(now.second).padStart(2, '0')}`,
      channelId: config.channelId,
      schedule: schedule.index
    });

    await sendChannelReminder(bot, config.channelId, schedule.text);
    sentKeys.add(key);
  }
}

function startReminderScheduler(bot, config) {
  const schedules = buildSchedules(config.reminderStartTime, config.reminderIntervalHours);
  const sentKeys = new Set();

  const checkDueReminders = () => {
    runDueReminders(bot, config, schedules, sentKeys).catch((error) => {
      console.error('Reminder scheduler check failed', error);
    });
  };

  console.log('Reminder scheduler started');
  for (const schedule of schedules) {
    const time = formatTime(schedule.hour, schedule.minute);
    console.log(`${time} ${config.reminderTimezone} -> ${config.channelId} -> ${schedule.text}`);
  }

  checkDueReminders();
  return setInterval(checkDueReminders, CHECK_INTERVAL_MS);
}

module.exports = {
  buildSchedules,
  getScheduleSummary,
  runDueReminders,
  sendChannelReminder,
  startReminderScheduler
};
