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