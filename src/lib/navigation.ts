import { retrieveLaunchParams } from '@tma.js/sdk-react'
import { gameIdFromStartParam } from './links'
import { isTelegram } from './platform'

/*
 * Своя нумерация записей истории. window.history.length не говорит, где мы сейчас и чьи это записи,
 * поэтому номер записи кладём в history.state: так «назад» на первой открытой странице
 * (по ссылке или после перезагрузки) ведёт к родительскому экрану, а не из приложения.
 */
const INDEX_KEY = '__fpIdx'
let index = 0

export function installHistoryTracking() {
  const history = window.history as History & { __fpTracked?: boolean }
  if (history.__fpTracked) {
    return
  }
  history.__fpTracked = true
  index = history.state?.[INDEX_KEY] ?? 0

  const push = history.pushState.bind(history)
  const replace = history.replaceState.bind(history)
  history.pushState = (data, unused, url) => {
    index++
    push({ ...data, [INDEX_KEY]: index }, unused, url)
  }
  history.replaceState = (data, unused, url) => {
    replace({ ...data, [INDEX_KEY]: index }, unused, url)
  }
  window.addEventListener('popstate', (e) => {
    index = e.state?.[INDEX_KEY] ?? 0
  })
}

export function canGoBack() {
  return index > 0
}

// Родительский экран: /groups/1/seasons/2 → /groups/1, /groups/1 → /groups, /players/1 → /
export function parentPath(pathname: string) {
  const parts = pathname.split('/').filter(Boolean)
  parts.pop()
  // У «seasons», «games» и «players» внутри группы своих страниц нет
  if (parts.length > 1 && ['seasons', 'games', 'players'].includes(parts.at(-1)!)) {
    parts.pop()
  }
  const path = `/${parts.join('/')}`
  return parts.length > 1 || ['/groups', '/games'].includes(path) ? path : '/'
}

/*
 * Ссылка t.me/<бот>/<приложение>?startapp=game_<id> открывает приложение сразу на игре.
 * Срабатывает один раз за запуск: отметка привязана к подписи данных запуска.
 */
const START_KEY = 'fp-start-handled'

function launchKey() {
  try {
    const params = retrieveLaunchParams()
    return { param: params.tgWebAppStartParam ?? '', key: `${params.tgWebAppStartParam}|${params.tgWebAppData?.hash}` }
  }
  catch {
    return null
  }
}

export function startPath(): string | null {
  const launch = isTelegram() ? launchKey() : null
  if (!launch) {
    return null
  }
  try {
    if (sessionStorage.getItem(START_KEY) === launch.key) {
      return null
    }
  }
  catch {}
  const gameId = gameIdFromStartParam(launch.param)
  return gameId ? `/games/${gameId}` : null
}

export function markStartHandled() {
  const launch = isTelegram() ? launchKey() : null
  if (launch) {
    try {
      sessionStorage.setItem(START_KEY, launch.key)
    }
    catch {}
  }
}
