import { Bot } from '@maxhub/max-bot-api';
import "dotenv/config";
import { userManager } from './usermanager.ts';
import { getUserId, safeReply, delay, measureTime, isProcessing, startProcessing, endProcessing, canProcessRequest, ensureString, safeAnswerCallback } from './common.ts';
import {
  getName, handleMessage, askGender, startDataEditing, calculateCalories,
  resetUserData, startFoodTracking, showTodaySummary, startFoodInput,
  showFavorites, setupReminders, showEditMenu, handleFieldEdit, finishEditing,
  finishTrackingSetup, showMainDiaryMenu, suggestAddToFavorites
} from './handlers.ts';
import {
  keyboard_diary, keyboard_actions, keyboard_reminder_times,
  keyboard_confirm_food, keyboard_edit_choice, keyboard_reminder_choice,
  keyboard_confirmation_with_edit
} from './keyboards.ts';
import { db } from './database.ts';

const token = process.env.BOT_TOKEN;
if (!token) throw new Error('Token not provided');
const bot = new Bot(token);

// Действия при начале общения с ботом и при отправке команды /start
bot.on('bot_started', async (ctx) => {
  return measureTime('Bot Started', async () => {
    const userId = getUserId(ctx);
    if (!userId) {
      await ctx.reply('❌ Не удалось определить ваш профиль.');
      return;
    }
    userManager.createUser(userId);
    await getName(ctx);
  });
});

bot.command('start', async (ctx) => {
  return measureTime('Start Command', async () => {
    const userId = getUserId(ctx);
    if (!userId) return;
    userManager.createUser(userId);
    await getName(ctx);
  });
});

// Команда /calculate - расчет калорий
bot.command('calculate', async (ctx) => {
  return measureTime('Calculate Command', async () => {
    await calculateCalories(ctx);
  });
});

// Команда /reset - сброс данных
bot.command('reset', async (ctx) => {
  return measureTime('Reset Command', async () => {
    await resetUserData(ctx);
  });
});

// Обработка сообщений
// Обработка сообщений
bot.on('message_created', async (ctx) => {
  return measureTime('Message Handler', async () => {
    try {
      const userId = getUserId(ctx);
      const text = ensureString(ctx.message?.body?.text?.trim());

      console.log(`📨 Received message from ${userId}: "${text}"`);

      if (!userId || !text) {
        console.log('❌ No user ID or text');
        return;
      }

      // 🔄 ОГРАНИЧЕНИЕ ЧАСТОТЫ ЗАПРОСОВ
      if (!canProcessRequest(userId)) {
        console.log(`⚠️ Rate limit exceeded for user ${userId}`);
        return;
      }

      const user = userManager.getUser(userId);

      if (!user) {
        console.log(`❌ User ${userId} not found`);
        userManager.createUser(userId);
        await getName(ctx);
        return;
      }

      // Обработка редактирования полей
      const editingField = userManager.getEditingField(userId);
      if (editingField && user) {
        switch (editingField) {
          case 'name':
            if (text.length > 0) {
              userManager.updateUserField(userId, 'name', text);
              userManager.clearEditingField(userId);
              await ctx.reply(`✅ Имя изменено на: ${text}`);
              await finishEditing(ctx);
            }
            return;

          case 'age':
            const age = Number(text);
            if (!isNaN(age) && age >= 1 && age <= 120) {
              userManager.updateUserField(userId, 'age', age);
              userManager.clearEditingField(userId);
              await ctx.reply(`✅ Возраст изменен на: ${age}`);
              await finishEditing(ctx);
            } else {
              await ctx.reply('❌ Введи корректный возраст (1–120):');
            }
            return;

          case 'height':
            const height = Number(text);
            if (!isNaN(height) && height >= 50 && height <= 250) {
              userManager.updateUserField(userId, 'height', height);
              userManager.clearEditingField(userId);
              await ctx.reply(`✅ Рост изменен на: ${height} см`);
              await finishEditing(ctx);
            } else {
              await ctx.reply('❌ Рост от 50 до 250 см:');
            }
            return;

          case 'weight':
            const weight = Number(text);
            if (!isNaN(weight) && weight >= 20 && weight <= 500) {
              userManager.updateUserField(userId, 'weight', weight);
              userManager.clearEditingField(userId);
              await ctx.reply(`✅ Вес изменен на: ${weight} кг`);
              await finishEditing(ctx);
            } else {
              await ctx.reply('❌ Вес от 20 до 500 кг:');
            }
            return;
        }
      }

      // 🔧 ИСПРАВЛЕНИЕ: Обработка ввода калорий для нового продукта
      // Проверяем, есть ли ожидающий ввод продукта
      const pendingFood = userManager.getPendingFood(userId);
      const pendingCalories = userManager.getPendingFoodCalories(userId);

      // Если есть ожидающий продукт и введено число - это калории
      if (pendingFood && !pendingCalories && !isNaN(Number(text)) && Number(text) > 0) {
        const caloriesPer100g = Number(text);
        userManager.setPendingFoodCalories(userId, caloriesPer100g);
        await ctx.reply(
          `✅ ${pendingFood} - ${caloriesPer100g} ккал/100г\n\n` +
          `Сколько грамм ты съел? (введи число)`
        );
        return;
      }

      // Если есть и продукт, и калории, но нет граммов - это граммы
      if (pendingFood && pendingCalories && !isNaN(Number(text)) && Number(text) > 0) {
        const grams = Number(text);
        const calculatedCalories = Math.round((pendingCalories * grams) / 100);
        userManager.addFoodEntry(userId, `${pendingFood} (${grams}г)`, calculatedCalories);

        const foodId = userManager.getPendingFoodId(userId);

        await ctx.reply(
          `✅ ПРОДУКТ ДОБАВЛЕН!\n\n` +
          `🍎 ${pendingFood}\n` +
          `⚖️ Порция: ${grams}г\n` +
          `🔥 Калории: ${calculatedCalories} ккал`
        );

        // 🔧 ИСПРАВЛЕНИЕ: Очищаем временные данные
        userManager.clearPendingFood(userId);
        userManager.clearPendingFoodCalories(userId);

        // 🔧 ИСПРАВЛЕНИЕ: Предлагаем добавить в избранное если есть foodId
        if (foodId) {
          // Продукт из базы данных - проверяем, не в избранных ли он уже
          if (!userManager.isFavorite(userId, foodId)) {
            await delay(500);
            await suggestAddToFavorites(ctx, pendingFood, foodId);
          } else {
            await delay(500);
            await showMainDiaryMenu(ctx);
          }
        } else {
          // Продукт введен вручную - добавляем в базу и проверяем
          userManager.addFoodToDatabase(pendingFood, pendingCalories);
          const searchResults = db.searchFood(pendingFood);
          if (searchResults.length > 0) {
            const newFood = searchResults[0];
            // Проверяем, не в избранных ли он уже
            if (!userManager.isFavorite(userId, newFood.id)) {
              await delay(500);
              await suggestAddToFavorites(ctx, pendingFood, newFood.id);
            } else {
              await delay(500);
              await showMainDiaryMenu(ctx);
            }
          } else {
            await delay(500);
            await showMainDiaryMenu(ctx);
          }
        }

        userManager.clearPendingFoodId(userId);
        return;
      }

      // Обработка выбора продукта по номеру из списка
      if (user && user.daily_calories) {
        const number = parseInt(text);
        if (!isNaN(number) && number > 0) {
          const lastSearchResults = userManager.getLastSearchResults(userId);
          if (lastSearchResults && number <= lastSearchResults.length) {
            const selectedFood = lastSearchResults[number - 1];
            userManager.setPendingFood(userId, selectedFood.name);
            userManager.setPendingFoodCalories(userId, selectedFood.calories_per_100g);
            userManager.setPendingFoodId(userId, selectedFood.id); // 🔧 Сохраняем ID продукта
            await ctx.reply(
              `🍎 Выбран: ${selectedFood.name}\n` +
              `📊 Калорийность: ${selectedFood.calories_per_100g} ккал/100г\n\n` +
              `Сколько грамм ты съел? (введи число)`
            );
            return;
          }
        }

        if (text.toLowerCase() === 'новый' || text.toLowerCase() === 'новый продукт') {
          userManager.clearLastSearchResults(userId);
          await ctx.reply(
            'Введи продукт и калории в формате:\n' +
            '• "продукт - калории" (яблоко - 52)\n' +
            '• или "продукт - калории - граммы" (яблоко - 52 - 150)'
          );
          return;
        }

        // Обработка ввода пищи
        if (text.includes('-')) {
          const parts = text.split('-').map(part => part.trim());

          if (parts.length === 3) {
            const food = parts[0];
            const caloriesPer100g = parseInt(parts[1]);
            const grams = parseInt(parts[2]);

            if (!isNaN(caloriesPer100g) && !isNaN(grams) && caloriesPer100g > 0 && grams > 0) {
              const calculatedCalories = Math.round((caloriesPer100g * grams) / 100);
              userManager.addFoodEntry(userId, `${food} (${grams}г)`, calculatedCalories);

              // 🔧 ИСПРАВЛЕНИЕ: Добавляем в базу и предлагаем добавить в избранное
              userManager.addFoodToDatabase(food, caloriesPer100g);

              // Ищем продукт в базе, чтобы получить его ID
              const searchResults = db.searchFood(food);

              await ctx.reply(
                `✅ ПРОДУКТ ДОБАВЛЕН!\n\n` +
                `🍎 ${food}\n` +
                `⚖️ Порция: ${grams}г\n` +
                `🔥 Калории: ${calculatedCalories} ккал`
              );

              if (searchResults.length > 0) {
                const foodItem = searchResults[0];
                // 🔧 ИСПРАВЛЕНИЕ: Проверяем, не в избранных ли уже
                if (!userManager.isFavorite(userId, foodItem.id)) {
                  await delay(500);
                  await suggestAddToFavorites(ctx, food, foodItem.id);
                } else {
                  await delay(500);
                  await showMainDiaryMenu(ctx);
                }
              } else {
                await delay(500);
                await showMainDiaryMenu(ctx);
              }
              return;
            }
          }

          if (parts.length === 2) {
            const food = parts[0];
            const calories = parseInt(parts[1]);

            if (!isNaN(calories) && calories > 0) {
              userManager.addFoodEntry(userId, `${food} (100г)`, calories);

              // 🔧 ИСПРАВЛЕНИЕ: Добавляем в базу и предлагаем добавить в избранное
              userManager.addFoodToDatabase(food, calories);

              // Ищем продукт в базе чтобы получить его ID
              const searchResults = db.searchFood(food);

              await ctx.reply(
                `✅ ПРОДУКТ ДОБАВЛЕН!\n\n` +
                `🍎 ${food}\n` +
                `⚖️ Порция: 100г\n` +
                `🔥 Калории: ${calories} ккал`
              );

              if (searchResults.length > 0) {
                const foodItem = searchResults[0];
                await delay(500);
                await suggestAddToFavorites(ctx, food, foodItem.id);
              } else {
                await delay(500);
                await showMainDiaryMenu(ctx);
              }
              return;
            }
          }
        }

        // Поиск продукта в базе
        const searchResults = db.searchFood(text);
        if (searchResults.length > 0) {
          userManager.setLastSearchResults(userId, searchResults);

          let message = '🔍 НАЙДЕННЫЕ ПРОДУКТЫ:\n\n';
          searchResults.forEach((food, index) => {
            message += `${index + 1}. ${food.name} - ${food.calories_per_100g} ккал/100г\n`;
          });
          message += '\nНапиши номер продукта для добавления или "новый" для ручного ввода';

          await ctx.reply(message);
          return;
        }

        // Если продукт не найден и это не число
        if (text.length > 2 && isNaN(Number(text))) {
          userManager.setPendingFood(userId, text);
          await ctx.reply(
            `Продукт "${text}" не найден в базе.\n\n` +
            'Сколько калорий в 100г этого продукта? (ответь числом)'
          );
          return;
        }
      }

      // Обычная обработка сообщений для регистрации
      await handleMessage(ctx);

    } catch (error) {
      console.error('❌ ERROR in message handler:', error);
    }
  });
});
// Обработка нажатий на кнопки
// Обработка нажатий на кнопки
bot.on('message_callback', async (ctx) => {
  return measureTime('Callback Handler', async () => {
    const userId = getUserId(ctx);
    const data = ensureString(ctx.callback?.payload);

    if (!userId) {
      await ctx.reply('❌ Не удалось определить ваш профиль.');
      return;
    }

    // 🔄 ОГРАНИЧЕНИЕ ЧАСТОТЫ ЗАПРОСОВ
    if (!canProcessRequest(userId)) {
      console.log(`⚠️ Rate limit exceeded for user ${userId}`);
      try {
        // 🔧 ИСПРАВЛЕНИЕ: Используем безопасный ответ
        await safeAnswerCallback(ctx);
        // Отправляем сообщение обычным способом вместо text в answerOnCallback
        await ctx.reply('⏳ Слишком быстро! Подождите...');
      } catch (error) {
        // Игнорируем ошибки
      }
      return;
    }

    // 🔒 ЗАЩИТА ОТ МНОЖЕСТВЕННЫХ НАЖАТИЙ
    if (isProcessing(userId, data)) {
      console.log(`⚠️ Callback ${data} already processing for user ${userId}`);
      try {
        // 🔧 ИСПРАВЛЕНИЕ: Используем безопасный ответ
        await safeAnswerCallback(ctx);
        // Отправляем сообщение обычным способом вместо text в answerOnCallback
        await ctx.reply('⏳ Уже обрабатываю...');
      } catch (error) {
        // Игнорируем ошибки ответа
      }
      return;
    }

    try {
      startProcessing(userId, data);

      // 🔒 Попробуем ответить на callback
      // 🔧 ИСПРАВЛЕНИЕ: Используем безопасный ответ
      await safeAnswerCallback(ctx);

      console.log('callback - userId:', userId, 'payload:', data);

      // 🔧 ИСПРАВЛЕНИЕ: Безопасная обработка данных
      if (!data) {
        console.log('❌ No callback data');
        return;
      }

      // Обработка начала регистрации
      if (data === 'start_registration') {
        await askGender(ctx);
        return;
      }

      // 🔧 ИСПРАВЛЕНИЕ: Безопасный парсинг данных
      if (data.startsWith('gender:')) {
        const parts = data.split(':');
        if (parts.length >= 2) {
          const gender = parts[1];
          if (gender === 'male' || gender === 'female') {
            const editingField = userManager.getEditingField(userId);
            if (editingField === 'gender') {
              userManager.updateUserField(userId, 'gender', gender);
              userManager.clearEditingField(userId);
              await ctx.reply(`✅ Пол изменен на: ${gender === 'male' ? 'Мужской' : 'Женский'}`);
              await finishEditing(ctx);
            } else {
              userManager.setGender(userId, gender);
              await ctx.reply('Отлично! Теперь укажи свой возраст (полных лет):');
            }
          }
        }
        return;
      }

      // 🔧 ИСПРАВЛЕНИЕ: Безопасный парсинг для активности
      if (data.startsWith('activity:')) {
        const parts = data.split(':');
        if (parts.length >= 2) {
          const activityLevel = parseFloat(parts[1]);
          if (!isNaN(activityLevel)) {
            const editingField = userManager.getEditingField(userId);
            if (editingField === 'activity') {
              userManager.updateUserField(userId, 'activity', activityLevel);
              userManager.clearEditingField(userId);
              await ctx.reply('✅ Уровень активности изменен!');
              await finishEditing(ctx);
            } else {
              userManager.setActivity(userId, activityLevel);
              const summary = userManager.getUserSummary(userId);
              if (summary) {
                await ctx.reply('✅ Уровень активности сохранён!');
                await ctx.reply(summary, {
                  attachments: keyboard_confirmation_with_edit
                });
              }
            }
          }
        }
        return;
      }

      // 🔧 ИСПРАВЛЕНИЕ: Безопасный парсинг для подтверждения
      if (data.startsWith('confirmation:')) {
        const parts = data.split(':');
        if (parts.length >= 2) {
          const answer = parts[1];
          if (answer === 'yes') {
            userManager.confirmData(userId);
            await ctx.reply('✅ Отлично! Данные сохранены.\n\nИспользуй команду /calculate для расчета калорий.');
          }
          if (answer === 'edit') {
            await showEditMenu(ctx);
          }
        }
        return;
      }

      // 🔧 ИСПРАВЛЕНИЕ: Безопасный парсинг для действий
      if (data.startsWith('action:')) {
        const parts = data.split(':');
        if (parts.length >= 2) {
          const action = parts[1];
          if (action === 'delete') {
            await resetUserData(ctx);
          }
          if (action === 'edit') {
            await showEditMenu(ctx);
          }
          if (action === 'start_tracking') {
            await startFoodTracking(ctx);
          }
        }
        return;
      }

      // 🔧 ИСПРАВЛЕНИЕ: Безопасный парсинг для редактирования
      if (data.startsWith('edit:')) {
        const parts = data.split(':');
        if (parts.length >= 2) {
          const field = parts[1];
          await handleFieldEdit(ctx, field);
        }
        return;
      }

      // 🔧 ИСПРАВЛЕНИЕ: Безопасный парсинг для цели
      if (data.startsWith('goal:')) {
        const parts = data.split(':');
        if (parts.length >= 2) {
          const goal = parts[1] as 'maintain' | 'loss' | 'gain';
          const calories = userManager.calculateAllCalories(userId);
          if (calories) {
            const dailyCalories = calories[goal];
            userManager.setGoal(userId, goal, dailyCalories);
            await finishTrackingSetup(ctx, goal, dailyCalories);
          }
        }
        return;
      }

      // 🔧 ИСПРАВЛЕНИЕ: Безопасный парсинг для напоминаний
      if (data.startsWith('reminder:')) {
        const parts = data.split(':');
        if (parts.length >= 2) {
          const choice = parts[1];
          if (choice === 'enable') {
            await safeReply(ctx, 'Выбери удобное время для напоминаний:', keyboard_reminder_times);
          } else if (choice === 'disable') {
            db.setReminderSettings(userId, false);
            await ctx.reply('❌ Напоминания отключены');
            await delay(500);
            await showMainDiaryMenu(ctx);
          } else if (choice === 'off') {
            db.setReminderSettings(userId, false);
            await ctx.reply('❌ Напоминания отключены');
            await delay(500);
            await showMainDiaryMenu(ctx);
          } else {
            // Выбор времени
            db.setReminderSettings(userId, true, choice);
            await ctx.reply(`✅ Напоминания установлены на ${choice} 🕐`);
            await delay(500);
            await showMainDiaryMenu(ctx);
          }
        }
        return;
      }

      // 🔧 ИСПРАВЛЕНИЕ: Безопасный парсинг для дневника
      if (data.startsWith('diary:')) {
        const parts = data.split(':');
        if (parts.length >= 2) {
          const action = parts[1];
          if (action === 'today_summary') {
            await showTodaySummary(ctx);
          }
          if (action === 'change_goal') {
            await startFoodTracking(ctx);
          }
          if (action === 'add_food') {
            await startFoodInput(ctx);
          }
          if (action === 'reminders') {
            await setupReminders(ctx);
          }
        }
        return;
      }

      // 🔧 ИСПРАВЛЕНИЕ: Безопасный парсинг для пищи
      if (data.startsWith('food:')) {
        const parts = data.split(':');
        if (parts.length >= 2) {
          const action = parts[1];
          if (action === 'manual_input') {
            await ctx.reply(
              '🍎 Введи продукт и калории в формате:\n\n' +
              '• "продукт - калории" (яблоко - 52) - для 100г\n' +
              '• "продукт - калории - граммы" (яблоко - 52 - 150) - для указанной порции\n\n' +
              'Или просто введи название продукта для поиска в базе 📋'
            );
          }
          if (action === 'favorites') {
            await showFavorites(ctx);
          }
        }
        return;
      }

      // 🔧 ИСПРАВЛЕНИЕ: Безопасный парсинг для избранного
      if (data.startsWith('add_favorite:')) {
        const parts = data.split(':');
        if (parts.length >= 2) {
          const foodId = parseInt(parts[1]);
          if (!isNaN(foodId)) {
            userManager.addToFavorites(userId, foodId);
            await ctx.reply('✅ Продукт добавлен в любимые! ⭐');
            await delay(500);
            await showMainDiaryMenu(ctx);
          }
        }
        return;
      }

      // 🔧 ИСПРАВЛЕНИЕ: Безопасный парсинг для пищи из избранного
      if (data.startsWith('add_favorite_food:')) {
        const parts = data.split(':');
        if (parts.length >= 2) {
          const foodId = parseInt(parts[1]);
          if (!isNaN(foodId)) {
            const food = db.getFoodById(foodId);
            if (food) {
              userManager.setPendingFood(userId, food.name);
              userManager.setPendingFoodCalories(userId, food.calories_per_100g);
              userManager.setPendingFoodId(userId, food.id);
              await ctx.reply(
                `🍎 Выбран: ${food.name}\n` +
                `📊 Калорийность: ${food.calories_per_100g} ккал/100г\n\n` +
                `Сколько грамм ты съел? (введи число)`
              );
            }
          }
        }
        return;
      }

      // 🔧 ИСПРАВЛЕНИЕ: Безопасный парсинг для добавления пищи
      if (data.startsWith('add_food:')) {
        const parts = data.split(':');
        if (parts.length >= 2) {
          const foodId = parseInt(parts[1]);
          if (!isNaN(foodId)) {
            const food = db.getFoodById(foodId);
            if (food) {
              userManager.addFoodEntry(userId, `${food.name} (100г)`, food.calories_per_100g);
              await ctx.reply(
                `✅ ПРОДУКТ ДОБАВЛЕН!\n\n` +
                `🍎 ${food.name}\n` +
                `⚖️ Порция: 100г\n` +
                `🔥 Калории: ${food.calories_per_100g} ккал`
              );
              await delay(500);
              await showMainDiaryMenu(ctx);
            }
          }
        }
        return;
      }

      // 🔧 ИСПРАВЛЕНИЕ: Безопасный парсинг для продолжения
      if (data.startsWith('continue:')) {
        await showMainDiaryMenu(ctx);
        return;
      }

    } catch (error) {
      console.error('❌ ERROR in callback handler:', error);
      try {
        await ctx.reply('❌ Произошла ошибка. Попробуйте еще раз.');
      } catch (e) {
        console.error('Failed to send error message:', e);
      }
    } finally {
      // 🔒 Снимаем блокировку
      endProcessing(userId, data);
    }
  });
});
bot.start();