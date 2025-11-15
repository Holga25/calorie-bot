const processingCallbacks = new Set<string>();
const userLastRequest = new Map<string, number>();

export function getUserId(ctx: any): string | null {
  // Для callback от кнопок
  if (ctx.callback?.user?.user_id) {
    return String(ctx.callback.user.user_id);
  }
  if (ctx.callback?.sender?.user_id) {
    return String(ctx.callback.sender.user_id);
  }
  // Для обычных сообщений
  if (ctx.message?.sender?.user_id) {
    return String(ctx.message.sender.user_id);
  }

  if (ctx.sender?.user_id) {
    return String(ctx.sender.user_id);
  }
  if (ctx.user?.user_id) {
    return String(ctx.user.user_id);
  }
  return null;
}

// Безопасная функция отправки сообщений с клавиатурой
export async function safeReply(ctx: any, text: string, keyboard?: any) {
  try {
    if (keyboard) {
      await ctx.reply(text, { attachments: keyboard });
    } else {
      await ctx.reply(text);
    }
  } catch (error) {
    console.error('❌ Error in safeReply:', error);
    try {
      await ctx.reply(text);
    } catch (secondError) {
      console.error('❌ Failed to send message even without keyboard:', secondError);
    }
  }
}

// Функция для задержки
export function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 🔒 ЗАЩИТА ОТ МНОЖЕСТВЕННЫХ НАЖАТИЙ
export function isProcessing(userId: string, callbackData: string): boolean {
  const key = `${userId}:${callbackData}`;
  return processingCallbacks.has(key);
}

export function startProcessing(userId: string, callbackData: string): void {
  const key = `${userId}:${callbackData}`;
  processingCallbacks.add(key);
}

export function endProcessing(userId: string, callbackData: string): void {
  const key = `${userId}:${callbackData}`;
  processingCallbacks.delete(key);
}

// ⏱️ ИЗМЕРЕНИЕ ВРЕМЕНИ ВЫПОЛНЕНИЯ
export async function measureTime<T>(name: string, operation: () => Promise<T>): Promise<T> {
  const start = Date.now();
  try {
    const result = await operation();
    const duration = Date.now() - start;
    console.log(`⏱️ ${name} completed in ${duration}ms`);
    if (duration > 1000) {
      console.warn(`🚨 ${name} took too long: ${duration}ms`);
    }
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`⏱️ ${name} failed after ${duration}ms:`, error);
    throw error;
  }
}

// 🔄 ОГРАНИЧЕНИЕ ЧАСТОТЫ ЗАПРОСОВ
export function canProcessRequest(userId: string): boolean {
  const lastRequest = userLastRequest.get(userId);
  const now = Date.now();

  if (lastRequest && now - lastRequest < 500) { // 500ms между запросами
    return false;
  }

  userLastRequest.set(userId, now);
  return true;
}

// 🔧 ИСПРАВЛЕНИЕ: Безопасная обработка callback ответов
// 🔧 ИСПРАВЛЕНИЕ: Безопасная обработка callback ответов
export async function safeAnswerCallback(ctx: any): Promise<void> {
  try {
    if (ctx.answerOnCallback) {
      // Передаем пустое уведомление вместо вызова без параметров
      await ctx.answerOnCallback({ notification: '' });
    }
  } catch (error) {
    console.log('Callback answer failed:', error);
  }
}

export function ensureString(input: string | undefined | null): string {
  if (input === undefined || input === null) {
    return '';
  }
  return String(input).trim();
}