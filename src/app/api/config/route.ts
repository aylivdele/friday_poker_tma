import type { AppConfig } from '@/types/api'
import process from 'node:process'
import { requireAuth } from '@/server/auth'
import { route } from '@/server/http'

// Настройки клиента, которые задаются окружением сервера при запуске, а не при сборке
export const GET = route(async (req): Promise<AppConfig> => {
  await requireAuth(req)
  return {
    telegramAppUrl: process.env.TELEGRAM_APP_URL || null,
  }
})
