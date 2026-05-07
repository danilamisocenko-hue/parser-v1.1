import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';

dotenv.config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');

// Middleware для логирования
bot.use(async (ctx, next) => {
  console.log(`[Bot] Message from ${ctx.from?.username}: ${ctx.text}`);
  await next();
});

bot.start((ctx) => {
  ctx.reply('Парсер Бот запущен! Используйте команду /help для списка команд.');
});

bot.help((ctx) => {
  ctx.reply('Доступные команды:\n/status - проверить состояние задач\n/balance - ваш баланс');
});

bot.command('status', (ctx) => {
  // Здесь будет логика запроса к БД
  ctx.reply('Задачи в работе: 2\nЗавершено сегодня: 15');
});

bot.launch().then(() => {
  console.log('Telegram Bot started');
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
