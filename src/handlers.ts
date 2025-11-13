import { userManager } from './UserManager';
import { getUserId } from './common';
import { keyboard_start, keyboard_gender, keyboard_activity, keyboard_confirmation, keyboard_actions, keyboard_goal, keyboard_diary } from './keyboards';

// Определение имени пользователя
export async function getName(ctx: any) {
  const userId = getUserId(ctx);
  if (!userId) {
    await ctx.reply('❌ Не удалось определить твой профиль.');
    return;
  }
  const firstName = ctx.user?.first_name;
  const username = ctx.user?.username;
  const displayName = firstName || username;
  if (firstName || username) {
    userManager.setUserName(userId, displayName);
    await sendWelcomeMessage(ctx, displayName);
  } else {
    await ctx.reply('Чтобы начать, пожалуйста, напиши, как тебя зовут:');
  }
}

// Приветствие
export async function sendWelcomeMessage(ctx: any, name: string) {
  await ctx.reply(
    `Здравствуй, ${name}! 👋\n\n` +
    `Я — твой помощник по подсчёту калорий и здоровому питанию.\n\n` +
    `Сначала я помогу тебе рассчитать суточную норму калорий — для этого мне нужно узнать, некоторую информацию о тебе, а именно: \n\n` +
    ` - пол\n` +
    ` - возраст\n` +
    ` - рост\n` +
    ` - активность\n\n` +
    `А затем, ты сможешь отслеживать свое питание благодаря ведению дневника\n\n` +
    `В моем функционале есть следующие команды (можешь прописывать их вручную или использовать кнопки в сообщениях):\n\n` +
    `/start - начать общение\n` +
    `/calculate - рассчитать калории\n` +
    `/reset - удалить все данные\n\n` +
    `Готов(а) начать?`,
    {attachments: [keyboard_start]}
  );
}

// Обработка текстовых сообщений (ввод имени)
export async function handleMessage(ctx: any) {
  const userId = getUserId(ctx);
  const text = ctx.message?.body?.text?.trim();

  console.log('handleMessage - userId:', userId, 'text:', text);

  if (!userId || !text) {
    console.log('No userId or text');
    return;
  }

  const user = userManager.getUser(userId);
  console.log('handleMessage - user:', user);

  if (!user) {
    console.log('User not found');
    return;
  }

  // Если пользователь уже отслеживает питание и это не шаг регистрации - игнорируем
  if (user.dailyCalories && user.step === 'done') {
    console.log('User is tracking food, ignoring registration message');
    return;
  }

  console.log('Current step:', user.step);

  // Шаг: имя
  if (user.step === 'name') {
    console.log('Processing name step');
    userManager.setUserName(userId, text);
    await sendWelcomeMessage(ctx, text);
    return;
  }

  if (user.step === 'gender') {
    console.log('User at gender step, ignoring text message');
    return;
  }

  // Шаг: возраст
  if (user.step === 'age') {
    console.log('Processing age step');
    const age = Number(text);
    if (!isNaN(age) && age >= 1 && age <= 120) {
      userManager.setAge(userId, age);
      await ctx.reply('✅ Возраст сохранён!\nТеперь укажи рост (в см):');
    } else {
      await ctx.reply('❌ Введи корректный возраст (1–120):');
    }
    return;
  }

  // Шаг: рост
  if (user.step === 'height') {
    console.log('Processing height step');
    const height = Number(text);
    if (!isNaN(height) && height >= 50 && height <= 250) {
      userManager.setHeight(userId, height);
      await ctx.reply('✅ Рост сохранён!\nТеперь укажи вес (в кг):');
    } else {
      await ctx.reply('❌ Рост от 50 до 250 см:');
    }
    return;
  }

  // Шаг: вес
  if (user.step === 'weight') {
    console.log('Processing weight step');
    const weight = Number(text);
    if (!isNaN(weight) && weight >= 20 && weight <= 500) {
      userManager.setWeight(userId, weight);
      await ctx.reply('✅ Вес сохранён!\nТеперь выбери уровень физической активности:',
        {attachments: [keyboard_activity]});
    } else {
      await ctx.reply('❌ Вес от 20 до 500 кг:');
    }
    return;
  }

  // Шаг: подтверждение - игнорируем текстовые сообщения, ждем только кнопки
  if (user.step === 'confirmation') {
    console.log('User at confirmation step, ignoring text - waiting for buttons');
    await ctx.reply('Пожалуйста, используй кнопки "Да" или "Нет" для подтверждения данных');
    return;
  }

  console.log('No matching step found');
}

// Отправляет сообщение с кнопками для выбора пола
export async function askGender(ctx: any) {
  await ctx.reply('Укажи свой пол:', { attachments: [keyboard_gender] });
}

// Редактирование данных
export async function startDataEditing(ctx: any) {
  const userId = getUserId(ctx);
  if (!userId) {
    await ctx.reply('❌ Не удалось определить твой профиль.');
    return;
  }
  // Если пользователь не существует, создаем его
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
    await ctx.reply(result, {
      attachments: [keyboard_actions]
    });
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

  await ctx.reply(
    `📊 Давай выберем твою цель:\n\n` +
    `• 💪 Поддержание веса: ${calories.maintain} ккал/день\n` +
    `• 🏃 Похудение: ${calories.loss} ккал/день\n` +
    `• 📈 Набор массы: ${calories.gain} ккал/день\n\n` +
    `Выбери цель:`,
    { attachments: [keyboard_goal] }
  );
}

// Показать сегодняшнюю сводку
export async function showTodaySummary(ctx: any) {
  const userId = getUserId(ctx);
  if (!userId) {
    await ctx.reply('❌ Не удалось определить твой профиль.');
    return;
  }

  const user = userManager.getUser(userId);
  if (!user || !user.dailyCalories) {
    await ctx.reply('❌ Сначала начни отслеживание питания.');
    return;
  }

  const todayCalories = userManager.getTodayCalories(userId);
  const message = userManager.getMotivationalMessage(userId);

  await ctx.reply(
    `📊 СЕГОДНЯШНЯЯ СВОДКА\n\n` +
    `• Цель: ${user.dailyCalories} ккал\n` +
    `• Съедено: ${todayCalories} ккал\n` +
    `• Осталось: ${user.dailyCalories - todayCalories} ккал\n\n` +
    `${message}`,
    { attachments: [keyboard_diary] }
  );
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

// Начать ввод пищи
export async function startFoodInput(ctx: any) {
  await ctx.reply(
    'Введи прием пищи в формате: "продукт - количество калорий"\n\n' +
    'Примеры:\n' +
    '• овсянка - 150\n' +
    '• куриная грудка - 200\n' +
    '• яблоко - 80\n\n'
  );
}