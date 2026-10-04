import { create } from 'zustand'

interface SessionState {
  // Данные входа Telegram устарели — показываем экран с просьбой перезапустить приложение
  telegramExpired: boolean
  expireTelegram: () => void
}

export const useSessionStore = create<SessionState>(set => ({
  telegramExpired: false,
  expireTelegram: () => set({ telegramExpired: true }),
}))
