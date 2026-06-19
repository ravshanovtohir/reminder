const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function toBigInt(value) {
  return BigInt(String(value));
}

async function initDb() {
  await prisma.$connect();
}

async function upsertSubscriber({ telegramId, chatId, username, firstName, lastName }) {
  const telegramIdBigInt = toBigInt(telegramId);
  const chatIdBigInt = toBigInt(chatId);

  const existing = await prisma.subscriber.findUnique({
    where: { telegramId: telegramIdBigInt },
    select: { isActive: true }
  });

  await prisma.subscriber.upsert({
    where: { telegramId: telegramIdBigInt },
    create: {
      telegramId: telegramIdBigInt,
      chatId: chatIdBigInt,
      username,
      firstName,
      lastName,
      isActive: true
    },
    update: {
      chatId: chatIdBigInt,
      username,
      firstName,
      lastName,
      isActive: true,
      stoppedAt: null
    }
  });

  return {
    isNew: !existing,
    wasInactive: Boolean(existing && existing.isActive === false)
  };
}

async function closeDb() {
  await prisma.$disconnect();
}

module.exports = {
  initDb,
  upsertSubscriber,
  closeDb
};
