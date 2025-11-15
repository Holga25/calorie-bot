import Database from 'better-sqlite3';

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
  reminders_enabled: number;
  reminder_time: string;
  created_at: string;
  updated_at: string;
}

export interface FoodEntry {
  id: number;
  user_id: string;
  food_name: string;
  calories: number;
  entry_date: string;
  created_at: string;
}

export interface FoodItem {
  id: number;
  name: string;
  calories_per_100g: number;
  category: string;
  created_at: string;
}

export class DatabaseManager {
  private db: Database.Database;

  constructor() {
    this.db = new Database('calorie_bot.db');
    this.initDatabase();
  }

  private initDatabase() {
    // Пользователи
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS users (
                                         user_id TEXT PRIMARY KEY,
                                         name TEXT NOT NULL,
                                         gender TEXT CHECK(gender IN ('male', 'female')),
        age INTEGER,
        height INTEGER,
        weight INTEGER,
        activity REAL,
        goal TEXT CHECK(goal IN ('maintain', 'loss', 'gain')),
        daily_calories INTEGER,
        step TEXT DEFAULT 'name',
        reminders_enabled INTEGER DEFAULT 0,
        reminder_time TEXT DEFAULT '20:00',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Записи о питании
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS food_entries (
                                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                                user_id TEXT NOT NULL,
                                                food_name TEXT NOT NULL,
                                                calories INTEGER NOT NULL,
                                                entry_date DATE DEFAULT CURRENT_DATE,
                                                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                                FOREIGN KEY (user_id) REFERENCES users (user_id)
        )
    `);

    // База продуктов
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS foods (
                                         id INTEGER PRIMARY KEY AUTOINCREMENT,
                                         name TEXT NOT NULL UNIQUE,
                                         calories_per_100g INTEGER NOT NULL,
                                         category TEXT DEFAULT 'other',
                                         created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Любимые продукты пользователей
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_favorites (
                                                  user_id TEXT NOT NULL,
                                                  food_id INTEGER NOT NULL,
                                                  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                                                  PRIMARY KEY (user_id, food_id),
        FOREIGN KEY (user_id) REFERENCES users (user_id),
        FOREIGN KEY (food_id) REFERENCES foods (id)
        )
    `);

    // Добавляем недостающие колонки если их нет
    this.addMissingColumns();

    // Добавляем индексы для ускорения
    this.addIndexes();

    // Добавляем популярные продукты по умолчанию
    this.addDefaultFoods();
  }

  private addMissingColumns() {
    try {
      // Проверяем существование колонок и добавляем если их нет
      const tableInfo = this.db.prepare("PRAGMA table_info(users)").all();
      const columns = tableInfo.map((col: any) => col.name);

      if (!columns.includes('reminders_enabled')) {
        this.db.exec('ALTER TABLE users ADD COLUMN reminders_enabled INTEGER DEFAULT 0');
        console.log('✅ Added reminders_enabled column');
      }

      if (!columns.includes('reminder_time')) {
        this.db.exec('ALTER TABLE users ADD COLUMN reminder_time TEXT DEFAULT \'20:00\'');
        console.log('✅ Added reminder_time column');
      }
    } catch (error) {
      console.error('❌ Error adding missing columns:', error);
    }
  }

  private addIndexes() {
    try {
      // Индексы для ускорения поиска
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_food_entries_user_date
          ON food_entries(user_id, entry_date)
      `);

      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_foods_name
          ON foods(name)
      `);

      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_user_favorites
          ON user_favorites(user_id, food_id)
      `);

      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_users_updated
          ON users(updated_at)
      `);

      console.log('✅ Database indexes created');
    } catch (error) {
      console.error('❌ Error creating indexes:', error);
    }
  }

  private addDefaultFoods() {
    const defaultFoods = [
      ['яблоко', 52],
      ['банан', 89],
      ['апельсин', 47],
      ['куриная грудка', 165],
      ['говядина', 250],
      ['рис', 130],
      ['гречка', 110],
      ['овсянка', 68],
      ['хлеб', 265],
      ['яйцо', 155],
      ['молоко', 42],
      ['творог', 145],
      ['сыр', 402],
      ['йогурт', 59],
      ['картофель', 77],
      ['морковь', 41],
      ['помидор', 18],
      ['огурец', 15],
      ['лосось', 208],
      ['тунец', 184]
    ];

    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO foods (name, calories_per_100g) 
      VALUES (?, ?)
    `);

    defaultFoods.forEach(([name, calories]) => {
      stmt.run(name, calories);
    });
  }

  // 🔧 ИСПРАВЛЕННЫЕ МЕТОДЫ - убраны Promise и measureTime
  getUser(userId: string): UserData | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE user_id = ?');
    const result = stmt.get(userId) as UserData | undefined;
    return result || null;
  }

  createUser(userId: string, name: string): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO users (user_id, name, step) 
      VALUES (?, ?, 'name')
    `);
    stmt.run(userId, name);
  }

  updateUserStep(userId: string, step: string): void {
    const stmt = this.db.prepare('UPDATE users SET step = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?');
    stmt.run(step, userId);
  }

  updateUserData(userId: string, data: Partial<UserData>): void {
    const stmt = this.db.prepare(`
      UPDATE users
      SET name = ?, gender = ?, age = ?, height = ?, weight = ?,
          activity = ?, goal = ?, daily_calories = ?, step = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);
    stmt.run(
      data.name, data.gender, data.age, data.height, data.weight,
      data.activity, data.goal, data.daily_calories, data.step, userId
    );
  }

  addFoodEntry(userId: string, foodName: string, calories: number): void {
    const stmt = this.db.prepare(`
      INSERT INTO food_entries (user_id, food_name, calories)
      VALUES (?, ?, ?)
    `);
    stmt.run(userId, foodName, calories);
  }

  getTodayFoodEntries(userId: string): FoodEntry[] {
    const stmt = this.db.prepare(`
      SELECT * FROM food_entries
      WHERE user_id = ? AND entry_date = DATE('now')
      ORDER BY created_at DESC
    `);
    return stmt.all(userId) as FoodEntry[];
  }

  clearUserFoodEntries(userId: string): void {
    const stmt = this.db.prepare('DELETE FROM food_entries WHERE user_id = ?');
    stmt.run(userId);
  }

  addFoodToDatabase(name: string, calories: number, category: string = 'other'): void {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO foods (name, calories_per_100g, category) 
      VALUES (?, ?, ?)
    `);
    stmt.run(name.toLowerCase(), calories, category);
  }

  searchFood(query: string): FoodItem[] {
    const stmt = this.db.prepare(`
      SELECT * FROM foods
      WHERE name LIKE ?
      ORDER BY
        CASE WHEN name = ? THEN 1 
             WHEN name LIKE ? THEN 2
             ELSE 3 END,
        name
      LIMIT 10
    `);
    return stmt.all(
      `%${query.toLowerCase()}%`,
      query.toLowerCase(),
      `${query.toLowerCase()}%`
    ) as FoodItem[];
  }

  getFoodById(foodId: number): FoodItem | null {
    const stmt = this.db.prepare('SELECT * FROM foods WHERE id = ?');
    const result = stmt.get(foodId) as FoodItem | undefined;
    return result || null;
  }

  addToFavorites(userId: string, foodId: number): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO user_favorites (user_id, food_id) 
      VALUES (?, ?)
    `);
    stmt.run(userId, foodId);
  }

  getUserFavorites(userId: string): FoodItem[] {
    const stmt = this.db.prepare(`
      SELECT f.* FROM foods f
      JOIN user_favorites uf ON f.id = uf.food_id
      WHERE uf.user_id = ?
      ORDER BY f.name
    `);
    return stmt.all(userId) as FoodItem[];
  }

  setReminderSettings(userId: string, enabled: boolean, time: string = '20:00'): void {
    const stmt = this.db.prepare(`
      UPDATE users
      SET reminders_enabled = ?, reminder_time = ?, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);
    stmt.run(enabled ? 1 : 0, time, userId);
    console.log(`✅ Reminder settings updated for user ${userId}: enabled=${enabled}, time=${time}`);
  }

  getReminderSettings(userId: string): { enabled: boolean; time: string } {
    const stmt = this.db.prepare('SELECT reminders_enabled, reminder_time FROM users WHERE user_id = ?');
    const result = stmt.get(userId) as { reminders_enabled: number; reminder_time: string } | undefined;

    return {
      enabled: !!result?.reminders_enabled,
      time: result?.reminder_time || '20:00'
    };
  }

  close() {
    this.db.close();
  }
}

export const db = new DatabaseManager();