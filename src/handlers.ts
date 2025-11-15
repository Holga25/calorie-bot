import { userManager } from './userManager.ts';
import { getUserId, safeReply, delay } from './common.ts';
import { db } from './database.ts'
import {
  keyboard_start, keyboard_gender, keyboard_activity, keyboard_actions,
  keyboard_goal, keyboard_diary, keyboard_food_input, keyboard_reminder_times,
  keyboard_edit_choice, keyboard_confirmation_with_edit, keyboard_add_to_favorites,
  keyboard_reminder_choice
} from './keyboards.ts';

// Определение имени пользователя
export async function getName(ctx: any) {
  const userId = getUserId(ctx);
  if (!userId) {
    await ctx.reply('❌ Не удалось определить ваш профиль.');
    return;
  }

  let user = userManager.getUser(userId);
  if (!user) {
    userManager.createUser(userId);
    user = userManager.getUser(userId);
  }

  const firstName = ctx.user?.first_name;
  const username = ctx.user?.username;
  const displayName = firstName || username;

  if (firstName || username) {
    userManager.setUserName(userId, displayName);
    await sendWelcomeMessage(ctx, displayName);
  } else {
    await ctx.reply('Чтобы начать, пожалуйста, напишите, как вас зовут:');
  }
}

// Обработка текстовых сообщений (ввод имени)
export async function handleMessage(ctx: any) {
  try {
    const userId = getUserId(ctx);
    const text = ctx.message?.body?.text?.trim();

    if (!userId || !text) {
      return;
    }

    const user = userManager.getUser(userId);

    if (!user) {
      return;
    }

    // Если пользователь уже отслеживает питание и это не шаг регистрации - игнорируем
    if (user.daily_calories && user.step === 'done') {
      return;
    }

    // Шаг: имя
    if (user.step === 'name') {
      userManager.setUserName(userId, text);
      await sendWelcomeMessage(ctx, text);
      return;
    }

    if (user.step === 'gender') {
      return;
    }

    // Шаг: возраст
    if (user.step === 'age') {
      const age = Number(text);
      if (!isNaN(age) && age >= 1 && age <= 120) {
        userManager.setAge(userId, age);
        await ctx.reply('✅ Возраст сохранён!\n\nТеперь укажи рост (в см):');
      } else {
        await ctx.reply('❌ Введи корректный возраст (1–120):');
      }
      return;
    }

    // Шаг: рост
    if (user.step === 'height') {
      const height = Number(text);
      if (!isNaN(height) && height >= 50 && height <= 250) {
        userManager.setHeight(userId, height);
        await ctx.reply('✅ Рост сохранён!\n\nТеперь укажи вес (в кг):');
      } else {
        await ctx.reply('❌ Рост от 50 до 250 см:');
      }
      return;
    }

    // Шаг: вес
    if (user.step === 'weight') {
      const weight = Number(text);
      if (!isNaN(weight) && weight >= 20 && weight <= 500) {
        userManager.setWeight(userId, weight);
        await safeReply(ctx, '✅ Вес сохранён!\n\nТеперь выбери уровень физической активности:', keyboard_activity);
      } else {
        await ctx.reply('❌ Вес от 20 до 500 кг:');
      }
      return;
    }

    // Шаг: подтверждение - игнорируем текстовые сообщения, ждем только кнопки
    if (user.step === 'confirmation') {
      return;
    }

  } catch (error) {
    console.error('❌ ERROR in handleMessage:', error);
  }
}

// Отправляет сообщение с кнопками для выбора пола
export async function askGender(ctx: any) {
  await safeReply(ctx, 'Укажи свой пол:', keyboard_gender);
}

// Редактирование данных
export async function startDataEditing(ctx: any) {
  const userId = getUserId(ctx);
  if (!userId) {
    await ctx.reply('❌ Не удалось определить твой профиль.');
    return;
  }
  if (!userManager.getUser(userId)) {
    userManager.createUser(userId);
  }
  userManager.startCalculation(userId);
  await ctx.reply('📝 Редактирую данные!');
  await askGender(ctx);
}

// Расчет калорий
export async function calculateCalories(ctx: any) {
  const userId = getUserId(ctx);
  if (!userId) {
    await ctx.reply('❌ Не удалось определить твой профиль.');
    return;
  }

  const user = userManager.getUser(userId);
  if (!user || user.step !== 'done') {
    await ctx.reply('❌ Сначала заполни все данные.');
    await askGender(ctx);
    return;
  }

  const result = userManager.calculateCalories(userId);
  if (result) {
    await safeReply(ctx, result, keyboard_actions);
  } else {
    await ctx.reply('❌ Не удалось рассчитать калории. Проверь введенные данные.');
  }
}

// Начать отслеживание питания
export async function startFoodTracking(ctx: any) {
  const userId = getUserId(ctx);
  if (!userId) {
    await ctx.reply('❌ Не удалось определить твой профиль.');
    return;
  }

  const calories = userManager.calculateAllCalories(userId);
  if (!calories) {
    await ctx.reply('❌ Сначала заполни данные для расчета.');
    return;
  }

  const message =
    `🎯 ДАВАЙ ВЫБЕРЕМ ТВОЮ ЦЕЛЬ\n\n` +
    `Расчет по формуле Миффлина-Сан Жеора:\n\n` +
    `• 💪 Поддержание веса: ${calories.maintain} ккал/день\n` +
    `• 🏃 Похудение: ${calories.loss} ккал/день\n` +
    `• 📈 Набор массы: ${calories.gain} ккал/день\n\n` +
    `Какую цель выбираешь?`;

  await safeReply(ctx, message, keyboard_goal);
}

// Показать сегодняшнюю сводку
export async function showTodaySummary(ctx: any) {
  const userId = getUserId(ctx);
  if (!userId) {
    await ctx.reply('❌ Не удалось определить твой профиль.');
    return;
  }

  const user = userManager.getUser(userId);
  if (!user || !user.daily_calories) {
    await ctx.reply('❌ Сначала начни отслеживание питания.');
    return;
  }

  const todayCalories = userManager.getTodayCalories(userId);
  const messageText = userManager.getMotivationalMessage(userId);

  const message =
    `📊 СЕГОДНЯШНЯЯ СВОДКА\n\n` +
    `🎯 Цель: ${user.daily_calories} ккал\n` +
    `🍽️ Съедено: ${todayCalories} ккал\n` +
    `📈 Осталось: ${Math.max(0, user.daily_calories - todayCalories)} ккал\n\n` +
    `${messageText}`;

  await safeReply(ctx, message, keyboard_diary);
}

// Команда /reset - сброс данных
export async function resetUserData(ctx: any) {
  const userId = getUserId(ctx);
  if (!userId) {
    await ctx.reply('❌ Не удалось определить твой профиль.');
    return;
  }

  userManager.resetUser(userId);
  await ctx.reply('🔄 Все данные сброшены. Начнем заново!');
  await getName(ctx);
}

// Начать добавление пищи
export async function startFoodInput(ctx: any) {
  await safeReply(ctx, 'Как хочешь добавить прием пищи?', keyboard_food_input);
}

// Обработка ручного ввода пищи
export async function handleManualFoodInput(ctx: any) {
  const userId = getUserId(ctx);
  if (!userId) return;

  await ctx.reply(
    '🍎 Введи продукт и калории в формате:\n\n' +
    '• "продукт - калории" (яблоко - 52) - для 100г\n' +
    '• "продукт - калории - граммы" (яблоко - 52 - 150) - для указанной порции\n\n' +
    'Или просто введи название продукта для поиска в базе 📋'
  );
}

// Показать любимые продукты
export async function showFavorites(ctx: any) {
  const userId = getUserId(ctx);
  if (!userId) return;

  const favorites = db.getUserFavorites(userId);

  if (favorites.length > 0) {
    const { Keyboard } = await import('@maxhub/max-bot-api');
    const keyboard = [
      Keyboard.inlineKeyboard(
        favorites.map(food => [
          Keyboard.button.callback(
            `${food.name} - ${food.calories_per_100g} ккал/100г`,
            `add_favorite_food:${food.id}`
          )
        ])
      )
    ];

    await safeReply(ctx, '⭐ ТВОИ ЛЮБИМЫЕ ПРОДУКТЫ:', keyboard);
  } else {
    await ctx.reply('У тебя пока нет любимых продуктов. Добавь их через поиск! 🔍');
  }
}

// Настройка напоминаний
export async function setupReminders(ctx: any) {
  const userId = getUserId(ctx);
  if (!userId) return;

  const currentSettings = db.getReminderSettings(userId);

  const message =
    `⏰ НАСТРОЙКА НАПОМИНАНИЙ\n\n` +
    `Текущие настройки:\n` +
    `• Статус: ${currentSettings.enabled ? '✅ Включены' : '❌ Выключены'}\n` +
    `• Время: ${currentSettings.time}\n\n` +
    `Хочешь изменить настройки напоминаний?`;

  await safeReply(ctx, message, keyboard_reminder_choice);
}

// Показать меню редактирования
export async function showEditMenu(ctx: any) {
  const userId = getUserId(ctx);
  if (!userId) {
    await ctx.reply('❌ Не удалось определить твой профиль.');
    return;
  }

  const user = userManager.getUser(userId);
  if (!user) {
    await ctx.reply('❌ Пользователь не найден.');
    return;
  }

  const currentData = userManager.getUserSummary(userId);
  if (currentData) {
    await safeReply(ctx,
      `${currentData}\n\nЧто конкретно хочешь изменить?`,
      keyboard_edit_choice
    );
  }
}

// Обработка редактирования конкретного поля
export async function handleFieldEdit(ctx: any, field: string) {
  const userId = getUserId(ctx);
  if (!userId) return;

  switch (field) {
    case 'name':
      await ctx.reply('Введи новое имя:');
      userManager.setEditingField(userId, 'name');
      break;
    case 'gender':
      await safeReply(ctx, 'Выбери новый пол:', keyboard_gender);
      userManager.setEditingField(userId, 'gender');
      break;
    case 'age':
      await ctx.reply('Введи новый возраст:');
      userManager.setEditingField(userId, 'age');
      break;
    case 'height':
      await ctx.reply('Введи новый рост (в см):');
      userManager.setEditingField(userId, 'height');
      break;
    case 'weight':
      await ctx.reply('Введи новый вес (в кг):');
      userManager.setEditingField(userId, 'weight');
      break;
    case 'activity':
      await safeReply(ctx, 'Выбери новый уровень активности:', keyboard_activity);
      userManager.setEditingField(userId, 'activity');
      break;
    case 'all':
      await startDataEditing(ctx);
      break;
  }
}

// Завершение редактирования и показ обновленных данных
export async function finishEditing(ctx: any) {
  const userId = getUserId(ctx);
  if (!userId) return;

  const user = userManager.getUser(userId);
  if (!user) return;

  const updatedSummary = userManager.getUserSummary(userId);
  if (updatedSummary) {
    await safeReply(ctx,
      `✅ ДАННЫЕ ОБНОВЛЕНЫ!\n\n${updatedSummary}`,
      keyboard_confirmation_with_edit  // Используем новую клавиатуру
    );
  }
}

// В функции handleMessage обновим приветственное сообщение:
export async function sendWelcomeMessage(ctx: any, name: string) {
  const welcomeText =
    `Привет, ${name}! 👋\n\n` +
    `Я — твой умный помощник по подсчёту калорий и здоровому питанию 🍎\n\n` +
    `Сначала я помогу тебе рассчитать суточную норму калорий. Для этого мне нужно узнать немного информации о тебе:\n\n` +
    `• 👫 Пол\n` +
    `• 🎂 Возраст\n` +
    `• 📏 Рост\n` +
    `• ⚖️ Вес\n` +
    `• 🏃 Уровень активности\n\n` +
    `А затем ты сможешь вести дневник питания и отслеживать прогресс! 📊\n\n` +
    `Готов(а) начать?`;

  await safeReply(ctx, welcomeText, keyboard_start);
}

// Завершение настройки отслеживания
export async function finishTrackingSetup(ctx: any, goal: string, dailyCalories: number) {
  const userId = getUserId(ctx);
  if (!userId) return;

  const goalText = goal === 'maintain' ? 'поддержание веса' :
    goal === 'loss' ? 'похудение' : 'набор массы';

  // Показываем итоговую информацию
  await ctx.reply(
    `🎉 ОТЛИЧНО! НАСТРОЙКА ЗАВЕРШЕНА\n\n` +
    `📋 Твои настройки:\n` +
    `• Цель: ${goalText}\n` +
    `• Суточная норма: ${dailyCalories} ккал\n\n` +
    `Теперь ты можешь начать отслеживать питание! 🍽️`
  );

  await delay(1000);

  // Предлагаем напоминания
  await safeReply(ctx,
    `⏰ ХОЧЕШЬ ВКЛЮЧИТЬ НАПОМИНАНИЯ?\n\n` +
    `Я могу напоминать тебе о заполнении дневника питания в удобное время.`,
    keyboard_reminder_choice
  );
}

// Показать главное меню дневника
export async function showMainDiaryMenu(ctx: any) {
  const userId = getUserId(ctx);
  if (!userId) return;

  const user = userManager.getUser(userId);
  if (!user || !user.daily_calories) return;

  const todayCalories = userManager.getTodayCalories(userId);
  const remaining = Math.max(0, user.daily_calories - todayCalories);

  const message =
    `📊 ТВОЙ ДНЕВНИК ПИТАНИЯ\n\n` +
    `🎯 Цель: ${user.daily_calories} ккал/день\n` +
    `🍽️ Сегодня: ${todayCalories} ккал\n` +
    `📈 Осталось: ${remaining} ккал\n\n` +
    `Что хочешь сделать?`;

  await safeReply(ctx, message, keyboard_diary);
}

// Предложить добавить в избранное после добавления продукта
export async function suggestAddToFavorites(ctx: any, foodName: string, foodId: number) {
  await safeReply(ctx,
    `✅ "${foodName}" успешно добавлен в дневник!\n\n` +
    `Хочешь добавить этот продукт в избранное для быстрого доступа? ⭐`,
    keyboard_add_to_favorites(foodName, foodId)
  );
}