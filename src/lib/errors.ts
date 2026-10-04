// Подпись данных Telegram не прошла проверку или устарела: помогает только перезапуск приложения
export const TELEGRAM_EXPIRED = 'telegram_expired'

export class ApiError extends Error {
  constructor(public status: number, message: string, public code?: string) {
    super(message)
  }
}

export function getErrorMessage(error: unknown, fallback = 'Что-то пошло не так'): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (typeof error === 'string' && error) {
    return error
  }
  return fallback
}
