import { shareURL } from '@tma.js/sdk-react'
import { telegramGameLink } from './links'
import { isTelegram } from './platform'

// Ссылка на игру: через мини-приложение, если его адрес настроен (друзья откроют её прямо в Telegram),
// иначе — на сайт
export function gameLink(gameId: string, telegramAppUrl: string | null | undefined) {
  return telegramAppUrl ? telegramGameLink(telegramAppUrl, gameId) : `${window.location.origin}/games/${gameId}`
}

export type ShareResult = 'shared' | 'copied' | 'cancelled'

// В Telegram — выбор чата, в браузере — системное меню «Поделиться», а без него — копирование ссылки
export async function shareLink(url: string, text: string): Promise<ShareResult> {
  if (isTelegram()) {
    shareURL(url, text)
    return 'shared'
  }
  if (navigator.share) {
    try {
      await navigator.share({ url, text })
      return 'shared'
    }
    catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        return 'cancelled'
      }
    }
  }
  await navigator.clipboard.writeText(url)
  return 'copied'
}
