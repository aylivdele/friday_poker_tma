import { isTMA } from '@tma.js/sdk-react'

let cached: boolean | undefined

// Открыто ли приложение внутри Telegram. На сервере всегда false.
export function isTelegram(): boolean {
  if (typeof window === 'undefined') {
    return false
  }
  if (cached === undefined) {
    try {
      cached = isTMA()
    }
    catch {
      cached = false
    }
  }
  return cached
}
