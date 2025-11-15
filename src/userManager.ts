import { db, FoodItem, FoodEntry } from './database.ts';

export interface UserData {
  user_id: string;
  name: string;
  gender: 'male' | 'female' | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  activity: number | null;
  step: 'name' | 'gender' | 'age' | 'height' | 'weight' | 'activity' | 'confirmation' | 'done';
  goal: 'maintain' | 'loss' | 'gain' | null;
  daily_calories: number | null;
  created_at: string;
  updated_at: string;
}

export class UserManager {
  private lastSearchResults: { [userId: string]: FoodItem[] } = {};
  private pendingFoodInput: { [userId: string]: string } = {};
  private pendingFoodCalories: { [userId: string]: number } = {};
  private pendingFoodId: { [userId: string]: number } = {};
  private editingFields: { [userId: string]: string } = {};

  // Возвращает данные пользователя
  getUser(userId: string): UserData | null {
    const user = db.getUser(userId);
    return user || null;
  }

  // Создаёт нового пользователя
  createUser(userId: string): void {
    const existingUser = this.getUser(userId);
    if (existingUser) {
      console.log(`User ${userId} already exists, skipping creation`);
      return;
    }

    db.createUser(userId, '');
    console.log(`User ${userId} created in database`);
  }

  // Сохраняет имя пользователя
  setUserName(userId: string, name: string): void {
    const user = this.getUser(userId);
    if (user) {
      db.updateUserData(userId, {
        ...user,
        name: name.trim(),
        step: 'gender'
      });
      console.log(`User ${userId}: name set to ${name}, step changed to gender`);
    }
  }

  setGender(userId: string, gender: 'male' | 'female'): void {
    const user = this.getUser(userId);
    if (user) {
      db.updateUserData(userId, {
        ...user,
        gender,
        step: 'age'
      });
      console.log(`User ${userId}: gender set to ${gender}, step changed to age`);
    } else {
      console.log(`User ${userId} not found when setting gender`);
    }
  }

  setAge(userId: string, age: number): void {
    const user = this.getUser(userId);
    if (user) {
      db.updateUserData(userId, {
        ...user,
        age,
        step: 'height'
      });
      console.log(`User ${userId}: age set to ${age}, step changed to height`);
    } else {
      console.log(`User ${userId} not found when setting age`);
    }
  }

  setHeight(userId: string, height: number): void {
    const user = this.getUser(userId);
    if (user) {
      db.updateUserData(userId, {
        ...user,
        height,
        step: 'weight'
      });
      console.log(`User ${userId}: height set to ${height}, step changed to weight`);
    }
  }

  setWeight(userId: string, weight: number): void {
    const user = this.getUser(userId);
    if (user) {
      db.updateUserData(userId, {
        ...user,
        weight,
        step: 'activity'
      });
      console.log(`User ${userId}: weight set to ${weight}, step changed to activity`);
    }
  }

  setActivity(userId: string, activity: number): void {
    const user = this.getUser(userId);
    if (user) {
      db.updateUserData(userId, {
        ...user,
        activity,
        step: 'confirmation'
      });
      console.log(`User ${userId}: activity set to ${activity}, step changed to confirmation`);
    } else {
      console.log(`User ${userId} not found when setting activity`);
    }
  }

  // Завершение регистрации
  confirmData(userId: string): void {
    const user = this.getUser(userId);
    if (user) {
      db.updateUserData(userId, {
        ...user,
        step: 'done'
      });
      console.log(`User ${userId} confirmed data`);
    }
  }

  // Установить цель пользователя
  setGoal(userId: string, goal: 'maintain' | 'loss' | 'gain', dailyCalories: number): void {
    const user = this.getUser(userId);
    if (user) {
      db.updateUserData(userId, {
        ...user,
        goal,
        daily_calories: dailyCalories
      });
      console.log(`User ${userId} set goal: ${goal} with ${dailyCalories} calories`);
    }
  }

  // Добавить запись о питании
  addFoodEntry(userId: string, food: string, calories: number): void {
    db.addFoodEntry(userId, food, calories);
    console.log(`User ${userId} added food: ${food} (${calories} kcal)`);
  }

  // Получить сегодняшние записи о питании
  getTodayFoodEntries(userId: string): FoodEntry[] {
    return db.getTodayFoodEntries(userId);
  }

  // Получить сумму калорий за сегодня
  getTodayCalories(userId: string): number {
    const entries = this.getTodayFoodEntries(userId);
    return entries.reduce((sum, entry) => sum + entry.calories, 0);
  }

  // Получить мотивационное сообщение
  getMotivationalMessage(userId: string): string {
    const user = this.getUser(userId);
    if (!user || !user.daily_calories) return '';

    const todayCalories = this.getTodayCalories(userId);
    const remaining = user.daily_calories - todayCalories;
    const percentage = (todayCalories / user.daily_calories) * 100;

    if (todayCalories === 0) {
      return `🌟 Начни свой день с полезных привычек! Добавь первый прием пищи и двигайся к цели!`;
    } else if (percentage < 50) {
      return `💪 Отлично начинаешь! Ты съел ${todayCalories} ккал из ${user.daily_calories}. Осталось ${remaining} ккал. Продолжай в том же духе!`;
    } else if (percentage >= 50 && percentage < 80) {
      return `😊 Хорошая работа! ${todayCalories} ккал из ${user.daily_calories}. Ты на верном пути! 🎯`;
    } else if (percentage >= 80 && percentage <= 100) {
      return `🎉 Почти у цели! ${todayCalories} ккал из ${user.daily_calories}. Отличный результат!`;
    } else if (percentage > 100 && percentage <= 120) {
      return `🤗 Ты немного перебрал: ${todayCalories} ккал из ${user.daily_calories}. Не переживай, завтра новый день! Главное - не сдавайся! 🌟`;
    } else {
      return `🌙 Сегодня было много калорий: ${todayCalories} ккал. Отдохни и завтра начни с чистого листа! Помни - каждый день это новая возможность! 💫`;
    }
  }

  resetUser(userId: string): void {
    const user = this.getUser(userId);
    if (user) {
      // Обнуляем данные пользователя
      db.updateUserData(userId, {
        ...user,
        name: '',
        gender: null,
        age: null,
        height: null,
        weight: null,
        activity: null,
        goal: null,
        daily_calories: null,
        step: 'name'
      });

      // Очищаем записи о питании
      db.clearUserFoodEntries(userId);

      console.log(`User ${userId} completely reset`);
    }
  }

  // Начать расчет калорий (сброс до шага пола)
  startCalculation(userId: string): void {
    const user = this.getUser(userId);
    if (user) {
      db.updateUserData(userId, {
        ...user,
        gender: null,
        age: null,
        height: null,
        weight: null,
        activity: null,
        goal: null,
        daily_calories: null,
        step: 'gender'
      });

      // Очищаем записи о питании при начале нового расчета
      db.clearUserFoodEntries(userId);

      console.log(`User ${userId} started new calculation`);
    }
  }

  // Расчет калорий по формуле Миффлина-Сан Жеора
  calculateCalories(userId: string): string | null {
    const user = this.getUser(userId);
    if (!user || !user.gender || !user.age || !user.height || !user.weight || !user.activity) {
      return null;
    }

    let bmr: number;
    if (user.gender === 'male') {
      bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age + 5;
    } else {
      bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age - 161;
    }

    const dailyCalories = Math.round(bmr * user.activity);
    const weightLossCalories = Math.round(dailyCalories * 0.85);
    const weightGainCalories = Math.round(dailyCalories * 1.15);

    return (
      `🍎 РАСЧЕТ СУТОЧНОЙ НОРМЫ КАЛОРИЙ\n\n` +
      `По формуле Миффлина-Сан Жеора:\n\n` +
      `• 💪 Поддержание веса: ${dailyCalories} ккал/день\n` +
      `• 🏃 Похудение: ${weightLossCalories} ккал/день\n` +
      `• 📈 Набор массы: ${weightGainCalories} ккал/день\n\n` +
      `📊 Твои данные:\n` +
      `• 👫 Пол: ${user.gender === 'male' ? 'Мужской' : 'Женский'}\n` +
      `• 🎂 Возраст: ${user.age} лет\n` +
      `• 📏 Рост: ${user.height} см\n` +
      `• ⚖️ Вес: ${user.weight} кг\n` +
      `• 🏃 Активность: ${this.getActivityText(user.activity)}\n\n` +
      `💡 Советы:\n` +
      `• Для точного результата взвешивайся утром натощак\n` +
      `• Пей достаточное количество воды 💧\n` +
      `• Сочетай питание с физической активностью`
    );
  }

  // Расчет калорий с возвратом всех значений
  calculateAllCalories(userId: string): { maintain: number; loss: number; gain: number } | null {
    const user = this.getUser(userId);
    if (!user || !user.gender || !user.age || !user.height || !user.weight || !user.activity) {
      return null;
    }

    let bmr: number;
    if (user.gender === 'male') {
      bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age + 5;
    } else {
      bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age - 161;
    }

    const maintain = Math.round(bmr * user.activity);
    const loss = Math.round(maintain * 0.85);
    const gain = Math.round(maintain * 1.15);

    return { maintain, loss, gain };
  }

// Возвращает сводку по данным пользователя
  getUserSummary(userId: string): string | null {
    const user = this.getUser(userId);
    if (!user || !user.name || !user.gender || !user.age || !user.height || !user.weight || !user.activity) {
      return null;
    }

    const genderText = user.gender === 'male' ? 'Мужской' : 'Женский';
    const activityText = this.getActivityText(user.activity);

    return (
      `📊 ТВОИ ДАННЫЕ:\n\n` +
      `• 👤 Имя: ${user.name}\n` +
      `• 👫 Пол: ${genderText}\n` +
      `• 🎂 Возраст: ${user.age} лет\n` +
      `• 📏 Рост: ${user.height} см\n` +
      `• ⚖️ Вес: ${user.weight} кг\n` +
      `• 🏃 Активность: ${activityText}\n\n` +
      `Всё верно? Если нет - выбери "Нет, изменить данные" и укажи что именно нужно поправить.`
    );
  }

  // Добавить продукт в базу
  addFoodToDatabase(name: string, calories: number): void {
    db.addFoodToDatabase(name, calories);
    console.log(`Added food to database: ${name} - ${calories} kcal`);
  }

  // Добавить в любимые
  addToFavorites(userId: string, foodId: number): void {
    db.addToFavorites(userId, foodId);
    console.log(`User ${userId} added food ${foodId} to favorites`);
  }

  // Сохранить последние результаты поиска
  setLastSearchResults(userId: string, results: FoodItem[]): void {
    this.lastSearchResults[userId] = results;
  }

  // Получить последние результаты поиска
  getLastSearchResults(userId: string): FoodItem[] | null {
    return this.lastSearchResults[userId] || null;
  }

  // Очистить результаты поиска
  clearLastSearchResults(userId: string): void {
    delete this.lastSearchResults[userId];
  }

  // Сохранить ожидающий ввод продукта
  setPendingFood(userId: string, foodName: string): void {
    this.pendingFoodInput[userId] = foodName;
  }

  // Получить ожидающий ввод продукта
  getPendingFood(userId: string): string | null {
    return this.pendingFoodInput[userId] || null;
  }
  getPendingFoodId(userId: string): number | null {
      return this.pendingFoodId[userId] || null;
  }
  // Очистить ожидающий ввод
  clearPendingFood(userId: string): void {
    delete this.pendingFoodInput[userId];
  }

  // Сохранить калорийность ожидающего продукта
  setPendingFoodCalories(userId: string, calories: number): void {
    this.pendingFoodCalories[userId] = calories;
  }

  // Получить калорийность ожидающего продукта
  getPendingFoodCalories(userId: string): number | null {
    return this.pendingFoodCalories[userId] || null;
  }

  // Очистить калорийность ожидающего продукта
  clearPendingFoodCalories(userId: string): void {
    delete this.pendingFoodCalories[userId];
  }

  // Сохранить ID ожидающего продукта
  setPendingFoodId(userId: string, foodId: number): void {
    this.pendingFoodId[userId] = foodId;
  }

  // Очистить ID ожидающего продукта
  clearPendingFoodId(userId: string): void {
    delete this.pendingFoodId[userId];
  }

  // Установить поле для редактирования
  setEditingField(userId: string, field: string): void {
    this.editingFields[userId] = field;
  }

  // Получить текущее поле для редактирования
  getEditingField(userId: string): string | null {
    return this.editingFields[userId] || null;
  }

  // Очистить поле редактирования
  clearEditingField(userId: string): void {
    delete this.editingFields[userId];
  }
  // Обновить конкретное поле пользователя
  updateUserField(userId: string, field: string, value: any): void {
    const user = this.getUser(userId);
    if (user) {
      const updateData: Partial<UserData> = { ...user };
      (updateData as any)[field] = value;

      db.updateUserData(userId, updateData);
      console.log(`User ${userId} updated field ${field} to ${value}`);
    }
  }
  isFavorite(userId: string, foodId: number): boolean {
      const favorites = db.getUserFavorites(userId);
      return favorites.some(fav => fav.id === foodId);
  }
  private getActivityText(activity: number): string {
    const activities: { [key: number]: string } = {
      1.2: 'Минимальная (сидячий образ жизни) 💺',
      1.375: 'Низкая (легкие тренировки 1-3 раза в неделю) 🚶',
      1.55: 'Средняя (тренировки 3-5 раз в неделю) 🏃',
      1.725: 'Высокая (интенсивные тренировки 6-7 раз в неделю) 🚴',
      1.9: 'Очень высокая (профессиональные спортсмены) 🏋️'
    };
    return activities[activity] || `Уровень ${activity}`;
  }
}

export const userManager = new UserManager();