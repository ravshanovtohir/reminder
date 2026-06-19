const { config } = require('./config');
const { initDb, closeDb } = require('./db');
const { createBot } = require('./bot');
const { startReminderScheduler } = require('./scheduler');
const { createServer } = require('./server');

async function main() {
  await initDb();

  const bot = createBot(config);
  await bot.launch();

  startReminderScheduler(bot, config);

  const app = createServer();
  const server = app.listen(config.port, () => {
    console.log(`Express server listening on port ${config.port}`);
  });

  async function shutdown(signal) {
    console.log(`Received ${signal}, shutting down`);
    server.close();
    bot.stop(signal);
    await closeDb();
    process.exit(0);
  }

  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((error) => {
  console.error('Application failed to start', error);
  process.exit(1);
});
