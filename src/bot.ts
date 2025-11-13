// src/bot.ts
import { Bot, Keyboard } from '@maxhub/max-bot-api';
import "dotenv/config";
import { userManager } from './userManager';
import { getUserId } from './common';
import { getName, handleMessage, askGender, startDataEditing, calculateCalories, resetUserData, startFoodTracking, showTodaySummary, startFoodInput } from './handlers';
import {keyboard_confirmation, keyboard_diary, keyboard_actions} from './keyboards';
const token = process.env.BOT_TOKEN;
if (!token) throw new Error('Token not provided');
const bot = new Bot(token);

// Действия при начале общения с ботом и при отправке команды /start
bot.on('bot_started', async (ctx) => {
  const userId = getUserId(ctx);
  // Если не удалось получить ID — отправляем ошибку
  if (!userId) {
    await ctx.reply('❌ Не удалось определить ваш профиль.');
    return;
  }
  // Создаём новую запись о пользователе с начальным состоянием
  userManager.createUser(userId);
  await getName(ctx);
});

bot.command('start', async (ctx) => {
  const userId = getUserId(ctx);
  if (!userId) return;
  userManager.createUser(userId);
  await getName(ctx);
});

// Команда /calculate - расчет калорий
bot.command('calculate', async (ctx) => {
  await calculateCalories(ctx);
});

// Команда /reset - сброс данных
bot.command('reset', async (ctx) => {
  await resetUserData(ctx);
});

// Обработка сообщений
bot.on('message_created', async (ctx) => {
  const userId = getUserId(ctx);
  const text = ctx.message?.body?.text?.trim();

  if (!userId || !text) return;

  const user = userManager.getUser(userId);

  // Проверяем, находится ли пользователь в режиме отслеживания питания и вводит еду
  if (user && user.dailyCalories && text.includes('-')) {
    const parts = text.split('-');
    if (parts.length === 2) {
      const food = parts[0].trim();
      const calories = parseInt(parts[1].trim());

      if (!isNaN(calories) && calories > 0) {
        userManager.addFoodEntry(userId, food, calories);
        await ctx.reply(`✅ Добавлено: ${food} - ${calories} ккал`, {attachments: [keyboard_diary]});
        return;
      }
    }
  }

  // Обычная обработка сообщений для регистрации
  await handleMessage(ctx);
});

// Обработка нажатий на кнопки
bot.on('message_callback', async (ctx) => {
  const userId = getUserId(ctx);

  if (!userId) {
    await ctx.reply('❌ Не удалось определить ваш профиль.');
    return;
  }

  const data = ctx.callback.payload;

  if (data === 'start_registration') {
    await askGender(ctx);
  }

  if (data?.startsWith('gender:')) {
    const gender = data.split(':')[1];
    if (gender === 'male' || gender === 'female') {
      userManager.setGender(userId, gender);
      await ctx.reply('Отлично, а теперь укажи свой возраст (полных лет):');
    } else {
      console.log('Invalid gender value:', gender);
    }
  }

  // Обработка выбора активности
  if (data?.startsWith('activity:')) {
    const activityLevel = parseFloat(data.split(':')[1]);
    userManager.setActivity(userId, activityLevel);

    // Показываем сводку с кнопками подтверждения
    const summary = userManager.getUserSummary(userId);
    if (summary) {
      await ctx.reply('✅ Уровень активности сохранён!');
      await ctx.reply(summary, {
        attachments: [keyboard_confirmation]
      });
    }
  }

  // Обработка подтверждения данных
  if (data?.startsWith('confirmation:')) {
    const answer = data.split(':')[1];
    if (answer === 'yes') {
      userManager.confirmData(userId);
      const result = userManager.calculateCalories(userId);
      if (result) {
        await ctx.reply('✅ Отлично! Данные сохранены.\n\n' + result, {attachments: [keyboard_actions]});
      } else {
        await ctx.reply('❌ Не удалось рассчитать калории.');
      }
    }
    if (answer === 'no') {
      await ctx.reply('Хорошо, давай заполним данные заново!');
      await startDataEditing(ctx);
    }
  }

  // Обработка действий после расчета
  if (data?.startsWith('action:')) {
    const action = data.split(':')[1];
    if (action === 'delete') {
      await resetUserData(ctx);
    }
    if (action === 'edit') {
      await startDataEditing(ctx);
    }
    if (action === 'start_tracking') {
      await startFoodTracking(ctx);
    }
  }

  // Обработка выбора цели
  if (data?.startsWith('goal:')) {
    const goal = data.split(':')[1] as 'maintain' | 'loss' | 'gain';
    const calories = userManager.calculateAllCalories(userId);
    if (calories) {
      const dailyCalories = calories[goal];
      userManager.setGoal(userId, goal, dailyCalories);

      await ctx.reply(
        `✅ Отлично! Твоя цель: ${goal === 'maintain' ? 'поддержание веса' : goal === 'loss' ? 'похудение' : 'набор массы'}\n` +
        `🎯 Суточная норма: ${dailyCalories} ккал\n\n` +
        `Теперь ты можешь добавлять приемы пищи и следить за прогрессом!`,
        { attachments: [keyboard_diary] }
      );
    }
  }

  // Обработка дневника
  if (data?.startsWith('diary:')) {
    const action = data.split(':')[1];
    if (action === 'today_summary') {
      await showTodaySummary(ctx);
    }
    if (action === 'change_goal') {
      await startFoodTracking(ctx);
    }
    if (action === 'add_food') {
      await startFoodInput(ctx);
    }
  }
});

bot.start();