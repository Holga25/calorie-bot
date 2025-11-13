// описание структуры данных одного пользователя
export interface UserData {
  name: string;
  gender: 'male' | 'female' | null;
  age: number | null;
  height: number | null;
  weight: number | null;
  activity: number | null;
  // Текущий шаг регистрации
  step: 'name' | 'gender' | 'age' | 'height' | 'weight' | 'activity' | 'confirmation' | 'done';
  goal: 'maintain' | 'loss' | 'gain' | null;
  dailyCalories: number | null;
  foodEntries: FoodEntry[];
}

export interface FoodEntry {
  id: string;
  food: string;
  calories: number;
  timestamp: Date;
}

// Хранит данные пользователей в памяти (в реальном проекте — заменить на БД).
export class UserManager {
  // Map для хранения данных: ключ — user_id (строка), значение — UserData
  private users = new Map<string, UserData>();

  // Возвращает данные пользователя по его ID, если он существует
  getUser(userId: string): UserData | undefined {
    return this.users.get(userId);
  }

  // Создаёт нового пользователя с начальным состоянием регистрации
  createUser(userId: string): void {
    this.users.set(userId, {
      name: '',
      gender: null,
      age: null,
      height: null,
      weight: null,
      activity: null,
      step: 'name',
      goal: null,
      dailyCalories: null,
      foodEntries: []
    });
  }

  // Сброс данных пользователя
  resetUser(userId: string): void {
    const user = this.users.get(userId);
    if (user) {
      user.name = '';
      user.gender = null;
      user.age = null;
      user.height = null;
      user.weight = null;
      user.activity = null;
      user.step = 'name';
      user.goal = null;
      user.dailyCalories = null;
      user.foodEntries = [];
    }
  }

  // Начать расчет калорий (сброс до шага пола)
  startCalculation(userId: string): void {
    const user = this.users.get(userId);
    if (user) {
      user.gender = null;
      user.age = null;
      user.height = null;
      user.weight = null;
      user.activity = null;
      user.step = 'gender';
    }
  }

  // Сохраняет имя пользователя и переводит его на следующий шаг
  setUserName(userId: string, name: string): void {
    const user = this.users.get(userId);
    if (user) {
      user.name = name.trim();
      user.step = 'gender';
    }
  }

  setGender(userId: string, gender: 'male' | 'female'): void {
    const user = this.users.get(userId);
    if (user) {
      user.gender = gender;
      user.step = 'age';
    }
  }

  setAge(userId: string, age: number): void {
    const user = this.users.get(userId);
    if (user) {
      user.age = age;
      user.step = 'height';
    }
  }

  // Сохраняет рост и переходит к запросу веса
  setHeight(userId: string, height: number): void {
    const user = this.users.get(userId);
    if (user) {
      user.height = height;
      user.step = 'weight';
    }
  }

  // Сохраняет вес и переходит к выбору уровня активности
  setWeight(userId: string, weight: number): void {
    const user = this.users.get(userId);
    if (user) {
      user.weight = weight;
      user.step = 'activity';
    }
  }

  // Сохраняет активность и переходит к проверке
  setActivity(userId: string, activity: number): void {
    const user = this.users.get(userId);
    if (user) {
      user.activity = activity;
      user.step = 'confirmation';
    }
  }

  // Завершение регистрации
  confirmData(userId: string): void {
    const user = this.users.get(userId);
    if (user) {
      user.step = 'done';
    }
  }

  // Установить цель пользователя
  setGoal(userId: string, goal: 'maintain' | 'loss' | 'gain', dailyCalories: number): void {
    const user = this.users.get(userId);
    if (user) {
      user.goal = goal;
      user.dailyCalories = dailyCalories;
      user.foodEntries = [];
    }
  }

  // Добавить запись о питании
  addFoodEntry(userId: string, food: string, calories: number): void {
    const user = this.users.get(userId);
    if (user) {
      const entry: FoodEntry = {
        id: Date.now().toString(),
        food: food,
        calories: calories,
        timestamp: new Date()
      };
      user.foodEntries.push(entry);
    }
  }

  // Получить сегодняшние записи о питании
  getTodayFoodEntries(userId: string): FoodEntry[] {
    const user = this.users.get(userId);
    if (!user) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return user.foodEntries.filter(entry => {
      const entryDate = new Date(entry.timestamp);
      entryDate.setHours(0, 0, 0, 0);
      return entryDate.getTime() === today.getTime();
    });
  }

  // Получить сумму калорий за сегодня
  getTodayCalories(userId: string): number {
    const todayEntries = this.getTodayFoodEntries(userId);
    return todayEntries.reduce((sum, entry) => sum + entry.calories, 0);
  }

  // Получить мотивационное сообщение
  getMotivationalMessage(userId: string): string {
    const user = this.users.get(userId);
    if (!user || !user.dailyCalories) return '';

    const todayCalories = this.getTodayCalories(userId);
    const remaining = user.dailyCalories - todayCalories;
    const percentage = (todayCalories / user.dailyCalories) * 100;

    if (percentage < 70) {
      return `Отлично! Ты съел ${todayCalories} ккал из ${user.dailyCalories}. Осталось ${remaining} ккал. Продолжай в том же духе! 💪`;
    } else if (percentage >= 70 && percentage <= 100) {
      return `Хорошая работа! ${todayCalories} ккал из ${user.dailyCalories}. Почти у цели! 🎯`;
    } else if (percentage > 100 && percentage <= 120) {
      return `Ты немного перебрал: ${todayCalories} ккал из ${user.dailyCalories}. Не переживай, завтра новый день! 🌟`;
    } else {
      return `Сегодня было много калорий: ${todayCalories} ккал. Отдохни и завтра начни с чистого листа! 💫`;
    }
  }

  // Расчет калорий по формуле Миффлина-Сан Жеора
  calculateCalories(userId: string): string | null {
    const user = this.users.get(userId);
    if (!user || !user.gender || !user.age || !user.height || !user.weight || !user.activity) {
      return null;
    }

    // Формула Миффлина-Сан Жеора
    let bmr: number;
    if (user.gender === 'male') {
      bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age + 5;
    } else {
      bmr = 10 * user.weight + 6.25 * user.height - 5 * user.age - 161;
    }

    // Умножаем на коэффициент активности
    const dailyCalories = Math.round(bmr * user.activity);

    // Расчет для похудения/набора массы
    const weightLossCalories = Math.round(dailyCalories * 0.85);
    const weightGainCalories = Math.round(dailyCalories * 1.15);

    return (
      `🍎 РАСЧЕТ СУТОЧНОЙ НОРМЫ КАЛОРИЙ\n\n` +
      `По формуле Миффлина-Сан Жеора:\n\n` +
      `• Поддержание веса: ${dailyCalories} ккал/день\n` +
      `• Похудение: ${weightLossCalories} ккал/день\n` +
      `• Набор массы: ${weightGainCalories} ккал/день\n\n` +
      `📊 Ваши данные:\n` +
      `- Пол: ${user.gender === 'male' ? 'Мужской' : 'Женский'}\n` +
      `- Возраст: ${user.age} лет\n` +
      `- Рост: ${user.height} см\n` +
      `- Вес: ${user.weight} кг\n` +
      `- Активность: ${this.getActivityText(user.activity)}\n\n` +
      `💡 Советы:\n` +
      `• Для точного результата взвешивайтесь утром натощак\n` +
      `• Пейте достаточное количество воды\n` +
      `• Сочетайте питание с физической активностью`
    );
  }

  // Расчет калорий с возвратом всех значений
  calculateAllCalories(userId: string): { maintain: number; loss: number; gain: number } | null {
    const user = this.users.get(userId);
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

  private getActivityText(activity: number): string {
    const activities: { [key: number]: string } = {
      1.2: 'Минимальная (сидячий образ жизни)',
      1.375: 'Низкая (тренировки 1-3 раза в неделю)',
      1.55: 'Средняя (тренировки 3-5 раз в неделю)',
      1.725: 'Высокая (тренировки 6-7 раз в неделю)',
      1.9: 'Экстра-высокая (профессиональные спортсмены)'
    };
    return activities[activity] || `Уровень ${activity}`;
  }
  // Возвращает сводку по данным пользователя
  getUserSummary(userId: string): string | null {
    const user = this.users.get(userId);
    if (!user || !user.name || !user.gender || !user.age || !user.height || !user.weight || !user.activity) {
      return null; // данные неполные
    }

    const genderText = user.gender === 'male' ? 'Мужской' : 'Женский';
    const activityText = this.getActivityText(user.activity);

    return (
      `📊 Проверь свои данные:\n\n` +
      `• Имя: ${user.name}\n` +
      `• Пол: ${genderText}\n` +
      `• Возраст: ${user.age} лет\n` +
      `• Рост: ${user.height} см\n` +
      `• Вес: ${user.weight} кг\n` +
      `• Активность: ${activityText}\n\n` +
      `Всё верно?`
    );
  }
}

export const userManager = new UserManager();