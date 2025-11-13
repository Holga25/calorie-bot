export function getUserId(ctx: any): string | null {
  console.log('getUserId context:', {
    messageSender: ctx.message?.sender?.user_id,
    callbackUser: ctx.callback?.user?.user_id,
    callbackSender: ctx.callback?.sender?.user_id,
    user: ctx.user?.user_id
  });

  // Для callback от кнопок - правильный путь к user_id
  if (ctx.callback?.user?.user_id) {
    return String(ctx.callback.user.user_id);
  }
  // Альтернативный путь для callback
  if (ctx.callback?.sender?.user_id) {
    return String(ctx.callback.sender.user_id);
  }
  // Для обычных сообщений
  if (ctx.message?.sender?.user_id) {
    return String(ctx.message.sender.user_id);
  }
  // Для других случаев
  if (ctx.sender?.user_id) {
    return String(ctx.sender.user_id);
  }
  if (ctx.user?.user_id) {
    return String(ctx.user.user_id);
  }
  console.log('No user_id found in context');
  return null;
}