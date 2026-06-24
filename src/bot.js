const { Telegraf } = require('telegraf');
const { messages } = require('./messages');
const { getScheduleSummary, getSchedulerDebugSummary, sendChannelReminder } = require('./scheduler');
const { upsertSubscriber } = require('./db');

function formatUser(ctx) {
  return {
    telegramId: ctx.from.id,
    chatId: ctx.chat.id,
    username: ctx.from.username || null,
    firstName: ctx.from.first_name || null,
    lastName: ctx.from.last_name || null
  };
}

function isAdmin(userId, adminIds) {
  return adminIds.has(String(userId));
}

function formatSubscriberNotification(ctx, status) {
  const fullName = [ctx.from.first_name, ctx.from.last_name].filter(Boolean).join(' ') || '-';
  const username = ctx.from.username ? `@${ctx.from.username}` : '-';
  const label = status === 'reactivated' ? 'Подписчик вернулся' : 'Новый подписчик';

  return [
    label,
    `ID: ${ctx.from.id}`,
    `Имя: ${fullName}`,
    `Username: ${username}`
  ].join('\n');
}

async function notifyAdmins(bot, config, text) {
  for (const adminId of config.adminIds) {
    try {
      await bot.telegram.sendMessage(adminId, text);
    } catch (error) {
      console.error('Failed to notify admin', {
        adminId,
        error: error.message
      });
    }
  }
}

function createBot(config) {
  const bot = new Telegraf(config.botToken);

  bot.start(async (ctx) => {
    const result = await upsertSubscriber(formatUser(ctx));

    if (result.isNew || result.wasInactive) {
      await notifyAdmins(
        bot,
        config,
        formatSubscriberNotification(ctx, result.wasInactive ? 'reactivated' : 'new')
      );
    }
  });

  bot.command('id', async (ctx) => {
    await ctx.reply(`Ваш Telegram ID: ${ctx.from.id}`);
  });

  bot.command('test', async (ctx) => {
    if (!isAdmin(ctx.from.id, config.adminIds)) {
      await ctx.reply('Эта команда доступна только администратору.');
      return;
    }

    await sendChannelReminder(bot, config.channelId, messages[0], config.reactionEmoji);
    await ctx.reply('Тестовое сообщение отправлено в канал.');
  });

  bot.command('schedule', async (ctx) => {
    if (!isAdmin(ctx.from.id, config.adminIds)) {
      await ctx.reply('Эта команда доступна только администратору.');
      return;
    }

    await ctx.reply(getScheduleSummary(config));
  });

  bot.command('debug', async (ctx) => {
    if (!isAdmin(ctx.from.id, config.adminIds)) {
      await ctx.reply('Эта команда доступна только администратору.');
      return;
    }

    await ctx.reply(getSchedulerDebugSummary(config));
  });

  bot.catch((error, ctx) => {
    console.error('Bot error', {
      error,
      updateType: ctx.updateType,
      from: ctx.from?.id
    });
  });

  return bot;
}

module.exports = { createBot };
