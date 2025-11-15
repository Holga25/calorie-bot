import { Keyboard } from '@maxhub/max-bot-api';

// Клавиатура для старта
export const keyboard_start = [
  Keyboard.inlineKeyboard([
    [Keyboard.button.callback('Да!', 'start_registration')]
  ])
];

// Клавиатура для выбора пола
export const keyboard_gender = [
  Keyboard.inlineKeyboard([
    [Keyboard.button.callback('👨 Мужской', 'gender:male')],
    [Keyboard.button.callback('👩 Женский', 'gender:female')],
  ])
];

// Клавиатура для выбора активности
export const keyboard_activity = [
  Keyboard.inlineKeyboard([
    [Keyboard.button.callback('💺 Минимальная(сидячий образ жизни)', 'activity:1.2')],
    [Keyboard.button.callback('🚶 Низкая(тренировки 1-3 раза в неделю)', 'activity:1.375')],
    [Keyboard.button.callback('🏃 Средняя(тренировки 3-5 раз в неделю)', 'activity:1.55')],
    [Keyboard.button.callback('🚴 Высокая(тренировки 6-7 раз в неделю)', 'activity:1.725')],
    [Keyboard.button.callback('🏋️ Экстра-высокая(проф. спортсмены)', 'activity:1.9')],
  ])
];

// Клавиатура для подтверждения данных
export const keyboard_confirmation_with_edit = [
  Keyboard.inlineKeyboard([
    [Keyboard.button.callback('✅ Да, все верно', 'confirmation:yes')],
    [Keyboard.button.callback('❌ Нет, изменить данные', 'confirmation:edit')]
  ])
];

// Клавиатура для действий после расчета калорий
export const keyboard_actions = [
  Keyboard.inlineKeyboard([
    [Keyboard.button.callback('🗑️ Удалить мои данные', 'action:delete')],
    [Keyboard.button.callback('📝 Изменить данные', 'action:edit')],
    [Keyboard.button.callback('📊 Начать следить за питанием', 'action:start_tracking')]
  ])
];

// Клавиатура для выбора цели
export const keyboard_goal = [
  Keyboard.inlineKeyboard([
    [Keyboard.button.callback('💪 Поддерживать вес', 'goal:maintain')],
    [Keyboard.button.callback('🏃 Похудеть', 'goal:loss')],
    [Keyboard.button.callback('📈 Набрать массу', 'goal:gain')]
  ])
];

// Клавиатура для дневника
export const keyboard_diary = [
  Keyboard.inlineKeyboard([
    [Keyboard.button.callback('➕ Добавить прием пищи', 'diary:add_food')],
    [Keyboard.button.callback('📊 Сегодняшняя сводка', 'diary:today_summary')],
    [Keyboard.button.callback('📝 Изменить цель', 'diary:change_goal')],
    [Keyboard.button.callback('⏰ Напоминания', 'diary:reminders')]
  ])
];

// Клавиатура для выбора способа добавления пищи
export const keyboard_food_input = [
  Keyboard.inlineKeyboard([
    [Keyboard.button.callback('📝 Ввести продукт', 'food:manual_input')],
    [Keyboard.button.callback('⭐ Из любимых', 'food:favorites')]
  ])
];

// Клавиатура для подтверждения добавления продукта
export const keyboard_confirm_food = (foodId: number) => [
  Keyboard.inlineKeyboard([
    [Keyboard.button.callback('✅ Добавить', `add_food:${foodId}`)],
    [Keyboard.button.callback('⭐ В любимые', `favorite:${foodId}`)]
  ])
];

// Клавиатура для выбора времени напоминаний
export const keyboard_reminder_times = [
  Keyboard.inlineKeyboard([
    [Keyboard.button.callback('🕘 09:00', 'reminder:09:00')],
    [Keyboard.button.callback('🕛 12:00', 'reminder:12:00')],
    [Keyboard.button.callback('🕕 18:00', 'reminder:18:00')],
    [Keyboard.button.callback('🕗 20:00', 'reminder:20:00')],
    [Keyboard.button.callback('❌ Без напоминаний', 'reminder:off')]
  ])
];

// Клавиатура для выбора, что редактировать
export const keyboard_edit_choice = [
  Keyboard.inlineKeyboard([
    [Keyboard.button.callback('👤 Имя', 'edit:name')],
    [Keyboard.button.callback('👫 Пол', 'edit:gender')],
    [Keyboard.button.callback('🎂 Возраст', 'edit:age')],
    [Keyboard.button.callback('📏 Рост', 'edit:height')],
    [Keyboard.button.callback('⚖️ Вес', 'edit:weight')],
    [Keyboard.button.callback('🏃 Активность', 'edit:activity')],
    [Keyboard.button.callback('🔄 Все данные', 'edit:all')]
  ])
];

// Клавиатура для подтверждения добавления в избранное
export const keyboard_add_to_favorites = (foodName: string, foodId: number) => [
  Keyboard.inlineKeyboard([
    [Keyboard.button.callback(`⭐ Добавить "${foodName}" в избранное`, `add_favorite:${foodId}`)],
    [Keyboard.button.callback('➡️ Продолжить', 'continue:daily')]
  ])
];

// Клавиатура для включения/выключения напоминаний
export const keyboard_reminder_choice = [
  Keyboard.inlineKeyboard([
    [Keyboard.button.callback('✅ Да, включить напоминания', 'reminder:enable')],
    [Keyboard.button.callback('❌ Нет, не нужно', 'reminder:disable')]
  ])
];