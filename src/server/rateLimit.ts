import { tooManyRequests } from './http'

// Счётчик неудачных попыток в памяти процесса: приложение работает в одном экземпляре,
// а сброс счётчиков при перезапуске не критичен
const MAX_FAILURES = 5
const LOCK_MS = 15 * 60 * 1000

const failures = new Map<string, { count: number, resetAt: number }>()

export function assertNotLocked(key: string) {
  const entry = failures.get(key)
  if (entry && entry.resetAt > Date.now() && entry.count >= MAX_FAILURES) {
    const minutes = Math.ceil((entry.resetAt - Date.now()) / 60_000)
    throw tooManyRequests(`Слишком много неверных попыток, попробуйте через ${minutes} мин.`)
  }
}

export function registerFailure(key: string) {
  const now = Date.now()
  let entry = failures.get(key)
  if (!entry || entry.resetAt <= now) {
    entry = { count: 0, resetAt: now + LOCK_MS }
    failures.set(key, entry)
  }
  entry.count++
}

export function resetFailures(key: string) {
  failures.delete(key)
}
