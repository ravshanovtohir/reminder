# Telegram Reminder Bot

Kichkina Node.js + Express + PostgreSQL Telegram bot.

Bot vazifasi:

- `/start` bosgan userlarni PostgreSQL bazaga yozadi.
- Har kuni bir xil vaqtlarda ruscha zikr xabarlarini kanalga ketma-ket yuboradi.
- Til tanlash yo‘q, bot faqat rus tilida ishlaydi.
- To‘xtatish komandasi yo‘q; kim `/start` bosgan bo‘lsa, bazaga yoziladi.
- `/start` bosilganda userga javob yubormaydi.
- Yangi obunachi qo‘shilganda adminlarga ID, ism va username bilan xabar yuboradi.
- `/test` faqat admin uchun kanalga bitta test xabar yuboradi.
- `/id` userga o‘z Telegram ID raqamini ko‘rsatadi.

## Ishga tushirish

```bash
npm install
cp .env.example .env
```

`.env` ichida quyidagilarni to‘ldiring:

```env
BOT_TOKEN=telegramdan_olingan_token
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/reminder_bot
TELEGRAM_CHANNEL_ID=@your_channel_username
REMINDER_TIMEZONE=Asia/Samarkand
REMINDER_START_TIME=08:00
REMINDER_INTERVAL_HOURS=1
TELEGRAM_ADMIN_IDS=123456789
```

PostgreSQL database yarating:

```bash
createdb reminder_bot
```

Prisma Client generatsiya qiling va migrationni databasega qo‘llang:

```bash
npm run prisma:generate
npm run migrate:dev
```

Keyin botni ishga tushiring:

```bash
npm start
```

Serverda yangi deploy paytida migration uchun shuni ishlating:

```bash
npm run migrate
```

## Test qilish

1. BotFather orqali bot yarating va tokenni `.env`dagi `BOT_TOKEN`ga yozing.
2. PostgreSQL database yarating va `DATABASE_URL`ni to‘g‘rilang.
3. Botni kanalga admin qilib qo‘shing va post yozish huquqini bering.
4. `.env`dagi `TELEGRAM_CHANNEL_ID`ga kanal usernameini yozing, masalan `@your_channel_username`.
5. `npm run prisma:generate` va `npm run migrate:dev` qiling.
6. Botni `npm start` bilan ishga tushiring.
7. Telegramda botga `/id` yuboring.
8. Chiqqan IDni `.env`dagi `TELEGRAM_ADMIN_IDS`ga yozing.
9. Botni qayta ishga tushiring.
10. Telegramda `/start` bosing.
11. Darrov kanalga test xabar yuborish uchun `/test` bosing.

`/test` userlarga emas, faqat sozlangan kanalga bitta test xabar yuboradi.

## Vaqt sozlamasi

Default holatda 12 ta xabar har kuni `08:00` dan boshlab 1 soat oralig‘ida yuboriladi:

```text
08:00, 09:00, 10:00, ... 19:00
```

Masalan har 2 soatda yuborish uchun:

```env
REMINDER_START_TIME=06:00
REMINDER_INTERVAL_HOURS=2
```

## Telegram buyruqlari

```text
/start  - obuna bo‘lish
/id     - Telegram ID ni ko‘rish
/test   - kanalga test xabar, faqat adminlar uchun
```
