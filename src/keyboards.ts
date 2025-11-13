import { Keyboard } from '@maxhub/max-bot-api';

// Клавиатура для старта регистрации
export const keyboard_start = Keyboard.inlineKeyboard([
  [Keyboard.button.callback('Да!', 'start_registration')]
]);

// Клавиатура для выбора пола
export const keyboard_gender = Keyboard.inlineKeyboard([
  [Keyboard.button.callback('👨 Мужской', 'gender:male')],
  [Keyboard.button.callback('👩 Женский', 'gender:female')],
]);

// Клавиатура для выбора активности
export const keyboard_activity = Keyboard.inlineKeyboard([
  [Keyboard.button.callback('💺 Минимальная(сидячий образ жизни)', 'activity:1.2')],
  [Keyboard.button.callback('🚶 Низкая(тренировки 1-3 раза в неделю)', 'activity:1.375')],
  [Keyboard.button.callback('🏃 Средняя(тренировки 3-5 раз в неделю)', 'activity:1.55')],
  [Keyboard.button.callback('🚴 Высокая(тренировки 6-7 раз в неделю)', 'activity:1.725')],
  [Keyboard.button.callback('🏋️ Экстра-высокая(проф. спортсмены)', 'activity:1.9')],
]);

// Клавиатура для подтверждения данных
export const keyboard_confirmation = Keyboard.inlineKeyboard([
  [Keyboard.button.callback('✅ Да, все верно', 'confirmation:yes')],
  [Keyboard.button.callback('❌ Нет, заполнить заново', 'confirmation:no')]
]);

// Клавиатура для действий (после расчета калорий)
export const keyboard_actions = Keyboard.inlineKeyboard([
  [Keyboard.button.callback('🗑️ Удалить мои данные', 'action:delete')],
  [Keyboard.button.callback('📝 Изменить данные', 'action:edit')],
  [Keyboard.button.callback('📊 Начать следить за питанием', 'action:start_tracking')]
]);

// Клавиатура для выбора цели
export const keyboard_goal = Keyboard.inlineKeyboard([
  [Keyboard.button.callback('💪 Поддерживать вес', 'goal:maintain')],
  [Keyboard.button.callback('🏃 Похудеть', 'goal:loss')],
  [Keyboard.button.callback('📈 Набрать массу', 'goal:gain')]
]);

// Клавиатура для дневника
export const keyboard_diary = Keyboard.inlineKeyboard([
  [Keyboard.button.callback('➕ Добавить прием пищи', 'diary:add_food')],
  [Keyboard.button.callback('📊 Сегодняшняя сводка', 'diary:today_summary')],
  [Keyboard.button.callback('📝 Изменить цель', 'diary:change_goal')]
]);